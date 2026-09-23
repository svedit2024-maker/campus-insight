
import express from "express";
import mongoose from "mongoose";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import bcrypt from "bcrypt";
import session from "express-session";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";

import User from "../schema/schema_std.mjs";
import Issue from "../schema/items.mjs";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// ======================================================
// MIDDLEWARE
// ======================================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
    express.static(
        path.join(__dirname, "../../frontend")
    )
);

// ======================================================
// SESSION
// ======================================================

app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,

        cookie: {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 1000 * 60 * 60 * 24
        }
    })
);

// ======================================================
// PASSPORT
// ======================================================

app.use(passport.initialize());
app.use(passport.session());

// ======================================================
// MONGODB
// ======================================================

mongoose
    .connect(process.env.MONGO_URI)
    .then(async () => {

        console.log("MongoDB connected");

        await createManagementAccount();

    })
    .catch((error) => {

        console.error(
            "MongoDB connection error:",
            error
        );

    });

// ======================================================
// MULTER
// ======================================================

const storage = multer.memoryStorage();

const upload = multer({
    storage,

    fileFilter: (req, file, cb) => {

        if (file.mimetype.startsWith("image/")) {

            cb(null, true);

        } else {

            cb(
                new Error(
                    "Only image files are allowed"
                )
            );

        }

    }
});

// ======================================================
// CLOUDINARY
// ======================================================

cloudinary.config({

    cloud_name:
        process.env.CLOUDINARY_CLOUD_NAME,

    api_key:
        process.env.CLOUDINARY_API_KEY,

    api_secret:
        process.env.CLOUDINARY_API_SECRET

});

// ======================================================
// CREATE MANAGEMENT ACCOUNT
// ======================================================

async function createManagementAccount() {

    try {

        const email =
            process.env.MANAGEMENT_EMAIL;

        const password =
            process.env.MANAGEMENT_PASSWORD;

        if (!email || !password) {

            console.log(
                "Management credentials are missing from .env"
            );

            return;

        }

        const existingManagement =
            await User.findOne({
                email: email.toLowerCase()
            });

        if (existingManagement) {

            console.log(
                "Management account already exists"
            );

            return;

        }

        const hashedPassword =
            await bcrypt.hash(
                password,
                12
            );

        await User.create({

            name:
                "Management",

            email:
                email.toLowerCase(),

            password:
                hashedPassword,

            role:
                "management"

        });

        console.log(
            "Management account created successfully"
        );

    } catch (error) {

        console.error(
            "Management account creation error:",
            error
        );

    }

}

// ======================================================
// HOME
// ======================================================

app.get("/", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "../../frontend/student/student_login.html"
        )
    );

});

// ======================================================
// STUDENT REGISTER PAGE
// ======================================================

app.get("/register", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "../../frontend/student/student_register.html"
        )
    );

});

// ======================================================
// STUDENT REGISTER
// ======================================================

app.post("/register", async (req, res) => {

    try {

        const {
            name,
            email,
            password
        } = req.body;

        if (!name || !email || !password) {

            return res.status(400).json({

                message:
                    "Name, email and password are required"

            });

        }

        const normalizedEmail =
            email.toLowerCase().trim();

        const existingUser =
            await User.findOne({

                email:
                    normalizedEmail

            });

        if (existingUser) {

            return res.status(409).json({

                message:
                    "Email already registered"

            });

        }

        const hashedPassword =
            await bcrypt.hash(
                password,
                12
            );

        const user =
            await User.create({

                name,

                email:
                    normalizedEmail,

                password:
                    hashedPassword,

                role:
                    "student"

            });

        req.session.userId =
            user._id;

        req.session.role =
            "student";

        req.session.save((sessionError) => {

            if (sessionError) {

                console.error(
                    "Registration session save error:",
                    sessionError
                );

                return res.status(500).json({

                    message:
                        "Session error"

                });

            }

            res.status(201).json({

                message:
                    "Registration successful"

            });

        });

    } catch (error) {

        console.error(
            "Registration error:",
            error
        );

        res.status(500).json({

            message:
                "Server error"

        });

    }

});

// ======================================================
// STUDENT LOGIN
// ======================================================

app.post("/login", async (req, res) => {

    try {

        const {
            email,
            password
        } = req.body;

        if (!email || !password) {

            return res.status(400).json({

                message:
                    "Email and password are required"

            });

        }

        const normalizedEmail =
            email.toLowerCase().trim();

        const user =
            await User.findOne({

                email:
                    normalizedEmail

            });

        if (!user) {

            return res.status(401).json({

                message:
                    "Invalid email or password"

            });

        }

        if (user.role !== "student") {

            return res.status(403).json({

                message:
                    "Please use Management Login"

            });

        }

        if (!user.password) {

            return res.status(401).json({

                message:
                    "This account uses Google Login"

            });

        }

        const passwordMatch =
            await bcrypt.compare(
                password,
                user.password
            );

        if (!passwordMatch) {

            return res.status(401).json({

                message:
                    "Invalid email or password"

            });

        }

        req.session.userId =
            user._id;

        req.session.role =
            "student";

        req.session.save((sessionError) => {

            if (sessionError) {

                console.error(
                    "Login session save error:",
                    sessionError
                );

                return res.status(500).json({

                    message:
                        "Session error"

                });

            }

            res.status(200).json({

                message:
                    "Login successful"

            });

        });

    } catch (error) {

        console.error(
            "Login error:",
            error
        );

        res.status(500).json({

            message:
                "Server error"

        });

    }

});

// ======================================================
// MANAGEMENT LOGIN
// ======================================================

app.post(
    "/management/login",
    async (req, res) => {

        try {

            const {
                email,
                password
            } = req.body;

            if (!email || !password) {

                return res.status(400).json({

                    message:
                        "Email and password are required"

                });

            }

            const normalizedEmail =
                email.toLowerCase().trim();

            const user =
                await User.findOne({

                    email:
                        normalizedEmail,

                    role:
                        "management"

                });

            if (!user) {

                return res.status(401).json({

                    message:
                        "Invalid management credentials"

                });

            }

            const passwordMatch =
                await bcrypt.compare(
                    password,
                    user.password
                );

            if (!passwordMatch) {

                return res.status(401).json({

                    message:
                        "Invalid management credentials"

                });

            }

            req.session.userId =
                user._id;

            req.session.role =
                "management";

            req.session.save((sessionError) => {

                if (sessionError) {

                    console.error(
                        "Management session save error:",
                        sessionError
                    );

                    return res.status(500).json({

                        message:
                            "Session error"

                    });

                }

                res.status(200).json({

                    message:
                        "Management login successful"

                });

            });

        } catch (error) {

            console.error(
                "Management login error:",
                error
            );

            res.status(500).json({

                message:
                    "Server error"

            });

        }

    }
);

// ======================================================
// AUTHENTICATION MIDDLEWARE
// ======================================================

function requireLogin(req, res, next) {

    if (!req.session.userId) {

        return res.status(401).json({

            message:
                "Please login first"

        });

    }

    next();

}

// ======================================================
// STUDENT AUTHENTICATION
// ======================================================

function requireStudent(req, res, next) {

    console.log(
        "========== ISSUE AUTH CHECK =========="
    );

    console.log(
        "Session:",
        req.session
    );

    console.log(
        "User ID:",
        req.session.userId
    );

    console.log(
        "Role:",
        req.session.role
    );

    if (!req.session.userId) {

        return res.status(401).json({

            message:
                "Please login first"

        });

    }

    if (req.session.role !== "student") {

        return res.status(403).json({

            message:
                "Student access only"

        });

    }

    next();

}

// ======================================================
// POST ISSUE
// ======================================================

app.post(
    "/issues",
    requireStudent,
    upload.single("photo"),

    async (req, res) => {

        try {

            console.log(
                "========== ISSUE UPLOAD =========="
            );

            const userId =
                req.session.userId;

            console.log(
                "User:",
                userId
            );

            const {
                category,
                location,
                description
            } = req.body;

            console.log(
                "Category:",
                category
            );

            console.log(
                "Location:",
                location
            );

            console.log(
                "Description:",
                description
            );

            // ==================================================
            // VALIDATE ISSUE DATA
            // ==================================================

            if (
                !category ||
                !location ||
                !description
            ) {

                return res.status(400).json({

                    message:
                        "Category, location and description are required"

                });

            }

            // ==================================================
            // IMAGE REQUIRED
            // ==================================================

            if (!req.file) {

                return res.status(400).json({

                    message:
                        "Issue image is required"

                });

            }

            console.log(
                "File exists:",
                true
            );

            console.log(
                "File name:",
                req.file.originalname
            );

            console.log(
                "File type:",
                req.file.mimetype
            );

            console.log(
                "File size:",
                req.file.size
            );

            // ==================================================
            // SEND IMAGE TO ML BACKEND
            // ==================================================

            console.log(
                "Sending image to ML backend..."
            );

            const formData =
                new FormData();

            const imageBlob =
                new Blob(
                    [
                        req.file.buffer
                    ],
                    {
                        type:
                            req.file.mimetype
                    }
                );

            formData.append(
                "file",
                imageBlob,
                req.file.originalname
            );

            const mlResponse =
                await fetch(
                    `${process.env.ML_API_URL}/predict`,
                    {
                        method:
                            "POST",

                        body:
                            formData
                    }
                );

            // ==================================================
            // CHECK ML RESPONSE
            // ==================================================

            if (!mlResponse.ok) {

                const mlError =
                    await mlResponse.text();

                console.error(
                    "ML API ERROR:",
                    mlError
                );

                return res.status(502).json({

                    message:
                        "ML prediction failed",

                    error:
                        mlError

                });

            }

            const mlPrediction =
                await mlResponse.json();

            console.log(
                "ML Prediction:",
                mlPrediction
            );

            // ==================================================
            // UNWANTED IMAGE
            // ==================================================

            if (
                mlPrediction.result ===
                "unwanted"
            ) {

                console.log(
                    "Issue rejected by ML model"
                );

                return res.status(400).json({

                    message:
                        "The uploaded image was classified as unwanted.",

                    prediction:
                        mlPrediction.result,

                    scores:
                        mlPrediction.scores

                });

            }

            // ==================================================
            // MANUAL REVIEW
            // ==================================================

            if (
                mlPrediction.result ===
                "manual_review"
            ) {

                console.log(
                    "ML classified image for manual review"
                );

            }

            // ==================================================
            // CLOUDINARY UPLOAD
            // ==================================================

            console.log(
                "Uploading image to Cloudinary..."
            );

            const cloudinaryResult =
                await new Promise(
                    (resolve, reject) => {

                        const stream =
                            cloudinary.uploader.upload_stream(
                                {
                                    folder:
                                        "issue-reports",

                                    resource_type:
                                        "image"
                                },

                                (
                                    error,
                                    result
                                ) => {

                                    if (error) {

                                        reject(
                                            error
                                        );

                                    } else {

                                        resolve(
                                            result
                                        );

                                    }

                                }
                            );

                        stream.end(
                            req.file.buffer
                        );

                    }
                );

            const photoUrl =
                cloudinaryResult.secure_url;

            console.log(
                "Cloudinary URL:",
                photoUrl
            );

            // ==================================================
            // CREATE ISSUE IN MONGODB
            // ==================================================

            const issue =
                await Issue.create({

                    userId:
                        userId,

                    category:
                        category,

                    location:
                        location,

                    description:
                        description,

                    photo:
                        photoUrl

                });

            console.log(
                "Issue created:",
                issue._id
            );

            // ==================================================
            // SUCCESS RESPONSE
            // ==================================================

            return res.status(201).json({

                message:
                    "Issue reported successfully",

                prediction:
                    mlPrediction,

                issue

            });

        } catch (error) {

            console.error(
                "========== ISSUE ERROR =========="
            );

            console.error(
                error
            );

            return res.status(500).json({

                message:
                    "Failed to report issue",

                error:
                    error.message

            });

        }

    }
);

// ======================================================
// MANAGEMENT AUTHENTICATION
// ======================================================

function requireManagement(req, res, next) {

    if (!req.session.userId) {

        return res.status(401).json({

            message:
                "Please login first"

        });

    }

    if (
        req.session.role !== "management"
    ) {

        return res.status(403).json({

            message:
                "Management access only"

        });

    }

    next();

}

// ======================================================
// MANAGEMENT SESSION CHECK
// ======================================================

app.get(
    "/management/check",
    requireManagement,

    (req, res) => {

        res.status(200).json({

            authenticated:
                true,

            role:
                "management"

        });

    }
);

// ======================================================
// STUDENT SESSION CHECK
// ======================================================

app.get(
    "/student/check",
    requireLogin,

    (req, res) => {

        if (
            req.session.role !== "student"
        ) {

            return res.status(403).json({

                message:
                    "Student access only"

            });

        }

        res.status(200).json({

            authenticated:
                true,

            role:
                "student"

        });

    }
);

// ======================================================
// GOOGLE LOGIN
// ======================================================

app.get(
    "/auth/google",

    passport.authenticate(
        "google",
        {
            scope: [
                "profile",
                "email"
            ]
        }
    )
);

// ======================================================
// GOOGLE CALLBACK
// ======================================================

app.get(
    "/auth/google/callback",

    passport.authenticate(
        "google",
        {
            failureRedirect:
                "/student/student_login.html"
        }
    ),

    (req, res) => {

        req.session.userId =
            req.user._id;

        req.session.role =
            "student";

        req.session.save(
            (sessionError) => {

                if (sessionError) {

                    console.error(
                        "Google session save error:",
                        sessionError
                    );

                    return res.redirect(
                        "/student/student_login.html"
                    );

                }

                res.redirect(
                    "/student/student.html"
                );

            }
        );

    }
);

// ======================================================
// GOOGLE STRATEGY
// ======================================================

passport.use(

    new GoogleStrategy(

        {

            clientID:
                process.env.GOOGLE_CLIENT_ID,

            clientSecret:
                process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: "http://localhost:3000/auth/google/callback"

        },

        async (
            accessToken,
            refreshToken,
            profile,
            done
        ) => {

            try {

                const googleEmail =
                    profile.emails[0].value
                        .toLowerCase();

                let user =
                    await User.findOne({

                        googleId:
                            profile.id

                    });

                if (!user) {

                    user =
                        await User.findOne({

                            email:
                                googleEmail

                        });

                }

                if (!user) {

                    user =
                        await User.create({

                            googleId:
                                profile.id,

                            name:
                                profile.displayName,

                            email:
                                googleEmail,

                            role:
                                "student"

                        });

                }

                else if (!user.googleId) {

                    user.googleId =
                        profile.id;

                    await user.save();

                }

                return done(
                    null,
                    user
                );

            } catch (error) {

                console.error(
                    "Google authentication error:",
                    error
                );

                return done(
                    error,
                    null
                );

            }

        }

    )

);

// ======================================================
// PASSPORT SERIALIZE
// ======================================================

passport.serializeUser(
    (user, done) => {

        done(
            null,
            user._id
        );

    }
);

// ======================================================
// PASSPORT DESERIALIZE
// ======================================================

passport.deserializeUser(
    async (id, done) => {

        try {

            const user =
                await User.findById(id);

            done(
                null,
                user
            );

        } catch (error) {

            done(
                error,
                null
            );

        }

    }
);

// ======================================================
// LOGOUT
// ======================================================

app.post(
    "/logout",

    (req, res) => {

        req.logout(
            (logoutError) => {

                if (logoutError) {

                    console.error(
                        "Passport logout error:",
                        logoutError
                    );

                }

                req.session.destroy(
                    (sessionError) => {

                        if (sessionError) {

                            console.error(
                                "Session destruction error:",
                                sessionError
                            );

                            return res.status(500).json({

                                message:
                                    "Logout failed"

                            });

                        }

                        res.clearCookie(
                            "connect.sid"
                        );

                        res.status(200).json({

                            message:
                                "Logout successful"

                        });

                    }
                );

            }
        );

    }
);

// ======================================================
// MANAGEMENT STATS
// ======================================================

app.get(
    "/management/stats",
    requireManagement,

    async (req, res) => {

        try {

            const total =
                await Issue.countDocuments();

            const pending =
                await Issue.countDocuments({

                    status:
                        "Pending"

                });

            const inProgress =
                await Issue.countDocuments({

                    status:
                        "In Progress"

                });

            const resolved =
                await Issue.countDocuments({

                    status:
                        "Resolved"

                });

            res.status(200).json({

                total,

                pending,

                inProgress,

                resolved

            });

        } catch (error) {

            console.error(
                "Management stats error:",
                error
            );

            res.status(500).json({

                message:
                    "Failed to fetch statistics"

            });

        }

    }
);

// ======================================================
// MANAGEMENT ISSUES
// ======================================================

app.get(
    "/management/issues",
    requireManagement,

    async (req, res) => {

        try {

            const issues =
                await Issue.find()
                    .populate(
                        "userId",
                        "name email"
                    )
                    .sort({
                        createdAt:
                            -1
                    });

            res.status(200).json({

                issues

            });

        } catch (error) {

            console.error(
                "Fetch management issues error:",
                error
            );

            res.status(500).json({

                message:
                    "Failed to fetch issues"

            });

        }

    }
);

// ======================================================
// UPDATE MANAGEMENT ISSUE
// ======================================================

app.patch(
    "/management/issues/:id",
    requireManagement,

    async (req, res) => {

        try {

            const {
                id
            } = req.params;

            const {
                status,
                managementResponse
            } = req.body;

            const allowedStatuses = [

                "Pending",

                "In Progress",

                "Resolved"

            ];

            if (
                status &&
                !allowedStatuses.includes(status)
            ) {

                return res.status(400).json({

                    message:
                        "Invalid status"

                });

            }

            const issue =
                await Issue.findById(id);

            if (!issue) {

                return res.status(404).json({

                    message:
                        "Issue not found"

                });

            }

            if (
                status !== undefined
            ) {

                issue.status =
                    status;

            }

            if (
                managementResponse !== undefined
            ) {

                issue.managementResponse =
                    managementResponse;

            }

            await issue.save();

            res.status(200).json({

                message:
                    "Issue updated successfully",

                issue

            });

        } catch (error) {

            console.error(
                "Update issue error:",
                error
            );

            res.status(500).json({

                message:
                    "Failed to update issue"

            });

        }

    }
);

// ======================================================
// STUDENT ISSUES
// ======================================================

app.get(
    "/student/issues",
    requireStudent,

    async (req, res) => {

        try {

            const issues =
                await Issue.find({

                    userId:
                        req.session.userId

                }).sort({

                    createdAt:
                        -1

                });

            res.status(200).json({

                issues

            });

        } catch (error) {

            console.error(
                "Fetch student issues error:",
                error
            );

            res.status(500).json({

                message:
                    "Failed to fetch issues"

            });

        }

    }
);

// ======================================================
// ALL ISSUES - MANAGEMENT
// ======================================================

app.get(
    "/management/all-issues",
    requireManagement,

    async (req, res) => {

        try {

            const issues =
                await Issue.find({})
                    .populate(
                        "userId",
                        "name email"
                    )
                    .select(
                        "_id userId category location description photo status managementResponse createdAt updatedAt"
                    )
                    .sort({
                        createdAt:
                            -1
                    });

            const formattedIssues =
                issues.map(
                    issue => ({

                        _id:
                            issue._id,

                        category:
                            issue.category,

                        location:
                            issue.location,

                        description:
                            issue.description,

                        photoUrl:
                            issue.photo ||
                            null,

                        status:
                            issue.status,

                        managementResponse:
                            issue.managementResponse ||
                            "",

                        createdAt:
                            issue.createdAt,

                        updatedAt:
                            issue.updatedAt,

                        userId:
                            issue.userId
                                ? {

                                    _id:
                                        issue.userId._id,

                                    name:
                                        issue.userId.name,

                                    email:
                                        issue.userId.email

                                }
                                : null

                    })
                );

            res.status(200).json({

                success:
                    true,

                issues:
                    formattedIssues

            });

        } catch (error) {

            console.error(
                "ALL ISSUES ERROR:",
                error
            );

            res.status(500).json({

                success:
                    false,

                message:
                    "Failed to fetch all issues"

            });

        }

    }
);

// ======================================================
// SERVER
// ======================================================

// ======================================================
// SERVER
// ======================================================

export default app;