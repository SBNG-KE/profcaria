-- Index every recruitment lifecycle foreign key used for actor, evidence,
-- organisation, share, meeting and contract lookups. Some nearby partial
-- indexes serve product filters but do not cover FK maintenance in all rows.

CREATE INDEX IF NOT EXISTS ondwira_application_stage_events_actor_idx
    ON ondwira.application_stage_events (actor_id);

CREATE INDEX IF NOT EXISTS ondwira_applications_assigned_all_idx
    ON ondwira.applications (assigned_to);
CREATE INDEX IF NOT EXISTS ondwira_applications_referred_by_idx
    ON ondwira.applications (referred_by);
CREATE INDEX IF NOT EXISTS ondwira_applications_share_idx
    ON ondwira.applications (share_id);

CREATE INDEX IF NOT EXISTS ondwira_employment_events_actor_idx
    ON ondwira.employment_events (actor_id);
CREATE INDEX IF NOT EXISTS ondwira_employment_events_org_idx
    ON ondwira.employment_events (organization_id);

CREATE INDEX IF NOT EXISTS ondwira_employment_records_evidence_idx
    ON ondwira.employment_records (evidence_document_id);
CREATE INDEX IF NOT EXISTS ondwira_employment_records_verified_by_idx
    ON ondwira.employment_records (verified_by);

CREATE INDEX IF NOT EXISTS ondwira_employment_verifications_evidence_idx
    ON ondwira.employment_verification_requests (evidence_document_id);
CREATE INDEX IF NOT EXISTS ondwira_employment_verifications_requested_by_idx
    ON ondwira.employment_verification_requests (requested_by);
CREATE INDEX IF NOT EXISTS ondwira_employment_verifications_responded_by_idx
    ON ondwira.employment_verification_requests (responded_by);
CREATE INDEX IF NOT EXISTS ondwira_employment_verifications_target_org_all_idx
    ON ondwira.employment_verification_requests (target_organization_id);

CREATE INDEX IF NOT EXISTS ondwira_interview_feedback_reviewer_idx
    ON ondwira.interview_feedback (reviewer_id);

CREATE INDEX IF NOT EXISTS ondwira_job_collaborators_added_by_idx
    ON ondwira.job_collaborators (added_by);
CREATE INDEX IF NOT EXISTS ondwira_job_collaborators_user_all_idx
    ON ondwira.job_collaborators (user_id);

CREATE INDEX IF NOT EXISTS ondwira_job_events_actor_idx
    ON ondwira.job_events (actor_id);
CREATE INDEX IF NOT EXISTS ondwira_job_events_share_idx
    ON ondwira.job_events (share_id);
CREATE INDEX IF NOT EXISTS ondwira_job_events_application_idx
    ON ondwira.job_events (application_id);

CREATE INDEX IF NOT EXISTS ondwira_job_offers_contract_idx
    ON ondwira.job_offers (contract_id);
CREATE INDEX IF NOT EXISTS ondwira_job_offers_sent_by_idx
    ON ondwira.job_offers (sent_by);

CREATE INDEX IF NOT EXISTS ondwira_job_screening_configured_by_idx
    ON ondwira.job_screening_profiles (configured_by);

CREATE INDEX IF NOT EXISTS ondwira_job_shares_created_by_idx
    ON ondwira.job_shares (created_by);
CREATE INDEX IF NOT EXISTS ondwira_job_shares_job_all_idx
    ON ondwira.job_shares (job_id);
CREATE INDEX IF NOT EXISTS ondwira_job_shares_referrer_idx
    ON ondwira.job_shares (referrer_id);

CREATE INDEX IF NOT EXISTS ondwira_jobs_created_by_idx
    ON ondwira.jobs (created_by);

CREATE INDEX IF NOT EXISTS ondwira_recruitment_interviews_org_idx
    ON ondwira.recruitment_interviews (organization_id);
CREATE INDEX IF NOT EXISTS ondwira_recruitment_interviews_scheduled_by_idx
    ON ondwira.recruitment_interviews (scheduled_by);
CREATE INDEX IF NOT EXISTS ondwira_recruitment_interviews_meeting_all_idx
    ON ondwira.recruitment_interviews (work_meeting_id);
