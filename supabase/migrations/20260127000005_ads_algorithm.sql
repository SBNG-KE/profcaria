-- Add Boost Columns to Professional Posts
ALTER TABLE professional.posts 
ADD COLUMN IF NOT EXISTS boost_status text DEFAULT 'none', -- none, active, expired
ADD COLUMN IF NOT EXISTS boost_budget numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS boost_duration_days integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS boost_start_at timestamptz,
ADD COLUMN IF NOT EXISTS boost_end_at timestamptz;

-- Add Boost Columns to Employer Posts
ALTER TABLE employer.posts 
ADD COLUMN IF NOT EXISTS boost_status text DEFAULT 'none',
ADD COLUMN IF NOT EXISTS boost_budget numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS boost_duration_days integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS boost_start_at timestamptz,
ADD COLUMN IF NOT EXISTS boost_end_at timestamptz;

-- Index for efficient querying of active boosts
CREATE INDEX IF NOT EXISTS idx_prof_posts_boost_active ON professional.posts(boost_status, boost_end_at);
CREATE INDEX IF NOT EXISTS idx_emp_posts_boost_active ON employer.posts(boost_status, boost_end_at);

-- Drop old function if exists to redefine
DROP FUNCTION IF EXISTS public.get_ranked_feed;

-- Create Unified Feed Ranking Function
CREATE OR REPLACE FUNCTION public.get_ranked_feed(
    p_user_id uuid,
    p_limit integer DEFAULT 20,
    p_offset integer DEFAULT 0
)
RETURNS TABLE (
    id uuid,
    content text,
    media_urls text[],
    author_type text, -- 'professional' or 'employer'
    created_at timestamptz,
    -- standardized creator columns to avoid ambiguous joining
    user_id uuid, -- For prof posts
    company_id uuid, -- For emp posts (mapped to this output column)
    likes_count bigint,
    comments_count bigint,
    reposts_count bigint,
    boost_score numeric,
    final_score numeric
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH all_posts AS (
        -- Professional Posts
        SELECT 
            p.id,
            p.content,
            p.media_urls,
            'professional'::text as author_type,
            p.created_at,
            p.user_id,
            NULL::uuid as company_id,
            p.boost_status,
            p.boost_budget,
            p.boost_end_at
        FROM professional.posts p
        WHERE p.created_at > (now() - interval '90 days') -- Perf optimization

        UNION ALL

        -- Employer Posts
        SELECT 
            e.id,
            e.content,
            e.media_urls,
            'employer'::text as author_type,
            e.created_at,
            NULL::uuid as user_id,
            e.company_id,
            e.boost_status,
            e.boost_budget,
            e.boost_end_at
        FROM employer.posts e
        WHERE e.created_at > (now() - interval '90 days')
    ),
    scored_posts AS (
        SELECT 
            ap.*,
            -- Calculate Engagement (Mocking counts for speed, real implementation implies joins usually)
            -- For simplicity in this function, we assume a separate view or lateral join for exact counts if needed 
            -- OR we rely on the client to fetch exact counts and WE just use a heuristic here if we had counters on the table.
            -- Since we added counters in previous migrations/ideas, let's assume raw timestamps for Decay.
            
            -- BOOST SCORE
            CASE 
                WHEN ap.boost_status = 'active' AND ap.boost_end_at > now() THEN 
                    (ap.boost_budget * 100) -- $10 = 1000 points, $100 = 10000 points. Massive priority.
                ELSE 0 
            END as boost_pts,

            -- RECENCY SCORE (Logarithmic decay)
            -- Newer posts get higher base score.
            -- 1 day old = ~86400 seconds. 
            (EXTRACT(EPOCH FROM ap.created_at) / 10000)::numeric as recency_pts

        FROM all_posts ap
    )
    SELECT
        sp.id,
        sp.content,
        sp.media_urls,
        sp.author_type,
        sp.created_at,
        sp.user_id,
        sp.company_id,
        0::bigint as likes_count, -- Placeholder, client fetches real count
        0::bigint as comments_count,
        0::bigint as reposts_count,
        sp.boost_pts as boost_score,
        (sp.boost_pts + sp.recency_pts) as final_score
    FROM scored_posts sp
    ORDER BY final_score DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;
