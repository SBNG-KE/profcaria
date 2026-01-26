-- Add company_id to employer reposts and comments if missing
ALTER TABLE employer.post_reposts ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES employer.companies(id);
ALTER TABLE employer.post_comments ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES employer.companies(id);

-- Make user_id nullable if it was strictly required (it shouldn't be for employer schema, but checking)
ALTER TABLE employer.post_reposts ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE employer.post_comments ALTER COLUMN user_id DROP NOT NULL;
