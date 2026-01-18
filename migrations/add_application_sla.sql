-- Add SLA tracking columns for application response times
-- This enables tracking of employer responsiveness to candidates

-- Add reviewed_at timestamp (when employer first changes status from pending)
ALTER TABLE employer.applications ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE;

-- Add index for efficient response time queries
CREATE INDEX IF NOT EXISTS idx_applications_reviewed ON employer.applications(reviewed_at);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON employer.applications TO service_role;
GRANT SELECT, INSERT, UPDATE ON employer.applications TO postgres;
GRANT SELECT, INSERT, UPDATE ON employer.applications TO authenticated;
