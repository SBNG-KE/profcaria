-- Rich private Social updates and durable Work meeting scheduling.
-- Ondwira continues to authorize these private-schema tables in server routes
-- using its custom encrypted session. Browser roles receive no direct grants.

ALTER TABLE ondwira.social_updates
    ALTER COLUMN enc_body DROP NOT NULL,
    ADD COLUMN IF NOT EXISTS content_type TEXT NOT NULL DEFAULT 'text'
        CHECK (content_type IN ('text', 'photo', 'video', 'mixed')),
    ADD COLUMN IF NOT EXISTS text_style TEXT NOT NULL DEFAULT 'editorial'
        CHECK (text_style IN ('editorial', 'modern', 'heritage', 'quiet', 'statement')),
    ADD COLUMN IF NOT EXISTS background_style TEXT NOT NULL DEFAULT 'parchment'
        CHECK (background_style IN ('parchment', 'terracotta', 'ink', 'olive', 'gold', 'rose')),
    ADD COLUMN IF NOT EXISTS mood_emoji TEXT,
    ADD COLUMN IF NOT EXISTS enc_prompt TEXT,
    ADD COLUMN IF NOT EXISTS comments_count INTEGER NOT NULL DEFAULT 0
        CHECK (comments_count >= 0);

ALTER TABLE ondwira.social_updates
    DROP CONSTRAINT IF EXISTS social_updates_content_present_check;
ALTER TABLE ondwira.social_updates
    ADD CONSTRAINT social_updates_content_present_check CHECK (
        enc_body IS NOT NULL OR content_type IN ('photo', 'video', 'mixed')
    );

CREATE TABLE IF NOT EXISTS ondwira.social_update_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    update_id UUID NOT NULL REFERENCES ondwira.social_updates(id) ON DELETE CASCADE,
    storage_bucket TEXT NOT NULL DEFAULT 'ondwira-updates',
    storage_path TEXT NOT NULL UNIQUE,
    media_type TEXT NOT NULL CHECK (media_type IN ('photo', 'video')),
    mime_type TEXT NOT NULL,
    byte_size BIGINT NOT NULL CHECK (byte_size > 0 AND byte_size <= 104857600),
    width INTEGER CHECK (width IS NULL OR width > 0),
    height INTEGER CHECK (height IS NULL OR height > 0),
    duration_seconds INTEGER CHECK (duration_seconds IS NULL OR duration_seconds >= 0),
    position SMALLINT NOT NULL DEFAULT 0 CHECK (position BETWEEN 0 AND 9),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (update_id, position)
);

CREATE TABLE IF NOT EXISTS ondwira.social_update_views (
    update_id UUID NOT NULL REFERENCES ondwira.social_updates(id) ON DELETE CASCADE,
    viewer_id UUID NOT NULL,
    first_viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completion_percent SMALLINT NOT NULL DEFAULT 0 CHECK (completion_percent BETWEEN 0 AND 100),
    PRIMARY KEY (update_id, viewer_id)
);

CREATE TABLE IF NOT EXISTS ondwira.social_update_reactions (
    update_id UUID NOT NULL REFERENCES ondwira.social_updates(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    emoji TEXT NOT NULL CHECK (char_length(emoji) BETWEEN 1 AND 16),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (update_id, user_id)
);

CREATE TABLE IF NOT EXISTS ondwira.social_update_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    update_id UUID NOT NULL REFERENCES ondwira.social_updates(id) ON DELETE CASCADE,
    author_id UUID NOT NULL,
    enc_body TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ondwira_update_media_update_idx
    ON ondwira.social_update_media (update_id, position);
CREATE INDEX IF NOT EXISTS ondwira_update_views_viewer_idx
    ON ondwira.social_update_views (viewer_id, last_viewed_at DESC);
CREATE INDEX IF NOT EXISTS ondwira_update_replies_update_idx
    ON ondwira.social_update_replies (update_id, created_at DESC)
    WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS ondwira.work_meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES ondwira.organizations(id) ON DELETE CASCADE,
    work_group_id UUID REFERENCES ondwira.work_groups(id) ON DELETE SET NULL,
    conversation_id UUID REFERENCES ondwira.conversations(id) ON DELETE SET NULL,
    organizer_id UUID NOT NULL,
    enc_title TEXT NOT NULL,
    enc_agenda TEXT,
    enc_location TEXT,
    enc_meeting_url TEXT,
    provider TEXT NOT NULL DEFAULT 'custom'
        CHECK (provider IN ('google_meet', 'zoom', 'teams', 'jitsi', 'custom', 'ondwira')),
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    timezone TEXT NOT NULL DEFAULT 'Africa/Nairobi',
    reminder_minutes INTEGER[] NOT NULL DEFAULT ARRAY[10],
    status TEXT NOT NULL DEFAULT 'scheduled'
        CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    native_room_ready BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    cancelled_at TIMESTAMPTZ,
    CHECK (ends_at > starts_at)
);

CREATE TABLE IF NOT EXISTS ondwira.work_meeting_participants (
    meeting_id UUID NOT NULL REFERENCES ondwira.work_meetings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    participant_role TEXT NOT NULL DEFAULT 'required'
        CHECK (participant_role IN ('host', 'required', 'optional')),
    response TEXT NOT NULL DEFAULT 'pending'
        CHECK (response IN ('pending', 'accepted', 'tentative', 'declined')),
    responded_at TIMESTAMPTZ,
    joined_at TIMESTAMPTZ,
    left_at TIMESTAMPTZ,
    PRIMARY KEY (meeting_id, user_id)
);

CREATE TABLE IF NOT EXISTS ondwira.work_meeting_reminders (
    meeting_id UUID NOT NULL REFERENCES ondwira.work_meetings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    reminder_minutes INTEGER NOT NULL CHECK (reminder_minutes BETWEEN 0 AND 10080),
    delivered_at TIMESTAMPTZ,
    dismissed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (meeting_id, user_id, reminder_minutes)
);

CREATE INDEX IF NOT EXISTS ondwira_work_meetings_org_start_idx
    ON ondwira.work_meetings (organization_id, starts_at)
    WHERE status <> 'cancelled';
CREATE INDEX IF NOT EXISTS ondwira_work_meeting_participant_idx
    ON ondwira.work_meeting_participants (user_id, meeting_id);
CREATE INDEX IF NOT EXISTS ondwira_work_meeting_reminder_due_idx
    ON ondwira.work_meeting_reminders (user_id, delivered_at, reminder_minutes);

ALTER TABLE ondwira.social_update_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE ondwira.social_update_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE ondwira.social_update_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ondwira.social_update_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE ondwira.work_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ondwira.work_meeting_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE ondwira.work_meeting_reminders ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE
    ondwira.social_update_media,
    ondwira.social_update_views,
    ondwira.social_update_reactions,
    ondwira.social_update_replies,
    ondwira.work_meetings,
    ondwira.work_meeting_participants,
    ondwira.work_meeting_reminders
FROM anon, authenticated;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'ondwira-updates',
    'ondwira-updates',
    false,
    104857600,
    ARRAY[
        'image/jpeg', 'image/png', 'image/webp', 'image/gif',
        'video/mp4', 'video/webm', 'video/quicktime'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;
