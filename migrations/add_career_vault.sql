-- Career Vault Migration
-- Adds career_notes table and vault fields to preferences

CREATE TABLE IF NOT EXISTS professional.career_notes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES professional.users(id) ON DELETE CASCADE,
    enc_title text NOT NULL,
    enc_content text,
    enc_category text,
    is_pinned boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE professional.career_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own career notes"
    ON professional.career_notes
    FOR ALL
    USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_career_notes_user_id ON professional.career_notes(user_id);

ALTER TABLE professional.preferences
    ADD COLUMN IF NOT EXISTS is_hidden_search boolean DEFAULT false;

ALTER TABLE professional.preferences
    ADD COLUMN IF NOT EXISTS enc_salary_history text;
