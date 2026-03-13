-- Create career_ai_sessions table
CREATE TABLE IF NOT EXISTS professional.career_ai_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES professional.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add session_id to messages
ALTER TABLE professional.career_ai_messages 
ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES professional.career_ai_sessions(id) ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE professional.career_ai_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own AI sessions" ON professional.career_ai_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI sessions" ON professional.career_ai_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI sessions" ON professional.career_ai_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own AI sessions" ON professional.career_ai_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- Add updated_at trigger for sessions
CREATE OR REPLACE FUNCTION update_career_ai_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_career_ai_sessions_updated_at ON professional.career_ai_sessions;
CREATE TRIGGER trigger_career_ai_sessions_updated_at
BEFORE UPDATE ON professional.career_ai_sessions
FOR EACH ROW
EXECUTE FUNCTION update_career_ai_sessions_updated_at();
