-- Add timestamp to professional.preferences for tracking Last Viewed Time of followers
-- This enables "Unseen" badge logic instead of "Unrequited"

CREATE TABLE IF NOT EXISTS professional.preferences (
    user_id UUID PRIMARY KEY REFERENCES professional.users(id),
    target_roles JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE professional.preferences 
ADD COLUMN IF NOT EXISTS last_viewed_followers_at TIMESTAMPTZ DEFAULT NOW();
