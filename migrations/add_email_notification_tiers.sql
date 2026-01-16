-- Add columns to track email notification tiers for messages
-- We'll track on the notifications table which tier email was sent

-- For professional.notifications
ALTER TABLE professional.notifications ADD COLUMN IF NOT EXISTS email_tier smallint DEFAULT 0;
ALTER TABLE professional.notifications ADD COLUMN IF NOT EXISTS email_sent_at timestamptz;

-- For employer.notifications  
ALTER TABLE employer.notifications ADD COLUMN IF NOT EXISTS email_tier smallint DEFAULT 0;
ALTER TABLE employer.notifications ADD COLUMN IF NOT EXISTS email_sent_at timestamptz;

-- email_tier values:
-- 0 = no email sent yet
-- 1 = 1 hour email sent
-- 2 = 10 hour email sent
-- 3 = 48 hour email sent
-- 4 = 72 hour email sent (final)
