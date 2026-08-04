-- Add allowed_pages column to users_profiles table to support granular access control
ALTER TABLE users_profiles ADD COLUMN IF NOT EXISTS allowed_pages TEXT[];
