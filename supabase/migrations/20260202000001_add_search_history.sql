-- Migration: Add Search Click History for Algorithm Training
-- This enhances the existing search_logs table with richer click data

-- 1. Search Click History Table (detailed tracking of profile clicks from search)
CREATE TABLE IF NOT EXISTS professional.search_clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES professional.users(id) ON DELETE CASCADE,
    target_id UUID NOT NULL,
    target_type TEXT NOT NULL CHECK (target_type IN ('professional', 'employer')),
    query TEXT, -- The search query that led to this click
    industry TEXT, -- Industry of target (for algorithm training)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast retrieval
CREATE INDEX IF NOT EXISTS idx_search_clicks_user ON professional.search_clicks(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_clicks_target ON professional.search_clicks(target_id, target_type);

-- 2. Add proration tracking to subscriptions
ALTER TABLE professional.subscriptions 
    ADD COLUMN IF NOT EXISTS prorated_refund NUMERIC(10, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS switched_from TEXT;

ALTER TABLE employer.subscriptions 
    ADD COLUMN IF NOT EXISTS prorated_refund NUMERIC(10, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS switched_from TEXT;

-- 3. Permissions
GRANT ALL ON professional.search_clicks TO service_role;
GRANT INSERT, SELECT ON professional.search_clicks TO authenticated;

-- 4. UPDATE FEED ALGORITHM to include search click history
-- This enhances the existing get_ranked_feed function
-- Must drop first due to return type change
DROP FUNCTION IF EXISTS get_ranked_feed(UUID, INT, INT);

CREATE OR REPLACE FUNCTION get_ranked_feed(
    p_user_id UUID,
    p_limit INT DEFAULT 20,
    p_offset INT DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    media_urls TEXT[],
    created_at TIMESTAMPTZ,
    user_id UUID,
    company_id UUID,
    author_type TEXT,
    likes_count BIGINT,
    comments_count BIGINT,
    relevance_score FLOAT
) AS $$
DECLARE
    v_search_keywords TEXT;
    v_pref_keywords TEXT;
    v_combined_keywords TEXT;
    v_following_users UUID[];
    v_following_companies UUID[];
    v_searched_users UUID[];
    v_searched_companies UUID[];
BEGIN
    -- 1. Get User's Following Graph
    SELECT ARRAY_AGG(following_id) INTO v_following_users 
    FROM professional.user_follows WHERE follower_id = p_user_id;
    
    SELECT ARRAY_AGG(company_id) INTO v_following_companies 
    FROM professional.company_follows WHERE user_id = p_user_id;

    -- 2. Get Users/Companies from Search Click History (NEW!)
    SELECT ARRAY_AGG(DISTINCT target_id) INTO v_searched_users
    FROM professional.search_clicks 
    WHERE user_id = p_user_id 
      AND target_type = 'professional'
      AND created_at > NOW() - INTERVAL '30 days';
    
    SELECT ARRAY_AGG(DISTINCT target_id) INTO v_searched_companies
    FROM professional.search_clicks 
    WHERE user_id = p_user_id 
      AND target_type = 'employer'
      AND created_at > NOW() - INTERVAL '30 days';

    -- 3. Training Data A: Get Last 10 Search Queries (text)
    SELECT array_to_string(array_agg(query), ' | ') INTO v_search_keywords
    FROM (
        SELECT sl.query FROM professional.search_logs sl
        WHERE sl.user_id = p_user_id 
        ORDER BY sl.created_at DESC 
        LIMIT 10
    ) sub;

    -- 4. Training Data B: Get User's Job Preferences (Target Roles)
    SELECT array_to_string(ARRAY(SELECT jsonb_array_elements_text(target_roles)), ' | ') INTO v_pref_keywords
    FROM professional.preferences WHERE user_id = p_user_id LIMIT 1;

    -- Combine keywords for a richer training signal
    v_combined_keywords := COALESCE(v_search_keywords, '') || ' | ' || COALESCE(v_pref_keywords, '');
    v_combined_keywords := trim(both ' | ' from v_combined_keywords);

    RETURN QUERY
    WITH all_posts AS (
        -- Professional Posts
        SELECT 
            p.id, 
            p.content, 
            p.media_urls, 
            p.created_at, 
            p.user_id, 
            NULL::UUID as company_id, 
            'professional' as author_type,
            COALESCE(l.count, 0) as likes,
            COALESCE(c.count, 0) as comments
        FROM professional.posts p
        LEFT JOIN (SELECT post_id, COUNT(*) as count FROM professional.post_likes GROUP BY post_id) l ON l.post_id = p.id
        LEFT JOIN (SELECT post_id, COUNT(*) as count FROM professional.post_comments GROUP BY post_id) c ON c.post_id = p.id
        WHERE p.created_at > NOW() - INTERVAL '30 days'
        
        UNION ALL
        
        -- Employer Posts
        SELECT 
            p.id, 
            p.content, 
            p.media_urls, 
            p.created_at, 
            NULL::UUID as user_id, 
            p.company_id, 
            'employer' as author_type,
            COALESCE(l.count, 0) as likes,
            COALESCE(c.count, 0) as comments
        FROM employer.posts p
        LEFT JOIN (SELECT post_id, COUNT(*) as count FROM employer.post_likes GROUP BY post_id) l ON l.post_id = p.id
        LEFT JOIN (SELECT post_id, COUNT(*) as count FROM employer.post_comments GROUP BY post_id) c ON c.post_id = p.id
        WHERE p.created_at > NOW() - INTERVAL '30 days'
    )
    SELECT 
        ap.id,
        ap.content,
        ap.media_urls,
        ap.created_at,
        ap.user_id,
        ap.company_id,
        ap.author_type,
        ap.likes,
        ap.comments,
        (
            -- SCORING FORMULA
            
            -- 1. Recency Penalty
            (EXTRACT(EPOCH FROM (NOW() - ap.created_at)) / 3600 * -2.0) +
            
            -- 2. Engagement Boost
            (ap.likes * 2.0) + 
            (ap.comments * 4.0) +
            
            -- 3. Social Connection Boost (Following)
            (CASE 
                WHEN ap.user_id = ANY(v_following_users) THEN 50.0 
                WHEN ap.company_id = ANY(v_following_companies) THEN 60.0 
                ELSE 0.0 
            END) +
            
            -- 4. NEW: Search Interest Boost (People/Companies you've searched for)
            (CASE 
                WHEN ap.user_id = ANY(v_searched_users) THEN 35.0 
                WHEN ap.company_id = ANY(v_searched_companies) THEN 40.0 
                ELSE 0.0 
            END) +

            -- 5. Content Relevance (Search History + Job Preferences)
            (CASE 
                WHEN length(v_combined_keywords) > 0 AND 
                     to_tsvector('english', ap.content) @@ to_tsquery('english', replace(replace(trim(v_combined_keywords), ' ', '|'), '||', '|')) 
                THEN 45.0
                ELSE 0.0 
            END) +
            
            -- 6. Random Discovery
            (random() * 5.0)

        )::FLOAT as final_score
    FROM all_posts ap
    ORDER BY final_score DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PERMISSIONS
GRANT EXECUTE ON FUNCTION get_ranked_feed TO authenticated;
GRANT EXECUTE ON FUNCTION get_ranked_feed TO service_role;
