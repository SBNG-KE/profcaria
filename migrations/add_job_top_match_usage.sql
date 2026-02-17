
-- Create per-job top match usage tracking table
CREATE TABLE IF NOT EXISTS employer.job_top_match_usage (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id uuid NOT NULL,
    job_id uuid NOT NULL,
    usage_count integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    UNIQUE(company_id, job_id)
);

-- Index for fast lookups by company + job
CREATE INDEX IF NOT EXISTS idx_job_top_match_usage_company_job
ON employer.job_top_match_usage(company_id, job_id);

-- Enable RLS
ALTER TABLE employer.job_top_match_usage ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON employer.job_top_match_usage TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON employer.job_top_match_usage TO service_role;
GRANT SELECT ON employer.job_top_match_usage TO anon;
