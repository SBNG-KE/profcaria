-- Migration: Add embedding columns for semantic matching
-- Run this in your Supabase SQL Editor

-- Professional users embedding (for candidate matching)
ALTER TABLE professional.users 
ADD COLUMN IF NOT EXISTS embedding_json JSONB DEFAULT NULL;

COMMENT ON COLUMN professional.users.embedding_json IS 'Semantic embedding vector (384-dim) stored as JSON array for ML matching';

-- Professional preferences embedding (combined target roles + skills context)
ALTER TABLE professional.preferences 
ADD COLUMN IF NOT EXISTS embedding_json JSONB DEFAULT NULL;

COMMENT ON COLUMN professional.preferences.embedding_json IS 'Embedding of target roles and preferences for job matching';

-- Employer jobs embedding (for candidate matching)
ALTER TABLE employer.jobs 
ADD COLUMN IF NOT EXISTS embedding_json JSONB DEFAULT NULL;

COMMENT ON COLUMN employer.jobs.embedding_json IS 'Semantic embedding of job title and description for candidate matching';

-- Index for faster queries (optional, only needed at scale)
-- CREATE INDEX IF NOT EXISTS idx_professional_users_embedding ON professional.users USING gin(embedding_json);
-- CREATE INDEX IF NOT EXISTS idx_employer_jobs_embedding ON employer.jobs USING gin(embedding_json);

-- Note: The embeddings are stored as JSONB for flexibility.
-- At scale (1M+ users), consider migrating to pgvector extension:
-- ALTER TABLE professional.users ADD COLUMN embedding vector(384);
