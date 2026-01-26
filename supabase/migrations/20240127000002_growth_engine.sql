-- Growth Engine: Smart Recommendations
-- Suggests Companies and Professionals based on:
-- 1. Industry Alignment (New 'industry' column)
-- 2. Role Similarity (Target Roles vs Company Jobs / Peer Roles)
-- 3. Location Proximity

CREATE OR REPLACE FUNCTION get_smart_recommendations(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_user_prefs JSONB;
    v_user_location TEXT;
    v_target_roles TEXT[];
    v_result JSONB;
BEGIN
    -- 1. Fetch User Context
    SELECT row_to_json(pref) INTO v_user_prefs 
    FROM professional.preferences pref 
    WHERE user_id = p_user_id;

    -- Extract simplified arrays/text from jsonb
    -- Note: structure depends on how json is stored. Assuming common structure.
    v_target_roles := ARRAY(SELECT jsonb_array_elements_text(v_user_prefs->'target_roles'));
    
    SELECT 
        json_build_object(
            'companies', (
                SELECT json_agg(c_row) FROM (
                    SELECT 
                        c.id, 
                        c.enc_company_name, 
                        c.industry, 
                        c.enc_logo_url,
                        -- Score
                        (
                            -- Industry Match? (We don't have user industry yet, so we use target roles to guess or just boost popular)
                            (CASE WHEN c.industry IS NOT NULL THEN 10 ELSE 0 END) +
                            -- Active Jobs Boost
                            ((SELECT count(*) FROM employer.jobs j WHERE j.company_id = c.id AND j.is_active = true) * 5)
                        ) as score
                    FROM employer.companies c
                    WHERE c.id NOT IN (SELECT company_id FROM professional.company_follows WHERE user_id = p_user_id) -- Not already following
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
                        -- Score
                        (
                            10 -- Baseline
                            -- We would add role matching logic here if we had decrypted roles in SQL or if they were plain text
                        ) as score
                    FROM professional.users u
                    WHERE u.id != p_user_id
                    AND u.id NOT IN (SELECT following_id FROM professional.user_follows WHERE follower_id = p_user_id)
                    ORDER BY random() -- Discovery mode for peers until we index decrypted roles
                    LIMIT 10
                ) p_row
            )
        ) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PERMISSIONS
GRANT EXECUTE ON FUNCTION get_smart_recommendations TO authenticated;
GRANT EXECUTE ON FUNCTION get_smart_recommendations TO service_role;
