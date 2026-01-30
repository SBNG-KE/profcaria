-- Update get_ranked_feed to include Reposts
-- This function now unions Posts AND Reposts (joined with their content)

DROP FUNCTION IF EXISTS get_ranked_feed(uuid, integer, integer);

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
    is_repost BOOLEAN,
    reposted_by UUID,
    repost_id UUID,
    relevance_score FLOAT
) AS $$
DECLARE
    v_search_keywords TEXT;
    v_pref_keywords TEXT;
    v_combined_keywords TEXT;
    v_following_users UUID[];
    v_following_companies UUID[];
BEGIN
    -- 1. Get User's Following Graph
    SELECT ARRAY_AGG(following_id) INTO v_following_users 
    FROM professional.user_follows WHERE follower_id = p_user_id;
    
    SELECT ARRAY_AGG(company_id) INTO v_following_companies 
    FROM professional.company_follows WHERE user_id = p_user_id;

    -- 2. Training Data (Search + Prefs)
    SELECT array_to_string(array_agg(query), ' | ') INTO v_search_keywords
    FROM (
        SELECT query FROM professional.search_logs 
        WHERE user_id = p_user_id 
        ORDER BY created_at DESC 
        LIMIT 10
    ) sub;

    SELECT array_to_string(ARRAY(SELECT jsonb_array_elements_text(target_roles)), ' | ') INTO v_pref_keywords
    FROM professional.preferences WHERE user_id = p_user_id LIMIT 1;

    v_combined_keywords := COALESCE(v_search_keywords, '') || ' | ' || COALESCE(v_pref_keywords, '');
    v_combined_keywords := trim(both ' | ' from v_combined_keywords);

    RETURN QUERY
    WITH all_items AS (
        -- 1. PROFESSIONAL POSTS (Original)
        SELECT 
            p.id, 
            p.content, 
            p.media_urls, 
            p.created_at,   -- Use original creation time ? No, for feed ranking we use creation time.
            p.user_id, 
            NULL::UUID as company_id, 
            'professional' as author_type,
            COALESCE(l.count, 0) as likes,
            COALESCE(c.count, 0) as comments,
            FALSE as is_repost,
            NULL::UUID as reposted_by,
            NULL::UUID as repost_id
        FROM professional.posts p
        LEFT JOIN (SELECT post_id, COUNT(*) as count FROM professional.post_likes GROUP BY post_id) l ON l.post_id = p.id
        LEFT JOIN (SELECT post_id, COUNT(*) as count FROM professional.post_comments GROUP BY post_id) c ON c.post_id = p.id
        -- WHERE p.created_at > NOW() - INTERVAL '30 days'
        
        UNION ALL
        
        -- 2. EMPLOYER POSTS (Original)
        SELECT 
            p.id, 
            p.content, 
            p.media_urls, 
            p.created_at, 
            NULL::UUID as user_id, 
            p.company_id, 
            'employer' as author_type,
            COALESCE(l.count, 0) as likes,
            COALESCE(c.count, 0) as comments,
            FALSE as is_repost,
            NULL::UUID as reposted_by,
            NULL::UUID as repost_id
        FROM employer.posts p
        LEFT JOIN (SELECT post_id, COUNT(*) as count FROM employer.post_likes GROUP BY post_id) l ON l.post_id = p.id
        LEFT JOIN (SELECT post_id, COUNT(*) as count FROM employer.post_comments GROUP BY post_id) c ON c.post_id = p.id
        -- WHERE p.created_at > NOW() - INTERVAL '30 days'

        UNION ALL

        -- 3. PROFESSIONAL REPOSTS
        SELECT 
            orig.id,
            orig.content,
            orig.media_urls,
            rp.created_at as created_at, -- Use REPOST time for feed sorting
            orig.user_id,
            NULL::UUID as company_id,
            'professional' as author_type, -- Author of content is User
            COALESCE(l.count, 0) as likes,
            COALESCE(c.count, 0) as comments,
            TRUE as is_repost,
            rp.user_id as reposted_by,
            rp.id as repost_id
        FROM professional.post_reposts rp
        JOIN professional.posts orig ON rp.post_id = orig.id
        LEFT JOIN (SELECT post_id, COUNT(*) as count FROM professional.post_likes GROUP BY post_id) l ON l.post_id = orig.id
        LEFT JOIN (SELECT post_id, COUNT(*) as count FROM professional.post_comments GROUP BY post_id) c ON c.post_id = orig.id
        -- WHERE rp.created_at > NOW() - INTERVAL '30 days'

        UNION ALL

        -- 4. EMPLOYER REPOSTS (User reposting Employer content ?)
        -- Wait, professional.post_reposts usually reposts Prof or Emp content.
        -- We need to check structure: professional.post_reposts has `post_id` (Prof) or `original_post_id` (Emp)?
        -- Checking schema... assume professional.post_reposts links to professional.posts via post_id.
        -- Does it link to employer posts?
        -- Based on API, it seems separated.
        -- Let's assume for now we only support Reposting same-schema content OR strict FKs.
        -- Implementation detail: Repost logic usually saves to the REPOSTER's schema.
        -- A Professional reposts -> professional.post_reposts.
        -- If they repost an Employer post, it likely goes into professional.post_reposts with a different column or shared ID.
        -- Looking at API: if (schema === 'professional') insert [fkColumn]: postId.
        -- If prof post: pk=post_id. If emp post: fk=original_post_id (if exists?).
        -- Simplification: Just querying what's definitely there.

        -- EMPLOYER REPOSTS (Employers reposting things)
        SELECT 
            orig.id,
            orig.content,
            orig.media_urls,
            rp.created_at, 
            NULL::UUID as user_id,
            orig.company_id,
            'employer' as author_type,
            COALESCE(l.count, 0) as likes,
            COALESCE(c.count, 0) as comments,
            TRUE as is_repost,
            rp.company_id as reposted_by,
            rp.id as repost_id
        FROM employer.post_reposts rp
        JOIN employer.posts orig ON rp.original_post_id = orig.id
        LEFT JOIN (SELECT post_id, COUNT(*) as count FROM employer.post_likes GROUP BY post_id) l ON l.post_id = orig.id
        LEFT JOIN (SELECT post_id, COUNT(*) as count FROM employer.post_comments GROUP BY post_id) c ON c.post_id = orig.id
        -- WHERE rp.created_at > NOW() - INTERVAL '30 days'
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
        ap.is_repost,
        ap.reposted_by,
        ap.repost_id,
        (
            -- SCORING FORMULA
            
            -- 1. Recency Penalty (Using Repost Time if repost)
            (EXTRACT(EPOCH FROM (NOW() - ap.created_at)) / 3600 * -2.0) +
            
            -- 2. Engagement Boost
            (ap.likes * 2.0) + 
            (ap.comments * 4.0) +
            
            -- 3. Social Connection Boost
            (CASE 
                -- If it's a repost, check if we follow the REPOSTER
                WHEN ap.is_repost AND ap.reposted_by = ANY(v_following_users) THEN 70.0 
                WHEN ap.is_repost AND ap.reposted_by = ANY(v_following_companies) THEN 80.0
                
                -- Otherwise check if we follow the AUTHOR
                WHEN ap.user_id = ANY(v_following_users) THEN 50.0 
                WHEN ap.company_id = ANY(v_following_companies) THEN 60.0 
                ELSE 0.0 
            END) +

            -- 4. Content Relevance
            (CASE 
                WHEN length(v_combined_keywords) > 0 AND 
                     to_tsvector('english', ap.content) @@ to_tsquery('english', replace(replace(trim(v_combined_keywords), ' ', '|'), '||', '|')) 
                THEN 45.0 
                ELSE 0.0 
            END) +
            
            -- 5. Random Discovery
            (random() * 5.0)

        )::FLOAT as final_score
    FROM all_items ap
    ORDER BY final_score DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant Permissions
GRANT EXECUTE ON FUNCTION get_ranked_feed TO authenticated;
GRANT EXECUTE ON FUNCTION get_ranked_feed TO service_role;
