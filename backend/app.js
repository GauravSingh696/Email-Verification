// backend/server.js
import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import sendEmail from "./sendEmail.js";
import cors from "cors";
import { pool } from "./db.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// --- initialize DB tables if not exists ---
async function initDb() {
    // create database may fail if user doesn't have privileges; assume DB exists or use DB_NAME in env
    await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255),
      email VARCHAR(255) UNIQUE,
      dob DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

    await pool.query(`
    CREATE TABLE IF NOT EXISTS otps (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255),
      otp VARCHAR(32),
      expires_at DATETIME,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

    await pool.query(`
    CREATE TABLE IF NOT EXISTS notes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      title VARCHAR(255),
      content TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

    console.log("✅ DB tables ensured");
}

initDb().catch((err) => {
    console.error("DB init error:", err);
});

// --- API ---

// Health
app.get("/ping", (req, res) => res.json({ ok: true }));

// Send OTP to email (creates an otp record with expiration)
app.post("/sendEmail", async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ Success: false, msg: "Email required" });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await pool.query("INSERT INTO otps (email, otp, expires_at) VALUES (?, ?, ?)", [
            email,
            otp,
            expiresAt,
        ]);

        const subject = "Email Verification";
        const msg = `Your OTP for email verification is ${otp}`;

        await sendEmail(email, subject, msg);
        return res.json({ Success: true, msg: "OTP sent" });
    } catch (err) {
        return res.status(500).json({ Success: false, msg: "Server error" });
    }
});

// Verify OTP (used for both signup and signin). If name+dob provided and user doesn't exist -> create user.
app.post("/verifyOtp", async (req, res) => {
    try {
        const { email, otp, name, dob } = req.body;
        if (!email || !otp) return res.status(400).json({ Success: false, msg: "Email and OTP required" });

        // find latest OTP for email not expired
        const [rows] = await pool.query(
            `SELECT * FROM otps WHERE email = ? ORDER BY created_at DESC LIMIT 1`,
            [email]
        );

        if (!rows.length) return res.status(400).json({ Success: false, msg: "No OTP found for this email" });

        const rec = rows[0];
        if (rec.expires_at < new Date()) {
            return res.status(400).json({ Success: false, msg: "OTP expired" });
        }

        if (rec.otp !== otp.toString()) {
            return res.status(400).json({ Success: false, msg: "Invalid OTP" });
        }

        // OTP valid - remove used OTPs for this email (optional)
        await pool.query("DELETE FROM otps WHERE email = ?", [email]);

        // find user
        const [urows] = await pool.query("SELECT * FROM users WHERE email = ? LIMIT 1", [email]);

        if (urows.length) {
            const user = urows[0];
            return res.json({
                Success: true,
                msg: "OTP verified (signin)",
                user: { id: user.id, name: user.name, email: user.email, dob: user.dob },
            });
        }

        // if no user and name & dob provided -> create user (signup flow)
        if (!name || !dob) {
            return res.status(400).json({ Success: false, msg: "User not found; provide name and dob to create account" });
        }

        const [ins] = await pool.query("INSERT INTO users (name, email, dob) VALUES (?, ?, ?)", [
            name,
            email,
            dob,
        ]);

        const newUserId = ins.insertId;
        return res.json({
            Success: true,
            msg: "OTP verified and user created",
            user: { id: newUserId, name, email, dob },
        });
    } catch (err) {
        return res.status(500).json({ Success: false, msg: "Server error" });
    }
});

// Get user (for dashboard)
app.get("/user/:id", async (req, res) => {
    try {
        const userId = req.params.id;
        const [rows] = await pool.query("SELECT id, name, email, dob FROM users WHERE id = ? LIMIT 1", [userId]);
        if (!rows.length) return res.status(404).json({ Success: false, msg: "User not found" });
        return res.json({ Success: true, user: rows[0] });
    } catch (err) {
        return res.status(500).json({ Success: false, msg: "Server error" });
    }
});

// Notes: create, list, delete

// create note
app.post("/notes", async (req, res) => {
    try {
        const { userId, title, content } = req.body;
        if (!userId || !title) return res.status(400).json({ Success: false, msg: "userId and title required" });
        const [result] = await pool.query("INSERT INTO notes (user_id, title, content) VALUES (?, ?, ?)", [
            userId,
            title,
            content || "",
        ]);
        return res.json({ Success: true, note: { id: result.insertId, userId, title, content } });
    } catch (err) {
        return res.status(500).json({ Success: false, msg: "Server error" });
    }
});

// get notes for user
app.get("/notes", async (req, res) => {
    try {
        const userId = req.query.userId;
        if (!userId) return res.status(400).json({ Success: false, msg: "userId required" });
        const [rows] = await pool.query("SELECT id, title, content, created_at FROM notes WHERE user_id = ? ORDER BY created_at DESC", [userId]);
        return res.json({ Success: true, notes: rows });
    } catch (err) {
        return res.status(500).json({ Success: false, msg: "Server error" });
    }
});

// delete note
app.delete("/notes/:id", async (req, res) => {
    try {
        const noteId = req.params.id;
        await pool.query("DELETE FROM notes WHERE id = ?", [noteId]);
        return res.json({ Success: true, msg: "Deleted" });
    } catch (err) {
        return res.status(500).json({ Success: false, msg: "Server error" });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Server started on http://localhost:${PORT}`);
});
