-- Migration: Add saved_jobs table for professionals
-- Run this in your Supabase SQL Editor

-- Create saved_jobs table in professional schema
CREATE TABLE IF NOT EXISTS professional.saved_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES professional.users(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES employer.jobs(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure a user can only save a job once
    UNIQUE(user_id, job_id)
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_saved_jobs_user_id ON professional.saved_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_job_id ON professional.saved_jobs(job_id);

-- Grant permissions to service role (for supabaseAdmin to work)
-- This is important since we're using supabaseAdmin which uses service_role
GRANT ALL ON professional.saved_jobs TO service_role;
GRANT ALL ON professional.saved_jobs TO postgres;

-- RLS policies (optional since supabaseAdmin bypasses RLS)
-- But good to have for security if you ever use anon/authenticated role
ALTER TABLE professional.saved_jobs ENABLE ROW LEVEL SECURITY;

-- Allow service_role to bypass RLS (supabaseAdmin uses this)
CREATE POLICY "Service role full access" ON professional.saved_jobs
    FOR ALL USING (true) WITH CHECK (true);

COMMENT ON TABLE professional.saved_jobs IS 'Stores jobs saved by professionals for later review';
