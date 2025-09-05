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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors()); // Good to keep for local development

// --- initialize DB tables if not exists ---
async function initDb() {
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
app.get("/api/ping", (req, res) => res.json({ ok: true }));

// Send OTP
app.post("/api/sendEmail", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email)
      return res.status(400).json({ Success: false, msg: "Email required" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

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
    console.error("sendEmail error:", err);
    return res.status(500).json({ Success: false, msg: "Server error" });
  }
});

// Verify OTP
app.post("/api/verifyOtp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res
        .status(400)
        .json({ Success: false, msg: "Email and OTP required" });

    const [rows] = await pool.query(
      `SELECT * FROM otps WHERE email = ? ORDER BY created_at DESC LIMIT 1`,
      [email]
    );

    if (!rows.length)
      return res
        .status(400)
        .json({ Success: false, msg: "No OTP found for this email" });

    const rec = rows[0];
    if (rec.expires_at < new Date()) {
      return res.status(400).json({ Success: false, msg: "OTP expired" });
    }

    if (rec.otp !== otp.toString()) {
      return res.status(400).json({ Success: false, msg: "Invalid OTP" });
    }

    await pool.query("DELETE FROM otps WHERE email = ?", [email]);

    const [urows] = await pool.query(
      "SELECT * FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    if (urows.length) {
      const user = urows[0];
      return res.json({
        Success: true,
        msg: "OTP verified (signin)",
        user: { id: user.id, name: user.name, email: user.email, dob: user.dob },
      });
    }

    return res.json({
      Success: true,
      msg: "OTP verified, user not found",
      newUser: true,
    });
  } catch (err) {
    console.error("verifyOtp error:", err);
    return res.status(500).json({ Success: false, msg: "Server error" });
  }
});

// Signup after OTP verified
app.post("/api/signup", async (req, res) => {
  try {
    const { name, email, dob } = req.body;
    if (!name || !email || !dob) {
      return res
        .status(400)
        .json({ Success: false, msg: "Name, email, and DOB required" });
    }

    const [check] = await pool.query(
      "SELECT * FROM users WHERE email = ? LIMIT 1",
      [email]
    );
    if (check.length) {
      return res
        .status(400)
        .json({ Success: false, msg: "User already exists" });
    }

    const [ins] = await pool.query(
      "INSERT INTO users (name, email, dob) VALUES (?, ?, ?)",
      [name, email, dob]
    );

    return res.json({
      Success: true,
      msg: "User created successfully",
      user: { id: ins.insertId, name, email, dob },
    });
  } catch (err) {
    console.error("signup error:", err);
    return res.status(500).json({ Success: false, msg: "Server error" });
  }
});

// Get user
app.get("/api/user/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const [rows] = await pool.query(
      "SELECT id, name, email, dob FROM users WHERE id = ? LIMIT 1",
      [userId]
    );
    if (!rows.length)
      return res.status(404).json({ Success: false, msg: "User not found" });
    return res.json({ Success: true, user: rows[0] });
  } catch (err) {
    return res.status(500).json({ Success: false, msg: "Server error" });
  }
});

// Notes
app.post("/api/notes", async (req, res) => {
  try {
    const { userId, title, content } = req.body;
    if (!userId || !title)
      return res
        .status(400)
        .json({ Success: false, msg: "userId and title required" });

    const [result] = await pool.query(
      "INSERT INTO notes (user_id, title, content) VALUES (?, ?, ?)",
      [userId, title, content || ""]
    );
    return res.json({
      Success: true,
      note: { id: result.insertId, userId, title, content },
    });
  } catch (err) {
    return res.status(500).json({ Success: false, msg: "Server error" });
  }
});

app.get("/api/notes", async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId)
      return res
        .status(400)
        .json({ Success: false, msg: "userId required" });

    const [rows] = await pool.query(
      "SELECT id, title, content, created_at FROM notes WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );
    return res.json({ Success: true, notes: rows });
  } catch (err) {
    return res.status(500).json({ Success: false, msg: "Server error" });
  }
});

app.delete("/api/notes/:id", async (req, res) => {
  try {
    const noteId = req.params.id;
    await pool.query("DELETE FROM notes WHERE id = ?", [noteId]);
    return res.json({ Success: true, msg: "Deleted" });
  } catch (err) {
    return res.status(500).json({ Success: false, msg: "Server error" });
  }
});

// REMOVED app.listen()
export default app; // ADD THIS LINE