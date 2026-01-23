-- Add about section to professional users
ALTER TABLE professional.users ADD COLUMN IF NOT EXISTS enc_about text;

-- Add about and founded_year to employer companies
ALTER TABLE employer.companies ADD COLUMN IF NOT EXISTS enc_about text;
ALTER TABLE employer.companies ADD COLUMN IF NOT EXISTS enc_founded_year text;
