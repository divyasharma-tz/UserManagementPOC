import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Helper: fetch role + permissions for a user and build JWT payload
const buildUserPayload = async (userId) => {
  const result = await pool.query(
    `SELECT u.id, u.name, u.email, r.key AS role,
            COALESCE(
              JSON_AGG(p.key) FILTER (WHERE p.key IS NOT NULL),
              '[]'
            ) AS permissions
     FROM users u
     JOIN roles r ON r.id = u.role_id
     LEFT JOIN role_permissions rp ON rp.role_id = r.id
     LEFT JOIN permissions p ON p.id = rp.permission_id
     WHERE u.id = $1
     GROUP BY u.id, u.name, u.email, r.key`,
    [userId]
  );
  return result.rows[0];
};

// JWT payload: { id, email, role, permissions[] }  expires in 1 day
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1d" });
};

// ── Register ──────────────────────────────────────────────
router.post("/register", async (req, res) => {
  const { name, email, password, roleKey = "viewer" } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Please provide all required fields" });
  }

  try {
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    const roleResult = await pool.query("SELECT id FROM roles WHERE key = $1", [roleKey]);
    if (roleResult.rows.length === 0) {
      return res.status(400).json({ message: `Role '${roleKey}' not found` });
    }
    const role_id = roleResult.rows[0].id;

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await pool.query(
      "INSERT INTO users (name, email, password, role_id) VALUES ($1, $2, $3, $4) RETURNING id",
      [name, email, hashedPassword, role_id]
    );

    const userPayload = await buildUserPayload(newUser.rows[0].id);
    const token = generateToken({
      id: userPayload.id,
      name: userPayload.name,
      email: userPayload.email,
      role: userPayload.role,
      permissions: userPayload.permissions,
    });

    return res.status(201).json({
      token,
      user: {
        id: userPayload.id,
        name: userPayload.name,
        email: userPayload.email,
        role: userPayload.role,
        permissions: userPayload.permissions,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Registration failed" });
  }
});

// ── Login ─────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Please provide all required fields" });
  }

  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const userData = result.rows[0];
    const isMatch = await bcrypt.compare(password, userData.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const userPayload = await buildUserPayload(userData.id);
    const token = generateToken({
      id: userPayload.id,
      name: userPayload.name,
      email: userPayload.email,
      role: userPayload.role,
      permissions: userPayload.permissions,
    });

    res.json({
      token,
      user: {
        id: userPayload.id,
        name: userPayload.name,
        email: userPayload.email,
        role: userPayload.role,
        permissions: userPayload.permissions,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Login failed" });
  }
});

// ── Me (decoded from JWT, no DB hit) ─────────────────────
router.get("/me", protect, (req, res) => {
  res.json(req.user);
});

// ── Logout (token lives in localStorage, cleared by client) ──
router.post("/logout", (req, res) => {
  res.json({ message: "Logged out successfully" });
});

export default router;
