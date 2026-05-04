import express from "express";
import pool from "../config/db.js";
import { protect, hasPermission } from "../middleware/auth.js";

const router = express.Router();

// ── Get all contacts ──────────────────────────────────────
// Middleware: protect (verify JWT) + hasPermission("contacts:read")
// Accessible by: Admin, Editor, Viewer (all have contacts:read)
router.get("/", protect, hasPermission("contacts:read"), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, u.name as creator_name 
       FROM contacts c 
       LEFT JOIN users u ON c.created_by = u.id 
       ORDER BY c.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch contacts" });
  }
});

// ── Get single contact ────────────────────────────────────
router.get("/:id", protect, hasPermission("contacts:read"), async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT c.*, u.name as creator_name 
       FROM contacts c 
       LEFT JOIN users u ON c.created_by = u.id 
       WHERE c.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Contact not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch contact" });
  }
});

// ── Create contact ────────────────────────────────────────
// Middleware: protect + hasPermission("contacts:write")
// Accessible by: Admin, Editor (both have contacts:write)
router.post("/", protect, hasPermission("contacts:write"), async (req, res) => {
  const { name, email, phone, company } = req.body;

  if (!name || !email) {
    return res.status(400).json({ message: "Name and email are required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO contacts (name, email, phone, company, created_by) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [name, email, phone || null, company || null, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === "23505") {
      // Unique constraint violation
      return res.status(400).json({ message: "Contact with this email already exists" });
    }
    console.error(error);
    res.status(500).json({ message: "Failed to create contact" });
  }
});

// ── Update contact ────────────────────────────────────────
// Middleware: protect + hasPermission("contacts:write")
// Accessible by: Admin, Editor
router.put("/:id", protect, hasPermission("contacts:write"), async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, company } = req.body;

  if (!name || !email) {
    return res.status(400).json({ message: "Name and email are required" });
  }

  try {
    const result = await pool.query(
      `UPDATE contacts 
       SET name = $1, email = $2, phone = $3, company = $4, updated_at = NOW() 
       WHERE id = $5 
       RETURNING *`,
      [name, email, phone || null, company || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Contact not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    if (error.code === "23505") {
      return res.status(400).json({ message: "Contact with this email already exists" });
    }
    console.error(error);
    res.status(500).json({ message: "Failed to update contact" });
  }
});

// ── Delete contact ────────────────────────────────────────
// Middleware: protect + hasPermission("contacts:delete")
// Accessible by: Admin only (only admin has contacts:delete)
router.delete("/:id", protect, hasPermission("contacts:delete"), async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query("DELETE FROM contacts WHERE id = $1 RETURNING *", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Contact not found" });
    }

    res.json({ message: "Contact deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete contact" });
  }
});

export default router;
