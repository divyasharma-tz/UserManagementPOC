import express from "express";
import pool from "../config/db.js";
import { protect, hasPermission } from "../middleware/auth.js";

const router = express.Router();

// GET all permissions
router.get("/", protect, hasPermission("users:manage"), async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM permissions ORDER BY category, key"
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching permissions" });
  }
});

export default router;
