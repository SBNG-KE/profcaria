-- Add any newly added preferences columns to the table to fix the saving issue
ALTER TABLE professional.preferences
ADD COLUMN IF NOT EXISTS enc_intent_headline text NULL,
ADD COLUMN IF NOT EXISTS enc_min_salary text NULL,
ADD COLUMN IF NOT EXISTS experience_years_ranges text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS target_roles text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS preferred_locations jsonb DEFAULT '{"countries": [], "continents": []}'::jsonb,
ADD COLUMN IF NOT EXISTS work_modes text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS employment_types text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_open_to_relocation boolean DEFAULT false;

-- Reload the schema cache so the API recognizes the new columns
NOTIFY pgrst, 'reload schema';
