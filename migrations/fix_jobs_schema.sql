-- Consolidated Migration: Add location support to jobs table
-- Run this in the Supabase SQL Editor

-- 1. Add location_type (Remote, Onsite, Hybrid)
ALTER TABLE employer.jobs 
ADD COLUMN IF NOT EXISTS location_type TEXT 
DEFAULT 'remote'
CHECK (location_type IN ('remote', 'onsite', 'hybrid'));

-- 2. Add enc_location (Encrypted physical address)
ALTER TABLE employer.jobs 
ADD COLUMN IF NOT EXISTS enc_location TEXT;

-- 3. Create index for performance
CREATE INDEX IF NOT EXISTS idx_jobs_location_type ON employer.jobs(location_type);

-- 4. Set defaults for existing rows if any
UPDATE employer.jobs SET location_type = 'remote' WHERE location_type IS NULL;

-- 5. Notify PostgREST to reload schema cache
-- Note: Supabase UI usually does this automatically, but this is a fail-safe.
NOTIFY pgrst, 'reload schema';

-- Verify
SELECT id, location_type, enc_location FROM employer.jobs LIMIT 5;
