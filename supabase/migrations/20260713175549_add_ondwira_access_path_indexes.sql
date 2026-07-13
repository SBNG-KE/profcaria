-- Index the membership and ownership paths used by server authorization checks.
CREATE INDEX IF NOT EXISTS ondwira_org_members_user_status_idx
    ON ondwira.organization_members (user_id, status, organization_id);
CREATE INDEX IF NOT EXISTS ondwira_work_groups_org_active_idx
    ON ondwira.work_groups (organization_id, created_at) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS ondwira_work_group_members_user_active_idx
    ON ondwira.work_group_members (user_id, group_id) WHERE removed_at IS NULL;
CREATE INDEX IF NOT EXISTS ondwira_contracts_worker_created_idx
    ON ondwira.contracts (worker_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ondwira_contracts_org_created_idx
    ON ondwira.contracts (organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ondwira_contract_signatures_signer_idx
    ON ondwira.contract_signatures (signer_id, signed_at DESC);
CREATE INDEX IF NOT EXISTS ondwira_update_audience_user_idx
    ON ondwira.social_update_audience (user_id, update_id);
CREATE INDEX IF NOT EXISTS ondwira_signatures_owner_active_idx
    ON ondwira.signatures (owner_id, created_at DESC) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS ondwira_messages_reply_idx
    ON ondwira.messages (reply_to_id) WHERE reply_to_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ondwira_org_invites_inviter_idx
    ON ondwira.organization_invitations (invited_by, created_at DESC);
CREATE INDEX IF NOT EXISTS ondwira_org_invites_acceptor_idx
    ON ondwira.organization_invitations (accepted_by) WHERE accepted_by IS NOT NULL;
