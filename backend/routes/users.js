import express from "express";
import bcrypt from "bcryptjs";
import pool from "../config/db.js";
import { protect, hasPermission } from "../middleware/auth.js";

const router = express.Router();

// GET all users
router.get("/", protect, hasPermission("users:manage"), async (req, res) => {
  try {
    const users = await pool.query(
      `SELECT u.id, u.name, u.email, r.key AS role, u.created_at
       FROM users u
       JOIN roles r ON r.id = u.role_id
       ORDER BY u.created_at DESC`
    );
    res.json(users.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching users" });
  }
});

// GET single user
router.get("/:id", protect, hasPermission("users:manage"), async (req, res) => {
  try {
    const user = await pool.query(
      `SELECT u.id, u.name, u.email, r.key AS role, u.created_at
       FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE u.id = $1`,
      [req.params.id]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching user" });
  }
});

// CREATE new user
router.post("/", protect, hasPermission("users:manage"), async (req, res) => {
  const { name, email, password, roleKey = "viewer" } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const emailExists = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (emailExists.rows.length > 0) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const roleResult = await pool.query("SELECT id FROM roles WHERE key = $1", [roleKey]);
    if (roleResult.rows.length === 0) {
      return res.status(400).json({ message: `Role '${roleKey}' not found` });
    }
    const role_id = roleResult.rows[0].id;

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await pool.query(
      `INSERT INTO users (name, email, password, role_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, created_at`,
      [name, email, hashedPassword, role_id]
    );

    res.status(201).json({ ...newUser.rows[0], role: roleKey });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating user" });
  }
});

// UPDATE user
router.put("/:id", protect, hasPermission("users:manage"), async (req, res) => {
  const { name, email, roleKey } = req.body;
  const userId = req.params.id;

  try {
    const user = await pool.query("SELECT * FROM users WHERE id = $1", [userId]);
    if (user.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    if (email && email !== user.rows[0].email) {
      const emailExists = await pool.query(
        "SELECT id FROM users WHERE email = $1 AND id != $2",
        [email, userId]
      );
      if (emailExists.rows.length > 0) {
        return res.status(400).json({ message: "Email already in use" });
      }
    }

    // Resolve new role_id if roleKey provided
    let role_id = null;
    if (roleKey) {
      const roleResult = await pool.query("SELECT id FROM roles WHERE key = $1", [roleKey]);
      if (roleResult.rows.length === 0) {
        return res.status(400).json({ message: `Role '${roleKey}' not found` });
      }
      role_id = roleResult.rows[0].id;
    }

    const updatedUser = await pool.query(
      `UPDATE users
       SET name = COALESCE($1, name),
           email = COALESCE($2, email),
           role_id = COALESCE($3, role_id)
       WHERE id = $4
       RETURNING id, name, email, created_at`,
      [name || null, email || null, role_id, userId]
    );

    // Fetch role key for response
    const roleKey2 = await pool.query(
      "SELECT r.key FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = $1",
      [userId]
    );

    res.json({ ...updatedUser.rows[0], role: roleKey2.rows[0]?.key });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating user" });
  }
});

// DELETE user
router.delete("/:id", protect, hasPermission("users:manage"), async (req, res) => {
  const userId = req.params.id;

  try {
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({ message: "Cannot delete your own account" });
    }

    const user = await pool.query("SELECT id FROM users WHERE id = $1", [userId]);
    if (user.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    await pool.query("DELETE FROM users WHERE id = $1", [userId]);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting user" });
  }
});

export default router;
