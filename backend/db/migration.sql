-- =============================================
-- STEP 1: Create roles table
-- =============================================
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  key VARCHAR(50) UNIQUE NOT NULL,
  label VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_roles_key ON roles(key);

-- =============================================
-- STEP 2: Create permissions table
-- =============================================
CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  label VARCHAR(150) NOT NULL,
  category VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_permissions_key ON permissions(key);

-- =============================================
-- STEP 3: Create role_permissions junction table
-- =============================================
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_rp_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_rp_permission_id ON role_permissions(permission_id);

-- =============================================
-- STEP 4: Seed permissions
-- =============================================
INSERT INTO permissions (key, label, category) VALUES
  ('users:manage',      'Manage Users',         'Users'),
  ('contacts:read',     'Read Contacts',         'Contacts'),
  ('contacts:write',    'Write Contacts',        'Contacts'),
  ('contacts:delete',   'Delete Contacts',       'Contacts'),
  ('deals:read',        'Read Deals',            'Deals'),
  ('deals:write',       'Write Deals',           'Deals'),
  ('deals:delete',      'Delete Deals',          'Deals'),
  ('accounts:read',     'Read Accounts',         'Accounts'),
  ('accounts:write',    'Write Accounts',        'Accounts'),
  ('reports:view',      'View Reports',          'Reports')
ON CONFLICT (key) DO NOTHING;

-- =============================================
-- STEP 5: Seed roles
-- =============================================
INSERT INTO roles (key, label, description) VALUES
  ('admin',  'Administrator', 'Full access including user management'),
  ('editor', 'Editor',        'Read and write access'),
  ('viewer', 'Viewer',        'Read-only access')
ON CONFLICT (key) DO NOTHING;

-- =============================================
-- STEP 6: Seed role_permissions mappings
-- =============================================

-- Admin gets ALL permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.key = 'admin'
ON CONFLICT DO NOTHING;

-- Editor gets read/write (no users:manage)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.key IN (
  'contacts:read', 'contacts:write',
  'deals:read', 'deals:write',
  'accounts:read', 'accounts:write',
  'reports:view'
)
WHERE r.key = 'editor'
ON CONFLICT DO NOTHING;

-- Viewer gets read-only
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.key IN (
  'contacts:read',
  'deals:read',
  'accounts:read',
  'reports:view'
)
WHERE r.key = 'viewer'
ON CONFLICT DO NOTHING;

-- =============================================
-- STEP 7: Add role_id column to users table
-- =============================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id INTEGER REFERENCES roles(id);

-- =============================================
-- STEP 8: Migrate existing users
-- Existing users with role='admin' → admin role
-- All others → viewer role
-- =============================================
UPDATE users
SET role_id = (SELECT id FROM roles WHERE key = 'admin')
WHERE role = 'admin' AND role_id IS NULL;

UPDATE users
SET role_id = (SELECT id FROM roles WHERE key = 'viewer')
WHERE role != 'admin' AND role_id IS NULL;

-- Handle any remaining users without role column
UPDATE users
SET role_id = (SELECT id FROM roles WHERE key = 'viewer')
WHERE role_id IS NULL;

-- =============================================
-- STEP 9: Make role_id NOT NULL after migration
-- =============================================
ALTER TABLE users ALTER COLUMN role_id SET NOT NULL;

-- =============================================
-- STEP 10: Drop old role column
-- =============================================
ALTER TABLE users DROP COLUMN IF EXISTS role;
