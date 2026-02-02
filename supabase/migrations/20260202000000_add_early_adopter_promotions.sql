-- Early Adopter Promotion System
-- Professionals: First 500 users get 2 months FREE Premium
-- Employers: First 10 companies get 1 month FREE Pro

-- Add promotion fields to professional subscriptions (safe - uses IF NOT EXISTS)
ALTER TABLE professional.subscriptions 
ADD COLUMN IF NOT EXISTS is_promo BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS promo_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS promo_expires_at TIMESTAMP WITH TIME ZONE;

-- Add promotion fields to employer subscriptions (safe - uses IF NOT EXISTS)
ALTER TABLE employer.subscriptions 
ADD COLUMN IF NOT EXISTS is_promo BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS promo_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS promo_expires_at TIMESTAMP WITH TIME ZONE;

-- Create promotion tracking table (safe - uses IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS public.promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promo_code VARCHAR(50) UNIQUE NOT NULL,
    promo_type VARCHAR(50) NOT NULL,
    max_claims INT NOT NULL DEFAULT 0,
    current_claims INT NOT NULL DEFAULT 0,
    plan_granted VARCHAR(50) NOT NULL,
    duration_days INT NOT NULL DEFAULT 30,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Insert the two early adopter promotions (safe - uses ON CONFLICT)
INSERT INTO public.promotions (promo_code, promo_type, max_claims, plan_granted, duration_days, is_active)
VALUES 
    ('EARLY_PROFESSIONAL_500', 'early_adopter_professional', 494, 'premium', 60, TRUE),
    ('EARLY_EMPLOYER_10', 'early_adopter_employer', 10, 'pro', 30, TRUE)
ON CONFLICT (promo_code) DO UPDATE SET max_claims = EXCLUDED.max_claims;

-- Create promotion claims log (safe - uses IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS public.promotion_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promo_code VARCHAR(50) NOT NULL,
    user_id UUID,
    company_id UUID,
    claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Add unique constraints if they don't exist (wrapped in DO block)
DO $$
BEGIN
    -- Add foreign key if not exists
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'promotion_claims_promo_code_fkey') THEN
        ALTER TABLE public.promotion_claims ADD CONSTRAINT promotion_claims_promo_code_fkey 
            FOREIGN KEY (promo_code) REFERENCES public.promotions(promo_code);
    END IF;
    
    -- Add unique constraint for user claims if not exists
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'promotion_claims_promo_code_user_id_key') THEN
        ALTER TABLE public.promotion_claims ADD CONSTRAINT promotion_claims_promo_code_user_id_key 
            UNIQUE (promo_code, user_id);
    END IF;
    
    -- Add unique constraint for company claims if not exists  
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'promotion_claims_promo_code_company_id_key') THEN
        ALTER TABLE public.promotion_claims ADD CONSTRAINT promotion_claims_promo_code_company_id_key 
            UNIQUE (promo_code, company_id);
    END IF;
END $$;

-- Grant permissions
GRANT ALL ON public.promotions TO authenticated;
GRANT ALL ON public.promotions TO service_role;
GRANT ALL ON public.promotion_claims TO authenticated;
GRANT ALL ON public.promotion_claims TO service_role;

-- Enable RLS
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_claims ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first, then recreate
DROP POLICY IF EXISTS "Anyone can view active promotions" ON public.promotions;
DROP POLICY IF EXISTS "Service role full access promotions" ON public.promotions;
DROP POLICY IF EXISTS "Service role full access claims" ON public.promotion_claims;
DROP POLICY IF EXISTS "Users can view own claims" ON public.promotion_claims;

CREATE POLICY "Anyone can view active promotions" ON public.promotions
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Service role full access promotions" ON public.promotions
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access claims" ON public.promotion_claims
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view own claims" ON public.promotion_claims
    FOR SELECT USING (
        user_id = auth.uid() OR 
        company_id IN (SELECT id FROM employer.companies WHERE user_id = auth.uid())
    );

-- ========================================
-- GRANT FREE PREMIUM TO ALL EXISTING USERS
-- ========================================

DO $$
DECLARE
    user_record RECORD;
    expiry_date TIMESTAMP WITH TIME ZONE := NOW() + INTERVAL '60 days';
BEGIN
    FOR user_record IN SELECT id FROM professional.users LOOP
        -- Check if subscription exists
        IF EXISTS (SELECT 1 FROM professional.subscriptions WHERE user_id = user_record.id) THEN
            -- Update existing subscription to premium
            UPDATE professional.subscriptions 
            SET plan_type = 'premium',
                status = 'active',
                is_promo = TRUE,
                promo_type = 'early_adopter_professional',
                promo_expires_at = expiry_date,
                current_period_end = expiry_date
            WHERE user_id = user_record.id;
        ELSE
            -- Insert new premium subscription
            INSERT INTO professional.subscriptions (user_id, plan_type, status, is_promo, promo_type, promo_expires_at, current_period_start, current_period_end)
            VALUES (user_record.id, 'premium', 'active', TRUE, 'early_adopter_professional', expiry_date, NOW(), expiry_date);
        END IF;
        
        -- *** UPDATE BADGE TYPE TO GOLD FOR PREMIUM ***
        UPDATE professional.users 
        SET badge_type = 'gold'
        WHERE id = user_record.id;
        
        -- Record the claim (ignore if already exists)
        INSERT INTO public.promotion_claims (promo_code, user_id, expires_at)
        VALUES ('EARLY_PROFESSIONAL_500', user_record.id, expiry_date)
        ON CONFLICT ON CONSTRAINT promotion_claims_promo_code_user_id_key DO NOTHING;
    END LOOP;
    
    -- Update the current_claims count
    UPDATE public.promotions 
    SET current_claims = (SELECT COUNT(*) FROM public.promotion_claims WHERE promo_code = 'EARLY_PROFESSIONAL_500')
    WHERE promo_code = 'EARLY_PROFESSIONAL_500';
END $$;

