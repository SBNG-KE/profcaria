-- Create Search History Table
CREATE TABLE IF NOT EXISTS professional.search_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES professional.users(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    filters JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE professional.search_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own search history"
    ON professional.search_history
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own search history"
    ON professional.search_history
    FOR SELECT
    USING (auth.uid() = user_id);

GRANT ALL ON professional.search_history TO postgres, service_role;
GRANT ALL ON professional.search_history TO authenticated;
