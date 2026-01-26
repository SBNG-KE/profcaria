-- 1. Create Standardized Industries Table
-- FIX: Moving to 'public' schema because 'common' is not exposed to PostgREST API by default.
DROP SCHEMA IF EXISTS common CASCADE;

CREATE TABLE IF NOT EXISTS public.industries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    category TEXT, -- e.g., 'Tech', 'Healthcare'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Data (Comprehensive List)
INSERT INTO public.industries (name, category) VALUES
('Software Development', 'Technology'),
('Artificial Intelligence', 'Technology'),
('Data Science & Analytics', 'Technology'),
('Cybersecurity', 'Technology'),
('Information Technology', 'Technology'),
('Telecommunications', 'Technology'),
('Hardware Engineering', 'Technology'),
('Fintech', 'Finance'),
('Investment Banking', 'Finance'),
('Accounting', 'Finance'),
('Insurance', 'Finance'),
('Venture Capital', 'Finance'),
('Healthcare Providers', 'Healthcare'),
('Medical Devices', 'Healthcare'),
('Pharmaceuticals', 'Healthcare'),
('Biotechnology', 'Healthcare'),
('Mental Health Care', 'Healthcare'),
('E-commerce', 'Retail'),
('Retail & Consumer Goods', 'Retail'),
('Logistics & Supply Chain', 'Operations'),
('Manufacturing', 'Operations'),
('Construction', 'Operations'),
('Energy & Utilities', 'Energy'),
('Oil & Gas', 'Energy'),
('Renewable Energy', 'Energy'),
('Education Management', 'Education'),
('E-learning', 'Education'),
('Higher Education', 'Education'),
('Research', 'Science'),
('Marketing & Advertising', 'Media'),
('Public Relations', 'Media'),
('Media Production', 'Media'),
('Entertainment', 'Media'),
('Design', 'Creative'),
('Fashion', 'Creative'),
('Legal Services', 'Legal'),
('Real Estate', 'Real Estate'),
('Hospitality & Tourism', 'Services'),
('Non-profit Organization', 'Non-profit'),
('Government Administration', 'Government')
ON CONFLICT (name) DO NOTHING;

-- 2. Add Industry to Companies
ALTER TABLE employer.companies ADD COLUMN IF NOT EXISTS industry TEXT;
-- Add index for faster filtering and algorithms
CREATE INDEX IF NOT EXISTS idx_companies_industry ON employer.companies(industry);

-- 3. Create Search Logs (Training Data)
CREATE TABLE IF NOT EXISTS professional.search_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES professional.users(id),
    query TEXT NOT NULL,
    filters JSONB, -- Store applied filters (e.g. { location: 'NY', type: 'Remote' })
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick analysis and training retrieval
CREATE INDEX IF NOT EXISTS idx_search_logs_user_created ON professional.search_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_logs_query_gin ON professional.search_logs USING gin(to_tsvector('english', query));

-- PERMISSIONS
GRANT SELECT ON public.industries TO authenticated;
GRANT SELECT ON public.industries TO service_role;
GRANT SELECT ON public.industries TO anon; -- Allow fetching for sign up if needed (usually authenticated, but good to have)

GRANT INSERT ON professional.search_logs TO authenticated;
GRANT INSERT ON professional.search_logs TO service_role;
