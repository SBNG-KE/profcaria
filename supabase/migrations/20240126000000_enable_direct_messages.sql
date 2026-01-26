-- Enable Direct Messaging by adding recipient fields and making application_id nullable
ALTER TABLE employer.messages ADD COLUMN IF NOT EXISTS recipient_id UUID;
ALTER TABLE employer.messages ADD COLUMN IF NOT EXISTS recipient_type TEXT; -- 'professional' or 'employer'
ALTER TABLE employer.messages ALTER COLUMN application_id DROP NOT NULL;

-- Create index for faster DM lookups
CREATE INDEX IF NOT EXISTS idx_messages_sender_recipient ON employer.messages(sender_id, recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_sender ON employer.messages(recipient_id, sender_id);
