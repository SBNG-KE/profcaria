-- Canonical Ondwira identity layer. Legacy professional/employer records remain
-- attached as migration identities while all new product concepts point to one
-- person account and zero-or-more organisations.
CREATE SCHEMA IF NOT EXISTS ondwira;

CREATE TABLE IF NOT EXISTS ondwira.accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
    email_index TEXT NOT NULL,
    enc_email TEXT,
    enc_display_name TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'closed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_login_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ondwira_accounts_email_idx ON ondwira.accounts (email_index);
CREATE INDEX IF NOT EXISTS ondwira_accounts_active_idx ON ondwira.accounts (status) WHERE status = 'active';

CREATE TABLE IF NOT EXISTS ondwira.account_identities (
    account_id UUID NOT NULL REFERENCES ondwira.accounts(id) ON DELETE CASCADE,
    identity_type TEXT NOT NULL CHECK (identity_type IN ('professional', 'employer', 'supabase_auth')),
    identity_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (identity_type, identity_id),
    UNIQUE (account_id, identity_type)
);

CREATE TABLE IF NOT EXISTS ondwira.account_preferences (
    account_id UUID PRIMARY KEY REFERENCES ondwira.accounts(id) ON DELETE CASCADE,
    theme TEXT NOT NULL DEFAULT 'system' CHECK (theme IN ('system', 'light', 'dark')),
    font_family TEXT NOT NULL DEFAULT 'modern' CHECK (font_family IN ('modern', 'heritage', 'editorial', 'accessible', 'system')),
    text_scale NUMERIC(4, 2) NOT NULL DEFAULT 1.00 CHECK (text_scale BETWEEN 0.85 AND 1.35),
    reduced_motion BOOLEAN NOT NULL DEFAULT false,
    compact_mode BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ondwira.account_security (
    account_id UUID PRIMARY KEY REFERENCES ondwira.accounts(id) ON DELETE CASCADE,
    requires_2fa BOOLEAN NOT NULL DEFAULT false,
    has_passkey BOOLEAN NOT NULL DEFAULT false,
    has_totp BOOLEAN NOT NULL DEFAULT false,
    has_email_otp BOOLEAN NOT NULL DEFAULT false,
    default_method TEXT CHECK (default_method IS NULL OR default_method IN ('passkey', 'totp', 'email')),
    last_verified_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ondwira.organization_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES ondwira.organizations(id) ON DELETE CASCADE,
    email_index TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'manager', 'member')),
    invited_by UUID NOT NULL REFERENCES ondwira.accounts(id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'revoked', 'expired')),
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_by UUID REFERENCES ondwira.accounts(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    accepted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ondwira_org_invites_lookup_idx
    ON ondwira.organization_invitations (email_index, status, expires_at DESC);

-- Backfill each legacy login into exactly one canonical account without
-- changing any legacy primary key. This makes migration reversible and keeps
-- current JWT subjects valid while routes are ported.
INSERT INTO ondwira.accounts (id, email_index, enc_email, enc_display_name, status, created_at, updated_at, last_login_at)
SELECT id, email_index, enc_email,
       NULL,
       CASE WHEN tos_status = 'rejected' THEN 'suspended' ELSE 'active' END,
       coalesce(created_at, now()), coalesce(updated_at, now()), last_login
FROM professional.users
ON CONFLICT (id) DO NOTHING;

INSERT INTO ondwira.account_identities (account_id, identity_type, identity_id)
SELECT id, 'professional', id FROM professional.users
ON CONFLICT DO NOTHING;

INSERT INTO ondwira.account_security (account_id, requires_2fa, has_passkey, has_totp, has_email_otp, default_method)
SELECT id, coalesce(requires_2fa, false), coalesce(has_passkey, false), coalesce(has_totp, false),
       coalesce(has_email_otp, false),
       CASE WHEN default_2fa_method IN ('passkey', 'totp', 'email') THEN default_2fa_method ELSE NULL END
FROM professional.users
ON CONFLICT (account_id) DO UPDATE SET
    requires_2fa = EXCLUDED.requires_2fa,
    has_passkey = EXCLUDED.has_passkey,
    has_totp = EXCLUDED.has_totp,
    has_email_otp = EXCLUDED.has_email_otp,
    default_method = EXCLUDED.default_method,
    updated_at = now();

-- A legacy employer login becomes a transitional account identity. Creating
-- organisations in the unified application no longer creates employer logins.
INSERT INTO ondwira.accounts (id, email_index, enc_email, enc_display_name, status, created_at, updated_at, last_login_at)
SELECT id, work_email_index, enc_work_email, enc_company_name,
       CASE WHEN tos_status = 'rejected' THEN 'suspended' ELSE 'active' END,
       coalesce(created_at, now()), coalesce(updated_at, now()), last_active_at
FROM employer.companies
ON CONFLICT (id) DO NOTHING;

INSERT INTO ondwira.account_identities (account_id, identity_type, identity_id)
SELECT id, 'employer', id FROM employer.companies
ON CONFLICT DO NOTHING;

INSERT INTO ondwira.account_security (account_id, requires_2fa, has_passkey, has_totp, has_email_otp, default_method)
SELECT id, coalesce(requires_2fa, false), coalesce(has_passkey, false), coalesce(has_totp, false),
       coalesce(has_email_otp, false),
       CASE WHEN default_2fa_method IN ('passkey', 'totp', 'email') THEN default_2fa_method ELSE NULL END
FROM employer.companies
ON CONFLICT (account_id) DO NOTHING;

INSERT INTO ondwira.account_preferences (account_id)
SELECT id FROM ondwira.accounts
ON CONFLICT (account_id) DO NOTHING;

ALTER TABLE ondwira.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ondwira.account_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE ondwira.account_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE ondwira.account_security ENABLE ROW LEVEL SECURITY;
ALTER TABLE ondwira.organization_invitations ENABLE ROW LEVEL SECURITY;

-- Ondwira tables are currently reached only by authenticated server routes.
-- Expose the schema to PostgREST for the service role, while granting no table
-- access to anon or authenticated browser clients.
GRANT USAGE ON SCHEMA ondwira TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA ondwira TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA ondwira TO service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA ondwira GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA ondwira GRANT ALL ON SEQUENCES TO service_role;

-- Preserve every schema already used by the live application while adding
-- Ondwira to the Data API. The manual setting is explicit to prevent an update
-- from accidentally hiding the legacy migration sources.
ALTER ROLE authenticator SET pgrst.db_schemas = 'public, professional, employer, ondwira';
NOTIFY pgrst, 'reload config';
NOTIFY pgrst, 'reload schema';
