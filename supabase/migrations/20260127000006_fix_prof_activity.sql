-- Create Activity Logs table for Professionals
CREATE TABLE IF NOT EXISTS professional.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES professional.users(id) ON DELETE CASCADE,
    enc_action TEXT NOT NULL,
    enc_ip_address TEXT,
    enc_location_details TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for fast retrieval by user
CREATE INDEX IF NOT EXISTS idx_prof_activity_user ON professional.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_prof_activity_created ON professional.activity_logs(created_at DESC);

-- Enable RLS
ALTER TABLE professional.activity_logs ENABLE ROW LEVEL SECURITY;

-- Allow user to view their own logs
CREATE POLICY "Users can view own activity logs"
ON professional.activity_logs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Explicitly Grant Permissions (REQUIRED for non-public schemas)
GRANT USAGE ON SCHEMA professional TO service_role;
GRANT ALL ON professional.activity_logs TO service_role;
GRANT SELECT ON professional.activity_logs TO authenticated;
