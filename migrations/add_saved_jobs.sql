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

-- Add RLS policies
ALTER TABLE professional.saved_jobs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own saved jobs
CREATE POLICY "Users can view own saved jobs" ON professional.saved_jobs
    FOR SELECT USING (user_id = auth.uid()::uuid);

-- Users can insert their own saved jobs
CREATE POLICY "Users can save jobs" ON professional.saved_jobs
    FOR INSERT WITH CHECK (user_id = auth.uid()::uuid);

-- Users can delete their own saved jobs
CREATE POLICY "Users can unsave jobs" ON professional.saved_jobs
    FOR DELETE USING (user_id = auth.uid()::uuid);

COMMENT ON TABLE professional.saved_jobs IS 'Stores jobs saved by professionals for later review';
