-- Shared rich-chat capabilities for Social and Work conversations.
-- The browser never receives direct table or bucket access: all reads and writes
-- continue through membership-checked server routes using the existing Ondwira session.

ALTER TABLE ondwira.conversations
    ADD COLUMN IF NOT EXISTS view_once_default BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE ondwira.messages
    DROP CONSTRAINT IF EXISTS messages_message_type_check;

ALTER TABLE ondwira.messages
    ADD CONSTRAINT messages_message_type_check CHECK (
        message_type IN (
            'text', 'image', 'video', 'file', 'audio', 'sticker',
            'location', 'contact', 'poll', 'event', 'meeting', 'ai_action', 'system'
        )
    );

ALTER TABLE ondwira.messages
    ADD COLUMN IF NOT EXISTS view_once BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS payload_ciphertext TEXT,
    ADD COLUMN IF NOT EXISTS deleted_for_everyone_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS ondwira.message_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES ondwira.messages(id) ON DELETE CASCADE,
    storage_bucket TEXT NOT NULL DEFAULT 'ondwira-chat',
    storage_path TEXT NOT NULL UNIQUE,
    attachment_type TEXT NOT NULL CHECK (
        attachment_type IN ('image', 'video', 'camera', 'document', 'audio', 'sticker')
    ),
    encrypted_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    byte_size BIGINT NOT NULL CHECK (byte_size > 0 AND byte_size <= 52428800),
    width INTEGER CHECK (width IS NULL OR width > 0),
    height INTEGER CHECK (height IS NULL OR height > 0),
    duration_seconds INTEGER CHECK (duration_seconds IS NULL OR duration_seconds >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ondwira.message_receipts (
    message_id UUID NOT NULL REFERENCES ondwira.messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    viewed_at TIMESTAMPTZ,
    PRIMARY KEY (message_id, user_id)
);

CREATE TABLE IF NOT EXISTS ondwira.message_reactions (
    message_id UUID NOT NULL REFERENCES ondwira.messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    emoji TEXT NOT NULL CHECK (char_length(emoji) BETWEEN 1 AND 16),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (message_id, user_id, emoji)
);

CREATE TABLE IF NOT EXISTS ondwira.message_polls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL UNIQUE REFERENCES ondwira.messages(id) ON DELETE CASCADE,
    encrypted_question TEXT NOT NULL,
    allows_multiple BOOLEAN NOT NULL DEFAULT false,
    closes_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ondwira.message_poll_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id UUID NOT NULL REFERENCES ondwira.message_polls(id) ON DELETE CASCADE,
    encrypted_label TEXT NOT NULL,
    position SMALLINT NOT NULL CHECK (position BETWEEN 0 AND 20),
    UNIQUE (poll_id, position)
);

CREATE TABLE IF NOT EXISTS ondwira.message_poll_votes (
    poll_id UUID NOT NULL REFERENCES ondwira.message_polls(id) ON DELETE CASCADE,
    option_id UUID NOT NULL REFERENCES ondwira.message_poll_options(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (poll_id, option_id, user_id)
);

CREATE TABLE IF NOT EXISTS ondwira.message_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL UNIQUE REFERENCES ondwira.messages(id) ON DELETE CASCADE,
    event_kind TEXT NOT NULL CHECK (event_kind IN ('social_event', 'work_event', 'meeting')),
    encrypted_title TEXT NOT NULL,
    encrypted_description TEXT,
    encrypted_location TEXT,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ,
    meeting_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (ends_at IS NULL OR ends_at > starts_at)
);

CREATE TABLE IF NOT EXISTS ondwira.message_event_responses (
    event_id UUID NOT NULL REFERENCES ondwira.message_events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    response TEXT NOT NULL CHECK (response IN ('going', 'maybe', 'declined')),
    responded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (event_id, user_id)
);

CREATE TABLE IF NOT EXISTS ondwira.saved_stickers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL,
    storage_bucket TEXT NOT NULL DEFAULT 'ondwira-chat',
    storage_path TEXT NOT NULL UNIQUE,
    encrypted_name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    archived_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS ondwira.conversation_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES ondwira.conversations(id) ON DELETE CASCADE,
    message_id UUID REFERENCES ondwira.messages(id) ON DELETE SET NULL,
    reporter_id UUID NOT NULL,
    encrypted_reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewing', 'resolved', 'dismissed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ondwira.blocked_accounts (
    blocker_id UUID NOT NULL,
    blocked_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (blocker_id, blocked_id),
    CHECK (blocker_id <> blocked_id)
);

CREATE INDEX IF NOT EXISTS ondwira_message_attachments_message_idx
    ON ondwira.message_attachments (message_id);
CREATE INDEX IF NOT EXISTS ondwira_message_receipts_user_idx
    ON ondwira.message_receipts (user_id, read_at, delivered_at);
CREATE INDEX IF NOT EXISTS ondwira_message_reactions_message_idx
    ON ondwira.message_reactions (message_id, created_at);
CREATE INDEX IF NOT EXISTS ondwira_message_poll_votes_poll_idx
    ON ondwira.message_poll_votes (poll_id, option_id);
CREATE INDEX IF NOT EXISTS ondwira_conversation_reports_status_idx
    ON ondwira.conversation_reports (status, created_at DESC);

ALTER TABLE ondwira.message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ondwira.message_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ondwira.message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ondwira.message_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE ondwira.message_poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE ondwira.message_poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ondwira.message_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ondwira.message_event_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE ondwira.saved_stickers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ondwira.conversation_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE ondwira.blocked_accounts ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE
    ondwira.message_attachments,
    ondwira.message_receipts,
    ondwira.message_reactions,
    ondwira.message_polls,
    ondwira.message_poll_options,
    ondwira.message_poll_votes,
    ondwira.message_events,
    ondwira.message_event_responses,
    ondwira.saved_stickers,
    ondwira.conversation_reports,
    ondwira.blocked_accounts
FROM anon, authenticated;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'ondwira-chat',
    'ondwira-chat',
    false,
    52428800,
    ARRAY[
        'image/jpeg', 'image/png', 'image/webp', 'image/gif',
        'video/mp4', 'video/webm',
        'audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/webm',
        'application/pdf', 'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;
