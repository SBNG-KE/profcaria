-- Enable Professionals to Follow Companies
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS professional.company_follows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES professional.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL, -- References employer.companies(id) conceptually
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, company_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_comp_follows_user ON professional.company_follows(user_id);
CREATE INDEX IF NOT EXISTS idx_comp_follows_company ON professional.company_follows(company_id);

-- RLS
ALTER TABLE professional.company_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON professional.company_follows FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can follow" ON professional.company_follows FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can unfollow" ON professional.company_follows FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Permissions
GRANT ALL ON professional.company_follows TO authenticated;
GRANT ALL ON professional.company_follows TO service_role;
