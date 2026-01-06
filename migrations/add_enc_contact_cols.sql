-- Add encrypted columns to Professional Users
ALTER TABLE professional.users ADD COLUMN IF NOT EXISTS enc_email text;
ALTER TABLE professional.users ADD COLUMN IF NOT EXISTS enc_phone_number text;

-- Add encrypted columns to Employer Companies (for future use/consistency)
ALTER TABLE employer.companies ADD COLUMN IF NOT EXISTS enc_work_email text;
ALTER TABLE employer.companies ADD COLUMN IF NOT EXISTS enc_phone_number text;
