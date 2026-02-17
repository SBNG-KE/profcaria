-- Update Recommendation Algorithm to use Search Index
-- Relies on professional.search_index being populated.

CREATE OR REPLACE FUNCTION get_smart_recommendations(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_my_skills TEXT;
    v_my_location TEXT;
    v_result JSONB;
BEGIN
    -- 1. Fetch My Context from Search Index
    SELECT skills_text, location_text INTO v_my_skills, v_my_location
    FROM professional.search_index
    WHERE user_id = p_user_id;

    -- Default to empty if not synced
    v_my_skills := COALESCE(v_my_skills, '');
    v_my_location := COALESCE(v_my_location, '');

    SELECT 
        json_build_object(
            'companies', (
                SELECT json_agg(c_row) FROM (
                    SELECT 
                        c.id, 
                        c.enc_company_name, 
                        c.industry, 
                        c.enc_logo_url,
                        (
                            (CASE WHEN c.industry IS NOT NULL THEN 10 ELSE 0 END) +
                            ((SELECT count(*) FROM employer.jobs j WHERE j.company_id = c.id AND j.is_active = true) * 5)
                        ) as score
                    FROM employer.companies c
                    WHERE c.id NOT IN (SELECT company_id FROM professional.company_follows WHERE user_id = p_user_id)
                    ORDER BY score DESC
                    LIMIT 10
                ) c_row
            ),
            'professionals', (
                SELECT json_agg(p_row) FROM (
                    SELECT 
                        u.id, 
                        u.enc_first_name, 
                        u.enc_last_name, 
                        u.enc_current_role, 
                        u.enc_profile_image_url,
                        -- Score Calculation
                        (
                            10 -- Baseline
                            + (
                                CASE WHEN length(v_my_skills) > 0 THEN 
                                    ts_rank(to_tsvector('english', si.skills_text), websearch_to_tsquery('english', v_my_skills)) * 20
                                ELSE 0 END
                            ) -- Skills Match
                            + (CASE WHEN si.location_text = v_my_location AND v_my_location != '' THEN 15 ELSE 0 END) -- Location Exact Match
                        ) as score
                    FROM professional.users u
                    LEFT JOIN professional.search_index si ON si.user_id = u.id
                    WHERE u.id != p_user_id
                    AND u.id NOT IN (SELECT following_id FROM professional.user_follows WHERE follower_id = p_user_id)
                    ORDER BY score DESC, random()
                    LIMIT 10
                ) p_row
            )
        ) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
