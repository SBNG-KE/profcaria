-- Search Index for Recommendations Engine V2
-- Stores decrypted searchable data to allow efficiently matching skills, location, and roles.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS professional.search_index (
    user_id UUID PRIMARY KEY REFERENCES professional.users(id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    location_text TEXT,
    role_text TEXT,
    skills_text TEXT, -- Space separated
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_synced_at TIMESTAMPTZ DEFAULT NOW()
    -- embedding vector(1536) -- Uncomment if pgvector is enabled
);

CREATE INDEX IF NOT EXISTS idx_search_skills ON professional.search_index USING GIN(to_tsvector('english', skills_text));
CREATE INDEX IF NOT EXISTS idx_search_location ON professional.search_index USING GIN(to_tsvector('english', location_text));
CREATE INDEX IF NOT EXISTS idx_search_role ON professional.search_index USING GIN(to_tsvector('english', role_text));
