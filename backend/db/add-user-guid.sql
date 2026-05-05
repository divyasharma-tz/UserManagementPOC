-- Migration: Add user_guid column to bridge local users with Daylight Core UUID
-- Purpose: Store Daylight Core's global user identifier from SCT token
-- Run this in pgAdmin on the pern_auth database

-- Add user_guid column (nullable initially, will populate from SCT on next login)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS user_guid VARCHAR(255);

-- Add unique constraint to ensure one-to-one mapping with Daylight Core
ALTER TABLE users 
ADD CONSTRAINT users_user_guid_unique UNIQUE (user_guid);

-- Create index for faster lookups when syncing RBAC
CREATE INDEX IF NOT EXISTS idx_users_user_guid ON users(user_guid);

-- Verify the changes
SELECT column_name, data_type, character_maximum_length, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'user_guid';
