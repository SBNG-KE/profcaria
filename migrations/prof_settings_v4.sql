-- Professional Settings V4 - Activity Logs Only
-- We do NOT modify the users table. Location data is stored in activity_logs.

-- 1. Create Activity Logs Table
CREATE TABLE IF NOT EXISTS "professional"."activity_logs" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "user_id" uuid REFERENCES "professional"."users"("id") ON DELETE CASCADE NOT NULL,
    "action" text NOT NULL, -- e.g., 'LOGIN', 'LOCATION_UPDATE', 'MFA_DISABLE'
    "ip_address" text,
    "enc_location_details" text, -- Encrypted JSON string containing {country, city, address} for privacy
    "user_agent" text,
    "created_at" timestamptz DEFAULT now() NOT NULL
);

-- 2. Indexes for Performance
CREATE INDEX IF NOT EXISTS "idx_activity_logs_user_id" ON "professional"."activity_logs"("user_id");
CREATE INDEX IF NOT EXISTS "idx_activity_logs_created_at" ON "professional"."activity_logs"("created_at" DESC);

-- 3. Security (RLS & Permissions)
ALTER TABLE "professional"."activity_logs" ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own logs
CREATE POLICY "Users can view their own activity logs"
ON "professional"."activity_logs"
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Allow inserts (usually done by service role, but good to have explicit policy if needed)
CREATE POLICY "Server can insert logs"
ON "professional"."activity_logs"
FOR INSERT
WITH CHECK (true);

-- Grants
GRANT ALL ON TABLE "professional"."activity_logs" TO service_role;
GRANT ALL ON TABLE "professional"."activity_logs" TO postgres;
GRANT SELECT ON TABLE "professional"."activity_logs" TO authenticated;
