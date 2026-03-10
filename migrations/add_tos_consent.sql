-- ============================================
-- TERMS OF SERVICE CONSENT TRACKING
-- ============================================

-- 1. Shared consent log table (public schema)
CREATE TABLE IF NOT EXISTS public.tos_consents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_schema TEXT NOT NULL CHECK (user_schema IN ('professional', 'employer')),
  tos_version TEXT NOT NULL DEFAULT '1.0',
  status TEXT NOT NULL CHECK (status IN ('accepted', 'rejected')) DEFAULT 'accepted',
  ip_address TEXT,
  user_agent TEXT,
  accepted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tos_user ON public.tos_consents(user_id, user_schema);
CREATE INDEX IF NOT EXISTS idx_tos_version ON public.tos_consents(tos_version);

-- 2. Add tos_status column to professional.users
ALTER TABLE professional.users ADD COLUMN IF NOT EXISTS tos_status TEXT DEFAULT NULL;

-- 3. Add tos_status column to employer.companies
ALTER TABLE employer.companies ADD COLUMN IF NOT EXISTS tos_status TEXT DEFAULT NULL;
