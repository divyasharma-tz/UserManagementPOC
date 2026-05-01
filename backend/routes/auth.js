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

// ── SCT Exchange ──────────────────────────────────────────
// Accepts a Daylight SCT, decodes it, looks up the user in the local DB
// by email, and returns a fresh internal JWT. The frontend stores this JWT
// in localStorage and uses it exactly like the login-issued JWT.
// No other frontend or middleware code needs to change.
router.post("/sct-exchange", async (req, res) => {
  const { sct } = req.body;

  if (!sct) {
    return res.status(400).json({ message: "SCT token is required" });
  }

  try {
    let decoded;
    const DAYLIGHT_SCT_SECRET = process.env.DAYLIGHT_SCT_SECRET;

    if (DAYLIGHT_SCT_SECRET) {
      // Production: verify SCT signature with Daylight Core's secret/public key
      decoded = jwt.verify(sct, DAYLIGHT_SCT_SECRET);
      console.log("🔐 SCT decoded (verified):", JSON.stringify(decoded, null, 2));
    } else {
      // Dev mode: decode without signature verification
      decoded = jwt.decode(sct);
      console.log("🔓 SCT decoded (unverified):", JSON.stringify(decoded, null, 2));
      if (!decoded) {
        return res.status(400).json({ message: "Invalid SCT: could not decode" });
      }
    }

    // Extract claims from SCT — these are the source of truth
    const email = "brajksingh8582@gmail.com"; // Hardcoded for testing
    const sctName = decoded.name || decoded.given_name;
    const sctRole = decoded.role || decoded.roles?.[0];
    const sctPermissions = decoded.userPermissions || decoded.scope?.split(' ');
    console.error("SCT sctPermissions :", sctPermissions);
    if (!email) {
      return res.status(400).json({ message: "SCT missing identity claim (email/sub/upn)" });
    }

    // Find the user in our DB by email
    const result = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: `No local user found for '${email}'. Ask an admin to create this account.`,
      });
    }

    const userId = result.rows[0].id;

    // If SCT doesn't have name/role/permissions, fall back to DB
    let name, role, permissions;
    if (!sctName || !sctRole || !sctPermissions || sctPermissions.length === 0) {
      const userPayload = await buildUserPayload(userId);
      name = sctName || userPayload.name;
      role = sctRole || userPayload.role;
      permissions = (sctPermissions && sctPermissions.length > 0) ? sctPermissions : userPayload.permissions;
          console.error("user payload if block", permissions);
    } else {
      name = sctName;
      role = sctRole;
      permissions = sctPermissions;
      console.error("user payload else block", permissions);
    }

    // Issue JWT with id from DB, but name/email/role/permissions from SCT (or DB fallback)
    const token = generateToken({
      id: userId,
      name: name,
      email: email,
      role: role,
      permissions: permissions,
    });

    return res.json({
      token,
      user: {
        id: userId,
        name: name,
        email: email,
        role: role,
        permissions: permissions,
      },
    });
  } catch (error) {
    console.error("SCT exchange error:", error.message);
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Invalid or expired SCT" });
    }
    res.status(500).json({ message: "SCT exchange failed" });
  }
});

// ── SCT Exchange (DEV MODE - NO VALIDATION) ───────────────
// Temporary dev-only endpoint that always decodes without verification.
// Use this for testing with any JWT token while waiting for real SCT.
// DELETE THIS before production deployment.
router.post("/sct-exchange-dev", async (req, res) => {
  const { sct } = req.body;

  if (!sct) {
    return res.status(400).json({ message: "SCT token is required" });
  }

  try {
    // Always decode without verification (dev mode only)
    const decoded = jwt.decode(sct);
    console.log("🔓 SCT decoded (dev mode):", JSON.stringify(decoded, null, 2));
    if (!decoded) {
      return res.status(400).json({ message: "Invalid SCT: could not decode" });
    }

    // Extract claims from SCT — these are the source of truth
    const email = "brajksingh8582@gmail.com"; // Hardcoded for testing
    const sctName = decoded.name || decoded.given_name;
    const sctRole = decoded.role || decoded.roles?.[0];
    const sctPermissions = decoded.userPermissions || decoded.scope?.split(' ');

    if (!email) {
      return res.status(400).json({ message: "SCT missing identity claim (email/sub/upn)" });
    }

    // Find the user in our DB by email
    const result = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: `No local user found for '${email}'. Ask an admin to create this account.`,
      });
    }

    const userId = result.rows[0].id;

    // If SCT doesn't have name/role/permissions, fall back to DB
    let name, role, permissions;
    if (!sctName || !sctRole || !sctPermissions || sctPermissions.length === 0) {
      const userPayload = await buildUserPayload(userId);
      name = sctName || userPayload.name;
      role = sctRole || userPayload.role;
      permissions = (sctPermissions && sctPermissions.length > 0) ? sctPermissions : userPayload.permissions;
    } else {
      name = sctName;
      role = sctRole;
      permissions = sctPermissions;
    }

    // Issue JWT with id from DB, but name/email/role/permissions from SCT (or DB fallback)
    const token = generateToken({
      id: userId,
      name: name,
      email: email,
      role: role,
      permissions: permissions,
    });

    return res.json({
      token,
      user: {
        id: userId,
        name: name,
        email: email,
        role: role,
        permissions: permissions,
      },
    });
  } catch (error) {
    console.error("SCT exchange dev error:", error.message);
    res.status(500).json({ message: "SCT exchange failed" });
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
