-- Migration: Add enc_location to jobs table
-- Run this migration to add support for encrypted physical locations

ALTER TABLE employer.jobs 
ADD COLUMN IF NOT EXISTS enc_location TEXT;

-- Verify the migration
SELECT id, enc_location FROM employer.jobs LIMIT 5;
