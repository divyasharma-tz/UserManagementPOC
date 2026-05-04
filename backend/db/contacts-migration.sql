-- Migration: Create contacts table
-- Run this in pgAdmin after migration.sql

CREATE TABLE IF NOT EXISTS contacts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(20),
  company VARCHAR(100),
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add index for faster lookups
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_created_by ON contacts(created_by);

-- Sample data (optional)
-- INSERT INTO contacts (name, email, phone, company, created_by) VALUES
-- ('John Smith', 'john.smith@example.com', '+1-555-0101', 'Acme Corp', 1),
-- ('Jane Doe', 'jane.doe@example.com', '+1-555-0102', 'Tech Solutions', 1),
-- ('Bob Wilson', 'bob.wilson@example.com', '+1-555-0103', 'Innovation Labs', 1);
