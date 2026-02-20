-- Migration for Profile Views
CREATE TABLE IF NOT EXISTS professional.profile_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    viewer_id UUID REFERENCES professional.users(id) ON DELETE SET NULL,
    viewed_professional_id UUID REFERENCES professional.users(id) ON DELETE CASCADE,
    viewed_company_id UUID REFERENCES employer.companies(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT check_single_target CHECK (
        (viewed_professional_id IS NOT NULL AND viewed_company_id IS NULL) OR
        (viewed_professional_id IS NULL AND viewed_company_id IS NOT NULL)
    )
);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_profile_views_prof ON professional.profile_views(viewed_professional_id, created_at);
CREATE INDEX IF NOT EXISTS idx_profile_views_comp ON professional.profile_views(viewed_company_id, created_at);
