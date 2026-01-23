-- Migration to add missing columns for the new Profile Redesign

-- 1. Add 'enc_about' to Professional Users
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'professional' AND table_name = 'users' AND column_name = 'enc_about') THEN
        ALTER TABLE professional.users ADD COLUMN enc_about text;
    END IF;
END $$;

-- 2. Add 'enc_about' to Employer Companies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'employer' AND table_name = 'companies' AND column_name = 'enc_about') THEN
        ALTER TABLE employer.companies ADD COLUMN enc_about text;
    END IF;
END $$;

-- 3. Add 'enc_founded_year' to Employer Companies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'employer' AND table_name = 'companies' AND column_name = 'enc_founded_year') THEN
        ALTER TABLE employer.companies ADD COLUMN enc_founded_year text;
    END IF;
END $$;
