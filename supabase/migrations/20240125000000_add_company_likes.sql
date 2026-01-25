
-- Add company_id to professional.post_likes
ALTER TABLE professional.post_likes ADD COLUMN company_id UUIDREFERENCES employer.companies(id) ON DELETE CASCADE;

-- Add company_id to employer.post_likes
ALTER TABLE employer.post_likes ADD COLUMN company_id UUID REFERENCES employer.companies(id) ON DELETE CASCADE;

-- Update constraints (optional but good practice: either user_id or company_id must be set)
ALTER TABLE professional.post_likes ADD CONSTRAINT check_liker_prof CHECK (
    (user_id IS NOT NULL AND company_id IS NULL) OR 
    (user_id IS NULL AND company_id IS NOT NULL)
);

ALTER TABLE employer.post_likes ADD CONSTRAINT check_liker_emp CHECK (
    (user_id IS NOT NULL AND company_id IS NULL) OR 
    (user_id IS NULL AND company_id IS NOT NULL)
);

-- Note: We might need to drop existing NOT NULL constraint on user_id if it exists.
ALTER TABLE professional.post_likes ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE employer.post_likes ALTER COLUMN user_id DROP NOT NULL;
