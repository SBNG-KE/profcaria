-- Add default_2fa_method column to professional.users and employer.companies
ALTER TABLE professional.users ADD COLUMN IF NOT EXISTS default_2fa_method text;
ALTER TABLE employer.companies ADD COLUMN IF NOT EXISTS default_2fa_method text;
