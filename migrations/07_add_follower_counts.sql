-- Add follower_count to users and companies
-- Run this in Supabase SQL Editor

-- 1. Add Columns
ALTER TABLE professional.users ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0;
ALTER TABLE employer.companies ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0;

-- 2. Create Functions to Update Counts
-- For User Follows
CREATE OR REPLACE FUNCTION professional.update_user_follower_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE professional.users
        SET follower_count = follower_count + 1
        WHERE id = NEW.following_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE professional.users
        SET follower_count = follower_count - 1
        WHERE id = OLD.following_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- For Company Follows
CREATE OR REPLACE FUNCTION professional.update_company_follower_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE employer.companies
        SET follower_count = follower_count + 1
        WHERE id = NEW.company_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE employer.companies
        SET follower_count = follower_count - 1
        WHERE id = OLD.company_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create Triggers
DROP TRIGGER IF EXISTS trigger_update_user_follower_count ON professional.user_follows;
CREATE TRIGGER trigger_update_user_follower_count
AFTER INSERT OR DELETE ON professional.user_follows
FOR EACH ROW EXECUTE FUNCTION professional.update_user_follower_count();

DROP TRIGGER IF EXISTS trigger_update_company_follower_count ON professional.company_follows;
CREATE TRIGGER trigger_update_company_follower_count
AFTER INSERT OR DELETE ON professional.company_follows
FOR EACH ROW EXECUTE FUNCTION professional.update_company_follower_count();

-- 4. Initial Count Calculation (Fix existing data)
UPDATE professional.users u
SET follower_count = (
    SELECT COUNT(*) FROM professional.user_follows f WHERE f.following_id = u.id
);

UPDATE employer.companies c
SET follower_count = (
    SELECT COUNT(*) FROM professional.company_follows f WHERE f.company_id = c.id
);
