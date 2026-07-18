-- Allow an organisation to invite an existing canonical Ondwira account by
-- unique username without exposing that account's email address to the client.

alter table ondwira.organization_invitations
  add column if not exists invitee_account_id uuid
    references ondwira.accounts(id) on delete cascade;

create unique index if not exists organization_invitations_pending_account_idx
  on ondwira.organization_invitations (organization_id, invitee_account_id)
  where status = 'pending' and invitee_account_id is not null;

create index if not exists organization_invitations_invitee_status_idx
  on ondwira.organization_invitations (invitee_account_id, status, created_at desc)
  where invitee_account_id is not null;

comment on column ondwira.organization_invitations.invitee_account_id is
  'Canonical account invited through an exact Ondwira username lookup.';

alter table ondwira.organization_invitations enable row level security;
revoke all on table ondwira.organization_invitations from anon, authenticated;
