-- Add targeting columns to jobs table
ALTER TABLE employer.jobs
ADD COLUMN IF NOT EXISTS enc_target_locations TEXT, -- Encrypted JSON array of locations or "worldwide"
ADD COLUMN IF NOT EXISTS is_restricted BOOLEAN DEFAULT FALSE, -- If TRUE, only visible to target locations
ADD COLUMN IF NOT EXISTS speed_boost_location TEXT; -- Plaintext location string (e.g. "UK") for the "Speed" algo

-- Index for speed/query performance
CREATE INDEX IF NOT EXISTS idx_jobs_is_restricted ON employer.jobs(is_restricted);
