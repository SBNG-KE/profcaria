-- Migration to add 'image_position' for profile image alignment
-- Supports 'center', 'top', 'bottom'

-- 1. Add 'image_position' to Professional Users
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'professional' AND table_name = 'users' AND column_name = 'image_position') THEN
        ALTER TABLE professional.users ADD COLUMN image_position text DEFAULT 'center';
    END IF;
END $$;

-- 2. Add 'image_position' to Employer Companies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'employer' AND table_name = 'companies' AND column_name = 'image_position') THEN
        ALTER TABLE employer.companies ADD COLUMN image_position text DEFAULT 'center';
    END IF;
END $$;
