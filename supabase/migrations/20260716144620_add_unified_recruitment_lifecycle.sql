-- Unified Ondwira recruitment and employment lifecycle.
-- Legacy employer/professional records remain migration sources; every new
-- workflow below belongs to one account and zero-or-more organisations.

CREATE TABLE IF NOT EXISTS ondwira.jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES ondwira.organizations(id) ON DELETE CASCADE,
    legacy_job_id UUID UNIQUE,
    created_by UUID NOT NULL REFERENCES ondwira.accounts(id) ON DELETE RESTRICT,
    job_code TEXT NOT NULL UNIQUE,
    share_slug TEXT NOT NULL UNIQUE,
    enc_title TEXT NOT NULL,
    enc_summary TEXT,
    enc_description TEXT NOT NULL,
    enc_location TEXT,
    enc_requirements TEXT,
    enc_benefits TEXT,
    enc_compensation TEXT,
    role_category TEXT,
    skill_tags TEXT[] NOT NULL DEFAULT '{}',
    employment_type TEXT NOT NULL DEFAULT 'full_time'
        CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'temporary', 'internship', 'apprenticeship', 'freelance')),
    location_type TEXT NOT NULL DEFAULT 'remote'
        CHECK (location_type IN ('remote', 'hybrid', 'onsite', 'flexible')),
    seniority TEXT NOT NULL DEFAULT 'mid'
        CHECK (seniority IN ('entry', 'junior', 'mid', 'senior', 'lead', 'executive', 'not_specified')),
    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'published', 'paused', 'closed', 'filled', 'cancelled')),
    visibility TEXT NOT NULL DEFAULT 'public'
        CHECK (visibility IN ('public', 'link_only', 'organization')),
    application_mode TEXT NOT NULL DEFAULT 'simple'
        CHECK (application_mode IN ('simple', 'structured')),
    application_limit INTEGER CHECK (application_limit IS NULL OR application_limit > 0),
    application_count INTEGER NOT NULL DEFAULT 0 CHECK (application_count >= 0),
    hired_count INTEGER NOT NULL DEFAULT 0 CHECK (hired_count >= 0),
    blind_review BOOLEAN NOT NULL DEFAULT false,
    allow_referrals BOOLEAN NOT NULL DEFAULT true,
    allow_internal_candidates BOOLEAN NOT NULL DEFAULT true,
    timezone TEXT NOT NULL DEFAULT 'Africa/Nairobi',
    published_at TIMESTAMPTZ,
    closes_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    embedding_json JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (closes_at IS NULL OR closes_at > created_at)
);

CREATE TABLE IF NOT EXISTS ondwira.job_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES ondwira.jobs(id) ON DELETE CASCADE,
    enc_prompt TEXT NOT NULL,
    question_type TEXT NOT NULL DEFAULT 'short_text'
        CHECK (question_type IN ('short_text', 'long_text', 'yes_no', 'single_choice', 'multi_choice', 'number', 'date')),
    enc_options TEXT,
    required BOOLEAN NOT NULL DEFAULT false,
    knockout BOOLEAN NOT NULL DEFAULT false,
    expected_answer JSONB,
    score_weight SMALLINT NOT NULL DEFAULT 0 CHECK (score_weight BETWEEN 0 AND 100),
    position SMALLINT NOT NULL DEFAULT 0 CHECK (position BETWEEN 0 AND 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (job_id, position)
);

CREATE TABLE IF NOT EXISTS ondwira.job_collaborators (
    job_id UUID NOT NULL REFERENCES ondwira.jobs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES ondwira.accounts(id) ON DELETE CASCADE,
    access_level TEXT NOT NULL DEFAULT 'reviewer'
        CHECK (access_level IN ('owner', 'manager', 'reviewer', 'interviewer', 'viewer')),
    added_by UUID NOT NULL REFERENCES ondwira.accounts(id) ON DELETE RESTRICT,
    added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    removed_at TIMESTAMPTZ,
    PRIMARY KEY (job_id, user_id)
);

CREATE TABLE IF NOT EXISTS ondwira.job_screening_profiles (
    job_id UUID PRIMARY KEY REFERENCES ondwira.jobs(id) ON DELETE CASCADE,
    mode TEXT NOT NULL DEFAULT 'assist'
        CHECK (mode IN ('off', 'assist', 'triage')),
    minimum_review_score SMALLINT NOT NULL DEFAULT 45 CHECK (minimum_review_score BETWEEN 0 AND 100),
    auto_shortlist_score SMALLINT CHECK (auto_shortlist_score IS NULL OR auto_shortlist_score BETWEEN 0 AND 100),
    auto_hold_below_score SMALLINT CHECK (auto_hold_below_score IS NULL OR auto_hold_below_score BETWEEN 0 AND 100),
    minimum_years NUMERIC(5, 2) CHECK (minimum_years IS NULL OR minimum_years >= 0),
    required_skills TEXT[] NOT NULL DEFAULT '{}',
    preferred_skills TEXT[] NOT NULL DEFAULT '{}',
    required_document_kinds TEXT[] NOT NULL DEFAULT '{}',
    require_verified_history BOOLEAN NOT NULL DEFAULT false,
    human_review_required BOOLEAN NOT NULL DEFAULT true,
    policy_version INTEGER NOT NULL DEFAULT 1 CHECK (policy_version > 0),
    configured_by UUID NOT NULL REFERENCES ondwira.accounts(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (
        auto_shortlist_score IS NULL OR auto_hold_below_score IS NULL
        OR auto_shortlist_score > auto_hold_below_score
    )
);

CREATE TABLE IF NOT EXISTS ondwira.job_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES ondwira.jobs(id) ON DELETE CASCADE,
    share_code TEXT NOT NULL UNIQUE,
    channel TEXT NOT NULL DEFAULT 'copy'
        CHECK (channel IN ('copy', 'email', 'message', 'social', 'qr', 'referral', 'internal')),
    created_by UUID NOT NULL REFERENCES ondwira.accounts(id) ON DELETE RESTRICT,
    referrer_id UUID REFERENCES ondwira.accounts(id) ON DELETE SET NULL,
    click_count INTEGER NOT NULL DEFAULT 0 CHECK (click_count >= 0),
    application_count INTEGER NOT NULL DEFAULT 0 CHECK (application_count >= 0),
    expires_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ondwira.job_events (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    job_id UUID NOT NULL REFERENCES ondwira.jobs(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES ondwira.organizations(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES ondwira.accounts(id) ON DELETE SET NULL,
    application_id UUID,
    share_id UUID REFERENCES ondwira.job_shares(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL
        CHECK (event_type IN (
            'created', 'published', 'updated', 'paused', 'resumed', 'closed', 'filled', 'cancelled',
            'viewed', 'shared', 'share_opened', 'application_started', 'application_submitted',
            'application_withdrawn', 'candidate_shortlisted', 'candidate_rejected', 'interview_scheduled',
            'offer_sent', 'offer_accepted', 'offer_declined', 'hired'
        )),
    visitor_hash TEXT,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ondwira.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES ondwira.jobs(id) ON DELETE RESTRICT,
    organization_id UUID NOT NULL REFERENCES ondwira.organizations(id) ON DELETE CASCADE,
    applicant_id UUID NOT NULL REFERENCES ondwira.accounts(id) ON DELETE RESTRICT,
    source TEXT NOT NULL DEFAULT 'direct'
        CHECK (source IN ('direct', 'share', 'invite', 'referral', 'internal', 'legacy')),
    share_id UUID REFERENCES ondwira.job_shares(id) ON DELETE SET NULL,
    referred_by UUID REFERENCES ondwira.accounts(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'submitted'
        CHECK (status IN (
            'draft', 'submitted', 'screening', 'needs_review', 'on_hold', 'shortlisted',
            'interview', 'offer', 'offer_accepted', 'offer_declined', 'hired',
            'rejected', 'withdrawn', 'employment_ended'
        )),
    enc_cover_note TEXT,
    enc_candidate_snapshot TEXT NOT NULL,
    consent_version TEXT NOT NULL DEFAULT '2026-07',
    consented_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    screening_status TEXT NOT NULL DEFAULT 'pending'
        CHECK (screening_status IN ('pending', 'complete', 'failed', 'not_requested')),
    screening_score NUMERIC(5, 2) CHECK (screening_score IS NULL OR screening_score BETWEEN 0 AND 100),
    screening_recommendation TEXT
        CHECK (screening_recommendation IS NULL OR screening_recommendation IN ('strong_fit', 'review', 'hold')),
    screening_policy_version INTEGER,
    enc_screening_summary TEXT,
    assigned_to UUID REFERENCES ondwira.accounts(id) ON DELETE SET NULL,
    stage_due_at TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    first_reviewed_at TIMESTAMPTZ,
    shortlisted_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    withdrawn_at TIMESTAMPTZ,
    hired_at TIMESTAMPTZ,
    retention_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (job_id, applicant_id)
);

ALTER TABLE ondwira.job_events
    ADD CONSTRAINT ondwira_job_events_application_fk
    FOREIGN KEY (application_id) REFERENCES ondwira.applications(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS ondwira.application_answers (
    application_id UUID NOT NULL REFERENCES ondwira.applications(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES ondwira.job_questions(id) ON DELETE RESTRICT,
    enc_answer TEXT NOT NULL,
    passed_knockout BOOLEAN,
    awarded_score NUMERIC(6, 2) CHECK (awarded_score IS NULL OR awarded_score >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (application_id, question_id)
);

CREATE TABLE IF NOT EXISTS ondwira.application_documents (
    application_id UUID NOT NULL REFERENCES ondwira.applications(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES ondwira.documents(id) ON DELETE RESTRICT,
    document_kind TEXT NOT NULL,
    enc_title_snapshot TEXT NOT NULL,
    consented_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    access_revoked_at TIMESTAMPTZ,
    PRIMARY KEY (application_id, document_id)
);

CREATE TABLE IF NOT EXISTS ondwira.application_stage_events (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    application_id UUID NOT NULL REFERENCES ondwira.applications(id) ON DELETE CASCADE,
    from_status TEXT,
    to_status TEXT NOT NULL,
    actor_id UUID REFERENCES ondwira.accounts(id) ON DELETE SET NULL,
    actor_scope TEXT NOT NULL DEFAULT 'system'
        CHECK (actor_scope IN ('applicant', 'organization', 'system', 'ai')),
    reason_code TEXT,
    enc_note TEXT,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ondwira.application_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES ondwira.applications(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES ondwira.accounts(id) ON DELETE CASCADE,
    recommendation TEXT NOT NULL
        CHECK (recommendation IN ('strong_yes', 'yes', 'mixed', 'no', 'strong_no')),
    score SMALLINT CHECK (score IS NULL OR score BETWEEN 0 AND 100),
    enc_note TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (application_id, reviewer_id)
);

CREATE TABLE IF NOT EXISTS ondwira.application_ai_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES ondwira.applications(id) ON DELETE CASCADE,
    policy_version INTEGER NOT NULL,
    engine TEXT NOT NULL DEFAULT 'ondwira_rules',
    engine_version TEXT NOT NULL DEFAULT '1.0',
    score NUMERIC(5, 2) NOT NULL CHECK (score BETWEEN 0 AND 100),
    recommendation TEXT NOT NULL CHECK (recommendation IN ('strong_fit', 'review', 'hold')),
    confidence NUMERIC(5, 2) NOT NULL DEFAULT 0 CHECK (confidence BETWEEN 0 AND 100),
    feature_scores JSONB NOT NULL DEFAULT '{}',
    missing_evidence TEXT[] NOT NULL DEFAULT '{}',
    matched_skills TEXT[] NOT NULL DEFAULT '{}',
    missing_skills TEXT[] NOT NULL DEFAULT '{}',
    enc_explanation TEXT NOT NULL,
    protected_attributes_excluded BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ondwira.recruitment_interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES ondwira.applications(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES ondwira.organizations(id) ON DELETE CASCADE,
    work_meeting_id UUID REFERENCES ondwira.work_meetings(id) ON DELETE SET NULL,
    stage TEXT NOT NULL DEFAULT 'first'
        CHECK (stage IN ('screening', 'first', 'technical', 'panel', 'final', 'culture', 'other')),
    status TEXT NOT NULL DEFAULT 'proposed'
        CHECK (status IN ('proposed', 'scheduled', 'accepted', 'declined', 'completed', 'cancelled', 'no_show')),
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    timezone TEXT NOT NULL DEFAULT 'Africa/Nairobi',
    provider TEXT NOT NULL DEFAULT 'ondwira'
        CHECK (provider IN ('ondwira', 'google_meet', 'zoom', 'teams', 'jitsi', 'custom', 'in_person', 'phone')),
    enc_location TEXT,
    enc_meeting_url TEXT,
    enc_agenda TEXT,
    candidate_response TEXT NOT NULL DEFAULT 'pending'
        CHECK (candidate_response IN ('pending', 'accepted', 'tentative', 'declined')),
    scheduled_by UUID NOT NULL REFERENCES ondwira.accounts(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (ends_at > starts_at)
);

CREATE TABLE IF NOT EXISTS ondwira.interview_feedback (
    interview_id UUID NOT NULL REFERENCES ondwira.recruitment_interviews(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES ondwira.accounts(id) ON DELETE CASCADE,
    recommendation TEXT NOT NULL
        CHECK (recommendation IN ('strong_yes', 'yes', 'mixed', 'no', 'strong_no')),
    score SMALLINT CHECK (score IS NULL OR score BETWEEN 0 AND 100),
    competency_scores JSONB NOT NULL DEFAULT '{}',
    enc_note TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (interview_id, reviewer_id)
);

CREATE TABLE IF NOT EXISTS ondwira.job_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES ondwira.applications(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES ondwira.organizations(id) ON DELETE CASCADE,
    contract_id UUID REFERENCES ondwira.contracts(id) ON DELETE SET NULL,
    version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'sent', 'viewed', 'negotiating', 'accepted', 'declined', 'expired', 'withdrawn')),
    enc_title TEXT NOT NULL,
    enc_terms TEXT NOT NULL,
    proposed_start_date DATE,
    expires_at TIMESTAMPTZ,
    sent_by UUID NOT NULL REFERENCES ondwira.accounts(id) ON DELETE RESTRICT,
    sent_at TIMESTAMPTZ,
    viewed_at TIMESTAMPTZ,
    responded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (application_id, version)
);

ALTER TABLE ondwira.employment_records
    ADD COLUMN IF NOT EXISTS enc_organization_name TEXT,
    ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'self_declared'
        CHECK (verification_status IN ('self_declared', 'pending', 'verified', 'partially_verified', 'disputed', 'rejected')),
    ADD COLUMN IF NOT EXISTS verification_method TEXT
        CHECK (verification_method IS NULL OR verification_method IN ('ondwira_lifecycle', 'organization_confirmation', 'document', 'reference', 'legacy_import')),
    ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES ondwira.accounts(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS evidence_document_id UUID REFERENCES ondwira.documents(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS external_reference TEXT,
    ADD COLUMN IF NOT EXISTS source_details JSONB NOT NULL DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS last_event_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS ondwira.employment_events (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    employment_record_id UUID NOT NULL REFERENCES ondwira.employment_records(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES ondwira.organizations(id) ON DELETE SET NULL,
    worker_id UUID NOT NULL REFERENCES ondwira.accounts(id) ON DELETE RESTRICT,
    actor_id UUID REFERENCES ondwira.accounts(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL
        CHECK (event_type IN (
            'offer_created', 'contract_sent', 'contract_signed', 'employment_started',
            'probation_started', 'probation_completed', 'promotion', 'role_changed',
            'salary_changed', 'leave_started', 'leave_ended', 'resignation_submitted',
            'resignation_accepted', 'notice_started', 'notice_waived', 'termination_notice',
            'dismissed', 'redundancy', 'employment_ended', 'rehired', 'verification_requested',
            'verification_completed', 'verification_disputed'
        )),
    effective_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    enc_reason TEXT,
    enc_details TEXT,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ondwira.employment_verification_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employment_record_id UUID NOT NULL REFERENCES ondwira.employment_records(id) ON DELETE CASCADE,
    requested_by UUID NOT NULL REFERENCES ondwira.accounts(id) ON DELETE RESTRICT,
    target_organization_id UUID REFERENCES ondwira.organizations(id) ON DELETE SET NULL,
    enc_target_name TEXT,
    enc_target_email TEXT,
    evidence_document_id UUID REFERENCES ondwira.documents(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'sent', 'confirmed', 'partially_confirmed', 'declined', 'expired', 'cancelled')),
    token_hash TEXT UNIQUE,
    enc_response TEXT,
    responded_by UUID REFERENCES ondwira.accounts(id) ON DELETE SET NULL,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ,
    responded_at TIMESTAMPTZ
);

CREATE OR REPLACE FUNCTION ondwira.touch_recruitment_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ondwira_jobs_touch_updated_at ON ondwira.jobs;
CREATE TRIGGER ondwira_jobs_touch_updated_at
BEFORE UPDATE ON ondwira.jobs
FOR EACH ROW EXECUTE FUNCTION ondwira.touch_recruitment_updated_at();

DROP TRIGGER IF EXISTS ondwira_applications_touch_updated_at ON ondwira.applications;
CREATE TRIGGER ondwira_applications_touch_updated_at
BEFORE UPDATE ON ondwira.applications
FOR EACH ROW EXECUTE FUNCTION ondwira.touch_recruitment_updated_at();

DROP TRIGGER IF EXISTS ondwira_screening_touch_updated_at ON ondwira.job_screening_profiles;
CREATE TRIGGER ondwira_screening_touch_updated_at
BEFORE UPDATE ON ondwira.job_screening_profiles
FOR EACH ROW EXECUTE FUNCTION ondwira.touch_recruitment_updated_at();

DROP TRIGGER IF EXISTS ondwira_interviews_touch_updated_at ON ondwira.recruitment_interviews;
CREATE TRIGGER ondwira_interviews_touch_updated_at
BEFORE UPDATE ON ondwira.recruitment_interviews
FOR EACH ROW EXECUTE FUNCTION ondwira.touch_recruitment_updated_at();

DROP TRIGGER IF EXISTS ondwira_offers_touch_updated_at ON ondwira.job_offers;
CREATE TRIGGER ondwira_offers_touch_updated_at
BEFORE UPDATE ON ondwira.job_offers
FOR EACH ROW EXECUTE FUNCTION ondwira.touch_recruitment_updated_at();

CREATE OR REPLACE FUNCTION ondwira.refresh_job_application_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
    target_job UUID;
BEGIN
    IF TG_OP = 'DELETE' THEN
        target_job := OLD.job_id;
    ELSE
        target_job := NEW.job_id;
    END IF;
    UPDATE ondwira.jobs
    SET application_count = (
        SELECT count(*)::INTEGER
        FROM ondwira.applications
        WHERE job_id = target_job AND status <> 'draft'
    ),
    hired_count = (
        SELECT count(*)::INTEGER
        FROM ondwira.applications
        WHERE job_id = target_job AND status IN ('hired', 'employment_ended')
    ),
    last_activity_at = now()
    WHERE id = target_job;
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ondwira_applications_refresh_job_count ON ondwira.applications;
CREATE TRIGGER ondwira_applications_refresh_job_count
AFTER INSERT OR UPDATE OR DELETE ON ondwira.applications
FOR EACH ROW EXECUTE FUNCTION ondwira.refresh_job_application_count();

CREATE INDEX IF NOT EXISTS ondwira_jobs_org_status_idx
    ON ondwira.jobs (organization_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS ondwira_jobs_discovery_idx
    ON ondwira.jobs (published_at DESC, id DESC)
    WHERE status = 'published' AND visibility IN ('public', 'link_only');
CREATE INDEX IF NOT EXISTS ondwira_jobs_closing_idx
    ON ondwira.jobs (closes_at)
    WHERE status = 'published' AND closes_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS ondwira_job_questions_job_idx
    ON ondwira.job_questions (job_id, position);
CREATE INDEX IF NOT EXISTS ondwira_job_collaborators_user_idx
    ON ondwira.job_collaborators (user_id, job_id)
    WHERE removed_at IS NULL;
CREATE INDEX IF NOT EXISTS ondwira_job_shares_job_idx
    ON ondwira.job_shares (job_id, created_at DESC)
    WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS ondwira_job_events_job_created_idx
    ON ondwira.job_events (job_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ondwira_job_events_org_created_idx
    ON ondwira.job_events (organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ondwira_applications_org_status_idx
    ON ondwira.applications (organization_id, status, submitted_at DESC);
CREATE INDEX IF NOT EXISTS ondwira_applications_job_status_idx
    ON ondwira.applications (job_id, status, submitted_at DESC);
CREATE INDEX IF NOT EXISTS ondwira_applications_applicant_idx
    ON ondwira.applications (applicant_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS ondwira_applications_assigned_idx
    ON ondwira.applications (assigned_to, stage_due_at)
    WHERE assigned_to IS NOT NULL AND status NOT IN ('rejected', 'withdrawn', 'employment_ended');
CREATE INDEX IF NOT EXISTS ondwira_application_answers_question_idx
    ON ondwira.application_answers (question_id, application_id);
CREATE INDEX IF NOT EXISTS ondwira_application_documents_document_idx
    ON ondwira.application_documents (document_id, application_id);
CREATE INDEX IF NOT EXISTS ondwira_application_stage_events_app_idx
    ON ondwira.application_stage_events (application_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ondwira_application_reviews_reviewer_idx
    ON ondwira.application_reviews (reviewer_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS ondwira_application_ai_app_idx
    ON ondwira.application_ai_evaluations (application_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ondwira_interviews_application_idx
    ON ondwira.recruitment_interviews (application_id, starts_at DESC);
CREATE INDEX IF NOT EXISTS ondwira_interviews_org_start_idx
    ON ondwira.recruitment_interviews (organization_id, starts_at)
    WHERE status NOT IN ('cancelled', 'completed');
CREATE INDEX IF NOT EXISTS ondwira_interviews_meeting_idx
    ON ondwira.recruitment_interviews (work_meeting_id)
    WHERE work_meeting_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ondwira_offers_application_idx
    ON ondwira.job_offers (application_id, version DESC);
CREATE INDEX IF NOT EXISTS ondwira_offers_org_status_idx
    ON ondwira.job_offers (organization_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS ondwira_employment_events_record_idx
    ON ondwira.employment_events (employment_record_id, effective_at DESC);
CREATE INDEX IF NOT EXISTS ondwira_employment_events_worker_idx
    ON ondwira.employment_events (worker_id, effective_at DESC);
CREATE INDEX IF NOT EXISTS ondwira_employment_verifications_record_idx
    ON ondwira.employment_verification_requests (employment_record_id, requested_at DESC);
CREATE INDEX IF NOT EXISTS ondwira_employment_verifications_target_idx
    ON ondwira.employment_verification_requests (target_organization_id, status, requested_at DESC)
    WHERE target_organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ondwira_work_meetings_conversation_idx
    ON ondwira.work_meetings (conversation_id)
    WHERE conversation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ondwira_work_meetings_group_idx
    ON ondwira.work_meetings (work_group_id)
    WHERE work_group_id IS NOT NULL;

ALTER TABLE ondwira.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ondwira.job_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ondwira.job_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE ondwira.job_screening_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ondwira.job_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE ondwira.job_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ondwira.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE ondwira.application_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ondwira.application_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ondwira.application_stage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ondwira.application_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE ondwira.application_ai_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ondwira.recruitment_interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE ondwira.interview_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE ondwira.job_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ondwira.employment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ondwira.employment_verification_requests ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE
    ondwira.jobs,
    ondwira.job_questions,
    ondwira.job_collaborators,
    ondwira.job_screening_profiles,
    ondwira.job_shares,
    ondwira.job_events,
    ondwira.applications,
    ondwira.application_answers,
    ondwira.application_documents,
    ondwira.application_stage_events,
    ondwira.application_reviews,
    ondwira.application_ai_evaluations,
    ondwira.recruitment_interviews,
    ondwira.interview_feedback,
    ondwira.job_offers,
    ondwira.employment_events,
    ondwira.employment_verification_requests
FROM anon, authenticated;

GRANT ALL ON TABLE
    ondwira.jobs,
    ondwira.job_questions,
    ondwira.job_collaborators,
    ondwira.job_screening_profiles,
    ondwira.job_shares,
    ondwira.job_events,
    ondwira.applications,
    ondwira.application_answers,
    ondwira.application_documents,
    ondwira.application_stage_events,
    ondwira.application_reviews,
    ondwira.application_ai_evaluations,
    ondwira.recruitment_interviews,
    ondwira.interview_feedback,
    ondwira.job_offers,
    ondwira.employment_events,
    ondwira.employment_verification_requests
TO service_role;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA ondwira TO service_role;

REVOKE ALL ON FUNCTION ondwira.touch_recruitment_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION ondwira.refresh_job_application_count() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION ondwira.touch_recruitment_updated_at() TO service_role;
GRANT EXECUTE ON FUNCTION ondwira.refresh_job_application_count() TO service_role;
