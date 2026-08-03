-- Profcaria: focused Kenyan jobs platform foundation.
-- This migration deliberately renames the active application schema instead of
-- copying it so existing identifiers, conversations and recruitment history remain intact.

do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'ondwira')
     and not exists (select 1 from pg_namespace where nspname = 'profcaria') then
    alter schema ondwira rename to profcaria;
  end if;
end $$;

alter table profcaria.jobs
  add column if not exists country_code text not null default 'KE',
  add column if not exists currency text not null default 'KES',
  add column if not exists remote_kenya_only boolean not null default true,
  add column if not exists auto_close_at_limit boolean not null default true,
  add column if not exists document_limit integer not null default 1,
  add column if not exists charge_per_extra_applicant_kes numeric(12,4) not null default 0.26,
  add column if not exists ai_screening_mode text not null default 'off',
  add column if not exists ai_rank_percentage integer,
  add column if not exists security_scan_required boolean not null default true;

alter table profcaria.jobs drop constraint if exists jobs_country_code_check;
alter table profcaria.jobs add constraint jobs_country_code_check check (country_code = 'KE');
alter table profcaria.jobs drop constraint if exists jobs_currency_check;
alter table profcaria.jobs add constraint jobs_currency_check check (currency = 'KES');
alter table profcaria.jobs drop constraint if exists jobs_document_limit_check;
alter table profcaria.jobs add constraint jobs_document_limit_check check (document_limit between 0 and 20);
alter table profcaria.jobs drop constraint if exists jobs_ai_screening_mode_check;
alter table profcaria.jobs add constraint jobs_ai_screening_mode_check check (ai_screening_mode in ('off','rank_all','rank_percentage','qualified_only'));
alter table profcaria.jobs drop constraint if exists jobs_ai_rank_percentage_check;
alter table profcaria.jobs add constraint jobs_ai_rank_percentage_check check (ai_rank_percentage is null or ai_rank_percentage between 1 and 100);

create table if not exists profcaria.guest_applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references profcaria.jobs(id) on delete restrict,
  organization_id uuid not null references profcaria.organizations(id) on delete cascade,
  linked_account_id uuid references profcaria.accounts(id) on delete set null,
  email_hash text not null,
  enc_contact text not null,
  enc_answers text not null,
  enc_cover_note text,
  enc_portfolio_url text,
  document_path text,
  enc_document_name text,
  document_scan jsonb not null default '{}'::jsonb,
  security_status text not null default 'pending' check (security_status in ('pending','passed','blocked','not_required','manual_review')),
  status text not null default 'submitted' check (status in ('submitted','screening','needs_review','on_hold','shortlisted','interview','offer','hired','rejected','withdrawn')),
  claim_token_hash text,
  consent_version text not null default '2026-08',
  consented_at timestamptz not null default now(),
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(job_id, email_hash)
);

create index if not exists guest_applications_job_status_idx on profcaria.guest_applications(job_id, status, submitted_at desc);
create index if not exists guest_applications_org_idx on profcaria.guest_applications(organization_id, submitted_at desc);
create index if not exists jobs_public_ke_idx on profcaria.jobs(published_at desc)
  where status = 'published' and visibility = 'public' and country_code = 'KE';

create table if not exists profcaria.organization_wallets (
  organization_id uuid primary key references profcaria.organizations(id) on delete cascade,
  balance_kes numeric(14,4) not null default 0 check (balance_kes >= 0),
  reserved_kes numeric(14,4) not null default 0 check (reserved_kes >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists profcaria.usage_ledger (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references profcaria.organizations(id) on delete cascade,
  job_id uuid references profcaria.jobs(id) on delete set null,
  kind text not null check (kind in ('wallet_topup','applicant_capacity','document_capacity','ai_screening','security_scan','refund','adjustment')),
  quantity numeric(14,4) not null default 1,
  amount_kes numeric(14,4) not null,
  provider_reference text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists usage_ledger_org_created_idx on profcaria.usage_ledger(organization_id, created_at desc);

create table if not exists profcaria.safety_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_account_id uuid references profcaria.accounts(id) on delete set null,
  reporter_email_hash text,
  target_type text not null check (target_type in ('account','company','job','message','document')),
  target_id uuid not null,
  reason text not null check (reason in ('fraud','harassment','discrimination','illegal_content','impersonation','malware','stale_job','other')),
  enc_details text,
  status text not null default 'open' check (status in ('open','reviewing','actioned','dismissed')),
  assigned_admin_id uuid references profcaria.accounts(id) on delete set null,
  action_taken text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index if not exists safety_reports_queue_idx on profcaria.safety_reports(status, created_at);

alter table profcaria.message_attachments
  add column if not exists scan_status text not null default 'pending',
  add column if not exists scan_provider text,
  add column if not exists scan_report jsonb not null default '{}'::jsonb,
  add column if not exists scanned_at timestamptz,
  add column if not exists released_at timestamptz;
alter table profcaria.message_attachments drop constraint if exists message_attachments_scan_status_check;
alter table profcaria.message_attachments add constraint message_attachments_scan_status_check check (scan_status in ('pending','passed','blocked','manual_review'));

create or replace function profcaria.enforce_safe_job_chat()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.message_type not in ('text','file','system') then
    raise exception 'Profcaria job chat accepts only text, links in text, and inspected documents.';
  end if;
  return new;
end;
$$;
drop trigger if exists enforce_safe_job_chat_trigger on profcaria.messages;
create trigger enforce_safe_job_chat_trigger before insert or update of message_type on profcaria.messages
for each row execute function profcaria.enforce_safe_job_chat();

create or replace function profcaria.enforce_scanned_attachment_release()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.attachment_type <> 'document' then
    raise exception 'Only document attachments are allowed in Profcaria chat.';
  end if;
  if new.scan_status <> 'passed' and new.released_at is not null then
    raise exception 'Documents cannot be released before security inspection passes.';
  end if;
  return new;
end;
$$;
drop trigger if exists enforce_scanned_attachment_release_trigger on profcaria.message_attachments;
create trigger enforce_scanned_attachment_release_trigger before insert or update on profcaria.message_attachments
for each row execute function profcaria.enforce_scanned_attachment_release();

create or replace function profcaria.recount_and_close_job()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  target_job uuid;
  total_count integer;
begin
  target_job := case when tg_op = 'DELETE' then old.job_id else new.job_id end;
  select (select count(*) from profcaria.applications a where a.job_id = target_job and a.status <> 'withdrawn')
       + (select count(*) from profcaria.guest_applications g where g.job_id = target_job and g.status <> 'withdrawn')
    into total_count;
  update profcaria.jobs
     set application_count = total_count,
         status = case when auto_close_at_limit and application_limit is not null and total_count >= application_limit then 'closed' else status end,
         closed_at = case when auto_close_at_limit and application_limit is not null and total_count >= application_limit then coalesce(closed_at, now()) else closed_at end,
         updated_at = now()
   where id = target_job;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;
drop trigger if exists recount_job_from_guest_applications on profcaria.guest_applications;
create trigger recount_job_from_guest_applications after insert or update of status or delete on profcaria.guest_applications
for each row execute function profcaria.recount_and_close_job();
drop trigger if exists recount_job_from_applications on profcaria.applications;
create trigger recount_job_from_applications after insert or update of status or delete on profcaria.applications
for each row execute function profcaria.recount_and_close_job();

alter table profcaria.guest_applications enable row level security;
alter table profcaria.organization_wallets enable row level security;
alter table profcaria.usage_ledger enable row level security;
alter table profcaria.safety_reports enable row level security;

revoke all on profcaria.guest_applications, profcaria.organization_wallets, profcaria.usage_ledger, profcaria.safety_reports from anon, authenticated;
grant usage on schema profcaria to service_role;
grant all on profcaria.guest_applications, profcaria.organization_wallets, profcaria.usage_ledger, profcaria.safety_reports to service_role;

-- Private bucket. Application and chat routes use the server-side secret only;
-- candidates and companies never receive a bucket-wide public URL.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profcaria-documents', 'profcaria-documents', false, 8388608,
  array['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','text/plain'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
