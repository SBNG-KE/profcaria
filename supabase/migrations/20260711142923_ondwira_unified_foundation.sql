-- Durable foundations for the unified Ondwira account. Legacy professional and
-- employer tables remain migration sources until their workflows are ported.
CREATE SCHEMA IF NOT EXISTS ondwira;

ALTER TABLE ondwira.conversations ADD COLUMN IF NOT EXISTS context TEXT NOT NULL DEFAULT 'social'
    CHECK (context IN ('social', 'work'));
CREATE INDEX IF NOT EXISTS ondwira_conversations_context_idx ON ondwira.conversations (context, updated_at DESC);

CREATE TABLE IF NOT EXISTS ondwira.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    legacy_company_id UUID UNIQUE,
    name TEXT NOT NULL,
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ondwira.organization_members (
    organization_id UUID NOT NULL REFERENCES ondwira.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    account_type TEXT NOT NULL CHECK (account_type IN ('professional', 'employer')),
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'manager', 'member')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('invited', 'active', 'suspended', 'left', 'removed')),
    joined_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    PRIMARY KEY (organization_id, user_id)
);

CREATE TABLE IF NOT EXISTS ondwira.work_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES ondwira.organizations(id) ON DELETE CASCADE,
    conversation_id UUID UNIQUE REFERENCES ondwira.conversations(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    group_type TEXT NOT NULL DEFAULT 'custom' CHECK (group_type IN ('company', 'team', 'project', 'job', 'custom')),
    auto_membership BOOLEAN NOT NULL DEFAULT false,
    created_by UUID NOT NULL,
    archived_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ondwira_one_company_group_idx
    ON ondwira.work_groups (organization_id) WHERE group_type = 'company' AND archived_at IS NULL;

CREATE TABLE IF NOT EXISTS ondwira.work_group_members (
    group_id UUID NOT NULL REFERENCES ondwira.work_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    membership_source TEXT NOT NULL DEFAULT 'manual' CHECK (membership_source IN ('manual', 'organization', 'job', 'employment')),
    source_id UUID,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    removed_at TIMESTAMPTZ,
    PRIMARY KEY (group_id, user_id)
);

CREATE TABLE IF NOT EXISTS ondwira.employment_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    organization_id UUID REFERENCES ondwira.organizations(id) ON DELETE SET NULL,
    legacy_application_id UUID UNIQUE,
    job_id UUID,
    title TEXT NOT NULL,
    employment_type TEXT,
    status TEXT NOT NULL CHECK (status IN ('offered', 'active', 'notice', 'ended', 'terminated', 'resigned')),
    started_at DATE,
    ended_at DATE,
    end_reason TEXT,
    source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'application', 'contract', 'organization')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ondwira_employment_user_idx ON ondwira.employment_records (user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS ondwira_employment_org_idx ON ondwira.employment_records (organization_id, status);

CREATE TABLE IF NOT EXISTS ondwira.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL,
    enc_title TEXT NOT NULL,
    document_kind TEXT NOT NULL CHECK (document_kind IN ('cv', 'cover_letter', 'certificate', 'contract', 'portfolio', 'identity', 'note', 'other')),
    source_type TEXT NOT NULL CHECK (source_type IN ('written', 'upload', 'linked', 'generated', 'legacy')),
    enc_content TEXT,
    enc_file_url TEXT,
    enc_external_url TEXT,
    mime_type TEXT,
    file_size BIGINT CHECK (file_size IS NULL OR file_size >= 0),
    credential_issuer TEXT,
    credential_id TEXT,
    issued_at DATE,
    expires_at DATE,
    agent_readable BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    archived_at TIMESTAMPTZ,
    CHECK (enc_content IS NOT NULL OR enc_file_url IS NOT NULL OR enc_external_url IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS ondwira_documents_owner_idx ON ondwira.documents (owner_id, document_kind, updated_at DESC);

CREATE TABLE IF NOT EXISTS ondwira.signatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL,
    label TEXT NOT NULL DEFAULT 'My signature',
    -- SVG/path data is encrypted server-side. Bounds retain only geometry needed
    -- to normalize a small or oversized drawing into a document signature box.
    enc_vector_data TEXT NOT NULL,
    source TEXT NOT NULL CHECK (source IN ('touch', 'pen', 'mouse', 'upload', 'device')),
    aspect_ratio NUMERIC(10, 4) NOT NULL CHECK (aspect_ratio > 0),
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_used_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS ondwira_one_default_signature_idx
    ON ondwira.signatures (owner_id) WHERE is_default AND revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS ondwira.contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES ondwira.organizations(id) ON DELETE RESTRICT,
    worker_id UUID NOT NULL,
    document_id UUID NOT NULL REFERENCES ondwira.documents(id) ON DELETE RESTRICT,
    employment_record_id UUID REFERENCES ondwira.employment_records(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'partially_signed', 'signed', 'declined', 'voided', 'ended')),
    sent_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ondwira.contract_signatures (
    contract_id UUID NOT NULL REFERENCES ondwira.contracts(id) ON DELETE CASCADE,
    signer_id UUID NOT NULL,
    signature_id UUID REFERENCES ondwira.signatures(id) ON DELETE SET NULL,
    signer_role TEXT NOT NULL CHECK (signer_role IN ('worker', 'organization')),
    enc_signature_snapshot TEXT NOT NULL,
    signed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ip_hash TEXT,
    user_agent_hash TEXT,
    PRIMARY KEY (contract_id, signer_id, signer_role)
);

CREATE TABLE IF NOT EXISTS ondwira.agent_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL,
    provider TEXT NOT NULL,
    display_name TEXT NOT NULL,
    scopes TEXT[] NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'revoked')),
    enc_credential TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_used_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    UNIQUE (owner_id, provider, display_name)
);

CREATE TABLE IF NOT EXISTS ondwira.social_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL,
    author_type TEXT NOT NULL CHECK (author_type IN ('professional', 'employer')),
    enc_body TEXT NOT NULL,
    audience_mode TEXT NOT NULL CHECK (audience_mode IN ('all_contacts', 'selected')),
    allow_replies BOOLEAN NOT NULL DEFAULT true,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS ondwira.social_update_audience (
    update_id UUID NOT NULL REFERENCES ondwira.social_updates(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    PRIMARY KEY (update_id, user_id)
);

CREATE INDEX IF NOT EXISTS ondwira_updates_active_idx ON ondwira.social_updates (expires_at DESC) WHERE deleted_at IS NULL;

ALTER TABLE ondwira.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ondwira.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE ondwira.work_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE ondwira.work_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE ondwira.employment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE ondwira.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ondwira.signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE ondwira.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ondwira.contract_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE ondwira.agent_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE ondwira.social_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE ondwira.social_update_audience ENABLE ROW LEVEL SECURITY;

-- These tables are server-only while Ondwira still uses its custom encrypted
-- session cookie. No anon/authenticated grants are added. Service-role routes
-- must perform membership and ownership checks for every operation.
