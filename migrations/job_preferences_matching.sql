-- Create Professional Preferences Table
CREATE TABLE IF NOT EXISTS professional.preferences (
    user_id UUID PRIMARY KEY REFERENCES professional.users(id) ON DELETE CASCADE,
    target_roles TEXT[] DEFAULT '{}',
    preferred_locations JSONB DEFAULT '{"countries": [], "continents": []}',
    work_modes TEXT[] DEFAULT '{}', -- 'remote', 'onsite', 'hybrid'
    employment_types TEXT[] DEFAULT '{}', -- 'full-time', 'part-time', 'contract', 'internship', 'temporary'
    is_open_to_relocation BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE professional.preferences ENABLE ROW LEVEL SECURITY;

-- Policies for Preferences
CREATE POLICY "Users can view their own preferences"
    ON professional.preferences FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
    ON professional.preferences FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
    ON professional.preferences FOR UPDATE
    USING (auth.uid() = user_id);

-- Grants
GRANT ALL ON professional.preferences TO postgres, service_role;
GRANT ALL ON professional.preferences TO authenticated;

-- Add employment_type to Employer Jobs Table
ALTER TABLE employer.jobs ADD COLUMN IF NOT EXISTS employment_type TEXT DEFAULT 'full-time';

-- Add Blind Index for Company Name (for exact search)
ALTER TABLE employer.companies ADD COLUMN IF NOT EXISTS company_name_index TEXT;
