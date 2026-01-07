-- Add allowed_country_codes column for strict filtering
-- This is a plain text array to allow database-level or fast API-level filtering without decryption
ALTER TABLE employer.jobs 
ADD COLUMN IF NOT EXISTS allowed_country_codes text[];

-- Comment: This column stores the list of countries (e.g. ['Kenya', 'USA']) allowed to view the job.
-- It is distinct from enc_target_locations (which is encrypted) to allow for search/filtering logic.
