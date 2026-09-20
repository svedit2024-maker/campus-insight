import express from "express";
const app = express();
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import session from "express-session";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import User from "../schema/schema_std.mjs";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();


// =========================
// MIDDLEWARE
// =========================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../../frontend")));
// =========================
// SESSION
// =========================

app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false
    })
);


// =========================
// MONGODB
// =========================

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB connected");
    })
    .catch((err) => {
        console.log("MongoDB connection error:", err);
    });


// =========================
// normal page
// =========================
// Login page
app.get("/", (req, res) => {
    res.sendFile(
        path.join(__dirname, "../../frontend/student/student_login.html")
    );
});

// Register page
app.get("/register", (req, res) => {
    res.sendFile(
        path.join(__dirname, "../../frontend/student/student_register.html")
    );
});
// =========================
// REGISTER
// =========================

app.post("/register", async (req, res) => {

    try {

        const { name, email, password } = req.body;


        // Check fields

        if (!name || !email || !password) {

            return res.status(400).json({
                message: "Name, email and password are required"
            });

        }


        // Check existing user

        const existingUser = await User.findOne({ email });

        if (existingUser) {

            return res.status(409).json({
                message: "Email already registered"
            });

        }


        // Hash password

        const hashedPassword = await bcrypt.hash(password, 10);


        // Create user

        const user = await User.create({
            name,
            email,
            password: hashedPassword
        });


        // Create session

        req.session.userId = user._id;


        res.status(201).json({
            message: "Registration successful"
        });

    } catch (error) {

        console.error("Registration error:", error);

        res.status(500).json({
            message: "Server error"
        });

    }

});
// =========================
// LOGIN
// =========================

app.post("/login", async (req, res) => {

    try {

        const { email, password } = req.body;

        // Check fields
        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        // Find user
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        // Check password
        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        // Create session
        req.session.userId = user._id;

        res.status(200).json({
            message: "Login successful"
        });

    } catch (error) {

        console.error("Login error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
});


// =========================
// SERVER
// =========================

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

