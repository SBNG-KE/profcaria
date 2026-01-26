-- Add company_id to PROFESSIONAL tables to allow Employers to comment/repost professional content
ALTER TABLE professional.post_reposts ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES employer.companies(id);
ALTER TABLE professional.post_comments ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES employer.companies(id);

-- Make user_id nullable in PROFESSIONAL tables (since now it might be a company instead)
ALTER TABLE professional.post_reposts ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE professional.post_comments ALTER COLUMN user_id DROP NOT NULL;
