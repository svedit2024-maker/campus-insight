import express from "express";
import mongoose from "mongoose";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import bcrypt from "bcrypt";
import session from "express-session";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import User from "../schema/schema_std.mjs";

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
        console.error("MongoDB connection error:", error);
    });


// ======================================================
// CREATE MANAGEMENT ACCOUNT
// ======================================================

async function createManagementAccount() {

    try {

        const email = process.env.MANAGEMENT_EMAIL;
        const password = process.env.MANAGEMENT_PASSWORD;

        if (!email || !password) {

            console.log(
                "Management credentials are missing from .env"
            );

            return;
        }


        // Check if management account already exists

        const existingManagement = await User.findOne({
            email: email.toLowerCase()
        });


        if (existingManagement) {

            console.log(
                "Management account already exists"
            );

            return;
        }


        // Hash management password

        const hashedPassword = await bcrypt.hash(
            password,
            12
        );


        // Create management account

        await User.create({
            name: "Management",
            email: email.toLowerCase(),
            password: hashedPassword,
            role: "management"
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


        // Check fields

        if (!name || !email || !password) {

            return res.status(400).json({
                message:
                    "Name, email and password are required"
            });

        }


        const normalizedEmail =
            email.toLowerCase().trim();


        // Check existing user

        const existingUser = await User.findOne({
            email: normalizedEmail
        });


        if (existingUser) {

            return res.status(409).json({
                message:
                    "Email already registered"
            });

        }


        // Hash password

        const hashedPassword =
            await bcrypt.hash(password, 12);


        // Create student

        const user = await User.create({

            name,

            email: normalizedEmail,

            password: hashedPassword,

            role: "student"

        });


        // Create session

        req.session.userId = user._id;

        req.session.role = "student";


        res.status(201).json({

            message:
                "Registration successful"

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


        // Check fields

        if (!email || !password) {

            return res.status(400).json({

                message:
                    "Email and password are required"

            });

        }


        const normalizedEmail =
            email.toLowerCase().trim();


        // Find user

        const user = await User.findOne({

            email: normalizedEmail

        });


        if (!user) {

            return res.status(401).json({

                message:
                    "Invalid email or password"

            });

        }


        // Prevent management from using student login

        if (user.role !== "student") {

            return res.status(403).json({

                message:
                    "Please use Management Login"

            });

        }


        // Google-only account

        if (!user.password) {

            return res.status(401).json({

                message:
                    "This account uses Google Login"

            });

        }


        // Compare password

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


        // Create session

        req.session.userId = user._id;

        req.session.role = "student";


        res.status(200).json({

            message:
                "Login successful"

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


            // Check fields

            if (!email || !password) {

                return res.status(400).json({

                    message:
                        "Email and password are required"

                });

            }


            const normalizedEmail =
                email.toLowerCase().trim();


            // Find management user

            const user = await User.findOne({

                email: normalizedEmail,

                role: "management"

            });


            if (!user) {

                return res.status(401).json({

                    message:
                        "Invalid management credentials"

                });

            }


            // Compare password

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


            // Create management session

            req.session.userId = user._id;

            req.session.role = "management";


            res.status(200).json({

                message:
                    "Management login successful"

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
// MANAGEMENT AUTHENTICATION
// ======================================================

function requireManagement(req, res, next) {

    if (!req.session.userId) {

        return res.status(401).json({

            message:
                "Please login first"

        });

    }


    if (req.session.role !== "management") {

        return res.status(403).json({

            message:
                "Management access only"

        });

    }


    next();

}


// ======================================================
// MANAGEMENT DASHBOARD CHECK
// ======================================================

app.get(
    "/management/check",
    requireManagement,
    (req, res) => {

        res.status(200).json({

            authenticated: true,

            role: "management"

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

        if (req.session.role !== "student") {

            return res.status(403).json({

                message:
                    "Student access only"

            });

        }


        res.status(200).json({

            authenticated: true,

            role: "student"

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

        // Google accounts are students

        req.session.userId =
            req.user._id;

        req.session.role =
            "student";


        res.redirect(
            "/student/student.html"
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

            callbackURL:
                "http://localhost:3000/auth/google/callback"

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


                // Find by Google ID

                let user =
                    await User.findOne({
                        googleId: profile.id
                    });


                // If not found, check email

                if (!user) {

                    user =
                        await User.findOne({
                            email: googleEmail
                        });

                }


                // Create new student

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


                // Existing user without Google ID

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

        req.logout((logoutError) => {

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

        });

    }
);


// ======================================================
// SERVER
// ======================================================

const PORT = 3000;

app.listen(
    PORT,
    () => {

        console.log(
            `Server running on http://localhost:${PORT}`
        );

    }
);