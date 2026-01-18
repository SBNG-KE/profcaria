-- Migration: Add Job Analytics Event Tracking
-- Purpose: Track job impressions, views, clicks, and application flow events

-- Create the job_events table in the employer schema
CREATE TABLE IF NOT EXISTS employer.job_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES employer.jobs(id) ON DELETE CASCADE,
    user_id UUID,  -- Professional user ID (can be null for anonymous)
    event_type TEXT NOT NULL, -- 'impression', 'view', 'click', 'apply_start', 'apply_abandon'
    enc_country TEXT,  -- Encrypted country for geographic reach analytics
    metadata JSONB DEFAULT '{}',  -- Additional context (e.g., form field abandoned at)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient analytics queries
CREATE INDEX IF NOT EXISTS idx_job_events_job_id ON employer.job_events(job_id);
CREATE INDEX IF NOT EXISTS idx_job_events_type ON employer.job_events(event_type);
CREATE INDEX IF NOT EXISTS idx_job_events_created ON employer.job_events(created_at);
CREATE INDEX IF NOT EXISTS idx_job_events_user ON employer.job_events(user_id);

-- Grant permissions to service roles
GRANT ALL ON TABLE employer.job_events TO service_role;
GRANT ALL ON TABLE employer.job_events TO postgres;
GRANT SELECT, INSERT ON TABLE employer.job_events TO authenticated;

-- Verify the table was created
SELECT 'employer.job_events table created successfully' AS status;
SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'employer' AND table_name = 'job_events';
