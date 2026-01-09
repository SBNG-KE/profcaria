
-- Update Subscriptions Table to include Plan Details and Usage Tracking
ALTER TABLE employer.subscriptions 
ADD COLUMN IF NOT EXISTS plan_type text DEFAULT 'free',
ADD COLUMN IF NOT EXISTS billing_cycle text DEFAULT 'monthly',
ADD COLUMN IF NOT EXISTS usage_jobs integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS usage_connections integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS usage_top_matches integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_usage_reset timestamptz DEFAULT now();
