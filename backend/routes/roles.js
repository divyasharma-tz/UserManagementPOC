import express from "express";
import pool from "../config/db.js";
import { protect, hasPermission } from "../middleware/auth.js";

const router = express.Router();

// GET all roles
router.get("/", protect, hasPermission("users:manage"), async (req, res) => {
  try {
    const roles = await pool.query(
      "SELECT * FROM roles ORDER BY id ASC"
    );
    res.json(roles.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching roles" });
  }
});

// GET single role with its permissions
router.get("/:id", protect, hasPermission("users:manage"), async (req, res) => {
  try {
    const roleResult = await pool.query(
      "SELECT * FROM roles WHERE id = $1",
      [req.params.id]
    );

    if (roleResult.rows.length === 0) {
      return res.status(404).json({ message: "Role not found" });
    }

    const permsResult = await pool.query(
      `SELECT p.id, p.key, p.label, p.category
       FROM role_permissions rp
       JOIN permissions p ON p.id = rp.permission_id
       WHERE rp.role_id = $1
       ORDER BY p.category, p.key`,
      [req.params.id]
    );

    res.json({ ...roleResult.rows[0], permissions: permsResult.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching role" });
  }
});

// PUT update permissions for a role (replaces entire mapping)
router.put("/:id/permissions", protect, hasPermission("users:manage"), async (req, res) => {
  const { permissions } = req.body; // array of permission keys e.g. ['users:manage','deals:read']
  const roleId = req.params.id;

  if (!Array.isArray(permissions)) {
    return res.status(400).json({ message: "permissions must be an array of keys" });
  }

  try {
    const roleCheck = await pool.query("SELECT id FROM roles WHERE id = $1", [roleId]);
    if (roleCheck.rows.length === 0) {
      return res.status(404).json({ message: "Role not found" });
    }

    // Delete existing mappings
    await pool.query("DELETE FROM role_permissions WHERE role_id = $1", [roleId]);

    // Insert new mappings
    if (permissions.length > 0) {
      const permResult = await pool.query(
        "SELECT id, key FROM permissions WHERE key = ANY($1)",
        [permissions]
      );

      for (const perm of permResult.rows) {
        await pool.query(
          "INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
          [roleId, perm.id]
        );
      }
    }

    // Return updated role with permissions
    const updated = await pool.query(
      `SELECT p.id, p.key, p.label, p.category
       FROM role_permissions rp
       JOIN permissions p ON p.id = rp.permission_id
       WHERE rp.role_id = $1
       ORDER BY p.category, p.key`,
      [roleId]
    );

    res.json({ roleId: parseInt(roleId), permissions: updated.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating role permissions" });
  }
});

export default router;
