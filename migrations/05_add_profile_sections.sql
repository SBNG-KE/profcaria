-- Migration 05: Add Profile Sections (Education, Employment, Certs, Awards, Skills, Other Profiles)

-- ==========================================
-- PROFESSIONAL SCHEMA
-- ==========================================

-- 1. Education
CREATE TABLE IF NOT EXISTS professional.education (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES professional.users(id) ON DELETE CASCADE,
    enc_school TEXT NOT NULL,
    enc_degree TEXT,
    enc_field_of_study TEXT,
    enc_start_date TEXT,
    enc_end_date TEXT,
    is_current BOOLEAN DEFAULT false,
    enc_grade TEXT,
    enc_description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Employment History (Manual entries to supplement automatic ones)
CREATE TABLE IF NOT EXISTS professional.employment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES professional.users(id) ON DELETE CASCADE,
    enc_company TEXT NOT NULL,
    enc_title TEXT NOT NULL,
    enc_location TEXT,
    enc_type TEXT, -- Full-time, Part-time, etc.
    enc_start_date TEXT,
    enc_end_date TEXT,
    is_current BOOLEAN DEFAULT false,
    enc_description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Certifications & Licenses
CREATE TABLE IF NOT EXISTS professional.certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES professional.users(id) ON DELETE CASCADE,
    enc_name TEXT NOT NULL,
    enc_issuer TEXT NOT NULL,
    enc_issue_date TEXT,
    enc_expiration_date TEXT,
    enc_credential_id TEXT,
    enc_credential_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Honors & Awards
CREATE TABLE IF NOT EXISTS professional.awards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES professional.users(id) ON DELETE CASCADE,
    enc_title TEXT NOT NULL,
    enc_issuer TEXT,
    enc_date TEXT,
    enc_description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Skills
CREATE TABLE IF NOT EXISTS professional.skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES professional.users(id) ON DELETE CASCADE,
    enc_name TEXT NOT NULL,
    endorsement_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Other Profiles (LinkedIn, GitHub, etc.)
CREATE TABLE IF NOT EXISTS professional.other_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES professional.users(id) ON DELETE CASCADE,
    enc_network TEXT NOT NULL, -- LinkedIn, GitHub, Website, etc.
    enc_url TEXT NOT NULL,
    enc_description TEXT, 
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- EMPLOYER SCHEMA
-- ==========================================

-- 1. Other Profiles (for Companies)
CREATE TABLE IF NOT EXISTS employer.other_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES employer.companies(id) ON DELETE CASCADE,
    enc_network TEXT NOT NULL,
    enc_url TEXT NOT NULL,
    enc_description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS (Optional but recommended, assuming policies will be added or auth handled in API)
ALTER TABLE professional.education ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional.employment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional.certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional.awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional.other_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE employer.other_profiles ENABLE ROW LEVEL SECURITY;

-- Grant access to authenticated users (Simplified for now, expecting API to handle logic)
GRANT ALL ON ALL TABLES IN SCHEMA professional TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA professional TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA employer TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA employer TO service_role;
