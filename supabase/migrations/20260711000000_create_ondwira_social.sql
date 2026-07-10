-- Ondwira Social v1. This schema is deliberately independent from the legacy
-- employer.messages table: social and work messaging must never share access rules.
CREATE SCHEMA IF NOT EXISTS ondwira;

CREATE TABLE IF NOT EXISTS ondwira.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kind TEXT NOT NULL CHECK (kind IN ('direct', 'group')),
    title TEXT,
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    archived_at TIMESTAMPTZ,
    disappearing_seconds INTEGER CHECK (disappearing_seconds IS NULL OR disappearing_seconds >= 60)
);

CREATE TABLE IF NOT EXISTS ondwira.conversation_members (
    conversation_id UUID NOT NULL REFERENCES ondwira.conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    account_type TEXT NOT NULL CHECK (account_type IN ('professional', 'employer')),
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    membership_status TEXT NOT NULL DEFAULT 'accepted' CHECK (membership_status IN ('pending', 'accepted', 'declined', 'removed')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_read_at TIMESTAMPTZ,
    archived_at TIMESTAMPTZ,
    locked_at TIMESTAMPTZ,
    muted_until TIMESTAMPTZ,
    PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS ondwira.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES ondwira.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('professional', 'employer')),
    -- Stored encrypted by the server; ciphertext needs room beyond the 8,000-character message limit.
    body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 12000),
    message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'audio', 'system')),
    reply_to_id UUID REFERENCES ondwira.messages(id) ON DELETE SET NULL,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    edited_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ondwira_conversation_members_user_idx
    ON ondwira.conversation_members (user_id, membership_status, joined_at DESC);
CREATE INDEX IF NOT EXISTS ondwira_messages_conversation_created_idx
    ON ondwira.messages (conversation_id, created_at DESC);

ALTER TABLE ondwira.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ondwira.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE ondwira.messages ENABLE ROW LEVEL SECURITY;

-- Requests are authorized by server routes while the platform still uses its
-- existing custom JWT. No browser client receives direct table access yet.
