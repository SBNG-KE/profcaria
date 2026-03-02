-- Intent Mode Migration
-- Replaces boolean is_available_for_hire with rich intent_mode enum

-- Add intent_mode column to professional.users
ALTER TABLE professional.users
  ADD COLUMN IF NOT EXISTS intent_mode text NOT NULL DEFAULT 'open_to_offers'
  CHECK (intent_mode IN (
    'not_looking',
    'open_to_offers',
    'actively_looking',
    'open_to_freelance',
    'open_to_cofounder'
  ));

-- Migrate existing data: false → 'not_looking', true/null → 'open_to_offers'
UPDATE professional.users
  SET intent_mode = CASE
    WHEN is_available_for_hire = false THEN 'not_looking'
    ELSE 'open_to_offers'
  END;

-- Add precision fields to preferences
ALTER TABLE professional.preferences
  ADD COLUMN IF NOT EXISTS enc_intent_headline text,
  ADD COLUMN IF NOT EXISTS enc_min_salary text;
