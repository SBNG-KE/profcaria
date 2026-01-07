-- Add max_applications to jobs table
ALTER TABLE employer.jobs 
ADD COLUMN IF NOT EXISTS max_applications INTEGER NULL;

-- Create table for Job Invites (Smart Invites)
CREATE TABLE IF NOT EXISTS employer.job_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES employer.jobs(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES professional.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending', -- pending, accepted, declined
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(job_id, professional_id)
);

-- Index for fast lookup of invites by professional
CREATE INDEX IF NOT EXISTS idx_job_invites_professional ON employer.job_invites(professional_id);
CREATE INDEX IF NOT EXISTS idx_job_invites_job ON employer.job_invites(job_id);

-- Grants
GRANT ALL ON TABLE employer.job_invites TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE employer.job_invites TO authenticated;
