-- Canonical Ondwira discovery identity.
-- Usernames are public discovery handles. Phone data stays encrypted and is
-- never exposed through direct client grants.

alter table ondwira.accounts
  add column if not exists username text,
  add column if not exists phone_index text,
  add column if not exists enc_phone_number text,
  add column if not exists phone_verified_at timestamptz,
  add column if not exists username_updated_at timestamptz;

create or replace function ondwira.prepare_account_username()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.username is null or btrim(new.username) = '' then
    new.username := 'ondwira_' || substr(replace(new.id::text, '-', ''), 1, 12);
  else
    new.username := lower(btrim(new.username));
  end if;
  return new;
end;
$$;

drop trigger if exists prepare_account_username on ondwira.accounts;
create trigger prepare_account_username
before insert or update of username on ondwira.accounts
for each row execute function ondwira.prepare_account_username();

-- Existing accounts receive a deterministic private-safe handle. Owners can
-- replace it from Settings; no public legacy slug is claimed silently.
update ondwira.accounts
set username = 'ondwira_' || substr(replace(id::text, '-', ''), 1, 12)
where username is null or btrim(username) = '';

-- Copy a legacy phone only when every occurrence belongs to the same canonical
-- account. This deliberately leaves cross-account duplicates unattached.
with phone_candidates as (
  select ai.account_id, u.phone_index, u.enc_phone_number
  from ondwira.account_identities ai
  join professional.users u
    on ai.identity_type = 'professional' and ai.identity_id = u.id
  where u.phone_index is not null
  union all
  select ai.account_id, c.phone_index, c.enc_phone_number
  from ondwira.account_identities ai
  join employer.companies c
    on ai.identity_type = 'employer' and ai.identity_id = c.id
  where c.phone_index is not null
), unambiguous_phones as (
  select
    phone_index,
    min(account_id::text)::uuid as account_id,
    min(enc_phone_number) filter (where enc_phone_number is not null) as enc_phone_number
  from phone_candidates
  group by phone_index
  having count(distinct account_id) = 1
)
update ondwira.accounts a
set phone_index = p.phone_index,
    enc_phone_number = p.enc_phone_number
from unambiguous_phones p
where a.id = p.account_id and a.phone_index is null;

alter table ondwira.accounts
  alter column username set not null;

alter table ondwira.accounts
  drop constraint if exists accounts_username_format_check,
  add constraint accounts_username_format_check
    check (username ~ '^[a-z0-9][a-z0-9_]{1,28}[a-z0-9]$'),
  drop constraint if exists accounts_username_reserved_check,
  add constraint accounts_username_reserved_check
    check (username <> all (array[
      'admin', 'administrator', 'api', 'auth', 'help', 'login', 'logout',
      'ondwira', 'official', 'privacy', 'root', 'security', 'settings',
      'signup', 'social', 'support', 'system', 'terms', 'work'
    ]::text[]));

create unique index if not exists accounts_username_unique_idx
  on ondwira.accounts (username);
create index if not exists accounts_username_prefix_idx
  on ondwira.accounts (username text_pattern_ops)
  where status = 'active';
create unique index if not exists accounts_phone_index_unique_idx
  on ondwira.accounts (phone_index)
  where phone_index is not null;

comment on column ondwira.accounts.username is
  'Globally unique, public Ondwira discovery handle. Stored lowercase.';
comment on column ondwira.accounts.phone_index is
  'Server-only blind index for an optional private phone number.';
comment on column ondwira.accounts.enc_phone_number is
  'Server-only encrypted optional phone number.';
comment on column ondwira.accounts.phone_verified_at is
  'Set only after the current encrypted phone number is verified.';

alter table ondwira.accounts enable row level security;
revoke all on table ondwira.accounts from anon, authenticated;
revoke execute on function ondwira.prepare_account_username() from public, anon, authenticated;
