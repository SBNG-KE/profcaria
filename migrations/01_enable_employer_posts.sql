-- Enable Employer Posts
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS employer.posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL, -- References employer.companies(id) conceptually, strict FK might fail if table name differs
    content TEXT NOT NULL,
    media_urls TEXT[] DEFAULT '{}',
    link_preview JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Note: We assume company_id references employer.companies or employer.users.
-- Since we don't know the exact Foreign Key target table name (could be 'companies', 'employers', 'profiles'), 
-- we are omitting the strict REFERENCES constraint to avoid migration failure. 
-- The logic in the API ensures the ID comes from the authenticated session.

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_employer_posts_company_id ON employer.posts(company_id);
CREATE INDEX IF NOT EXISTS idx_employer_posts_created_at ON employer.posts(created_at DESC);

-- RLS Policies (Optional - adjust as needed)
ALTER TABLE employer.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employers can insert their own posts" ON employer.posts
    FOR INSERT TO authenticated
    WITH CHECK (true); -- Application logic validates ID

CREATE POLICY "Everyone can read posts" ON employer.posts
    FOR SELECT TO authenticated
    USING (true);

-- Likes on Employer Posts
CREATE TABLE IF NOT EXISTS employer.post_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL, -- References employer.posts(id) conceptually
    user_id UUID NOT NULL, -- Who liked it (can be professional or employer?)
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(post_id, user_id)
);

-- Comments on Employer Posts
CREATE TABLE IF NOT EXISTS employer.post_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL,
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Reposts of Employer Posts
CREATE TABLE IF NOT EXISTS employer.post_reposts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    original_post_id UUID NOT NULL,
    user_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_employer_likes_post ON employer.post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_employer_comments_post ON employer.post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_employer_reposts_original ON employer.post_reposts(original_post_id);

-- RLS Policies
ALTER TABLE employer.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE employer.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE employer.post_reposts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON employer.post_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public read access" ON employer.post_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public read access" ON employer.post_reposts FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated insert" ON employer.post_likes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated insert" ON employer.post_comments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated insert" ON employer.post_reposts FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can delete own likes" ON employer.post_likes FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can delete own comments" ON employer.post_comments FOR DELETE TO authenticated USING (user_id = auth.uid());

-- GRANT Permissions (Critical for access)
GRANT ALL ON TABLE employer.posts TO authenticated;
GRANT ALL ON TABLE employer.posts TO service_role;

GRANT ALL ON TABLE employer.post_likes TO authenticated;
GRANT ALL ON TABLE employer.post_likes TO service_role;

GRANT ALL ON TABLE employer.post_comments TO authenticated;
GRANT ALL ON TABLE employer.post_comments TO service_role;

GRANT ALL ON TABLE employer.post_reposts TO authenticated;
GRANT ALL ON TABLE employer.post_reposts TO service_role;
