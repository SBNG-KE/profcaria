-- Migration: Add location_type to jobs table
-- Run this migration to add support for job location types

-- Add location_type column to jobs table
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS location_type TEXT 
CHECK (location_type IN ('remote', 'onsite', 'hybrid'));

-- Set default value for existing jobs
UPDATE jobs 
SET location_type = 'remote' 
WHERE location_type IS NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_jobs_location_type ON jobs(location_type);

-- Verify the migration
SELECT COUNT(*) as total_jobs, location_type 
FROM jobs 
GROUP BY location_type;
