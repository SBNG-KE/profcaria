-- Migration: Professional Billing, Badges, and Post Boosting

-- 1. Create Badge Type Enum
DO $$ BEGIN
    CREATE TYPE public.badge_tier AS ENUM ('none', 'gray', 'blue', 'gold');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Professional Subscriptions Table (Mirroring Employer)
CREATE TABLE IF NOT EXISTS professional.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES professional.users(id) ON DELETE CASCADE,
    plan_type TEXT NOT NULL, -- 'basic' (gray), 'standard' (blue), 'premium' (gold)
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'cancelled', 'past_due'
    
    paystack_subscription_code TEXT,
    paystack_email_token TEXT,
    
    current_period_start TIMESTAMPTZ DEFAULT NOW(),
    current_period_end TIMESTAMPTZ NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    
    amount_paid NUMERIC(10, 2) DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_prof_subs_user_status ON professional.subscriptions(user_id, status);

-- 3. Add Badge & Ad Credits to Users (Professional)
ALTER TABLE professional.users 
ADD COLUMN IF NOT EXISTS badge_type public.badge_tier DEFAULT 'none',
ADD COLUMN IF NOT EXISTS ad_credits NUMERIC(10, 2) DEFAULT 0;

-- 4. Add Badge & Ad Credits to Companies (Employer)
ALTER TABLE employer.companies 
ADD COLUMN IF NOT EXISTS badge_type public.badge_tier DEFAULT 'none',
ADD COLUMN IF NOT EXISTS ad_credits NUMERIC(10, 2) DEFAULT 0;

-- 5. Add Boosting Fields to Posts (Professional)
ALTER TABLE professional.posts
ADD COLUMN IF NOT EXISTS is_boosted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS boost_expiry TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS boost_type TEXT; -- 'views', 'clicks', etc.

-- 6. Add Boosting Fields to Posts (Employer)
ALTER TABLE employer.posts
ADD COLUMN IF NOT EXISTS is_boosted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS boost_expiry TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS boost_type TEXT;

-- 7. Trigger to auto-update updated_at for subscriptions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_prof_subs_modtime ON professional.subscriptions;
CREATE TRIGGER update_prof_subs_modtime
    BEFORE UPDATE ON professional.subscriptions
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 8. Grant Permissions
GRANT USAGE ON SCHEMA professional TO service_role;
GRANT ALL ON professional.subscriptions TO service_role;
GRANT SELECT ON professional.subscriptions TO authenticated;
