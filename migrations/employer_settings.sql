-- Employer Settings Schema
-- We do NOT modify the companies table for location. Data is stored in activity_logs.

-- 1. Create Activity Logs Table
CREATE TABLE IF NOT EXISTS "employer"."activity_logs" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "user_id" uuid REFERENCES "employer"."companies"("id") ON DELETE CASCADE NOT NULL,
    "action" text NOT NULL, -- e.g., 'LOGIN', 'LOCATION_UPDATE', 'MFA_DISABLE'
    "ip_address" text,
    "enc_location_details" text, -- Encrypted JSON string containing {country, city, address}
    "user_agent" text,
    "created_at" timestamptz DEFAULT now() NOT NULL
);

-- 2. Indexes for Performance
CREATE INDEX IF NOT EXISTS "idx_employer_activity_logs_user_id" ON "employer"."activity_logs"("user_id");
CREATE INDEX IF NOT EXISTS "idx_employer_activity_logs_created_at" ON "employer"."activity_logs"("created_at" DESC);

-- 3. Security (RLS & Permissions)
ALTER TABLE "employer"."activity_logs" ENABLE ROW LEVEL SECURITY;

-- Policy: Employers can see their own logs
CREATE POLICY "Employers can view their own activity logs"
ON "employer"."activity_logs"
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Allow inserts
CREATE POLICY "Server can insert employer logs"
ON "employer"."activity_logs"
FOR INSERT
WITH CHECK (true);

-- Grants
GRANT ALL ON TABLE "employer"."activity_logs" TO service_role;
GRANT ALL ON TABLE "employer"."activity_logs" TO postgres;
GRANT SELECT ON TABLE "employer"."activity_logs" TO authenticated;
