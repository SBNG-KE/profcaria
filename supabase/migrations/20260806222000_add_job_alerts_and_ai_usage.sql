-- Tailored job alerts and auditable, provider-neutral AI metering.
-- Both surfaces are server-only because Profcaria uses its own encrypted session.

create table if not exists profcaria.job_alert_subscriptions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references profcaria.accounts(id) on delete cascade,
  label text not null default 'My job alert' check (char_length(label) between 1 and 80),
  query text not null default '' check (char_length(query) <= 160),
  role_categories text[] not null default '{}',
  location_types text[] not null default '{}',
  employment_types text[] not null default '{}',
  locations text[] not null default '{}',
  organization_ids uuid[] not null default '{}',
  frequency text not null default 'instant' check (frequency in ('instant', 'daily', 'weekly')),
  email_enabled boolean not null default true,
  enabled boolean not null default true,
  last_matched_at timestamptz,
  last_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists job_alerts_account_idx
  on profcaria.job_alert_subscriptions(account_id, enabled, created_at desc);
create index if not exists job_alerts_active_delivery_idx
  on profcaria.job_alert_subscriptions(frequency, coalesce(last_sent_at, created_at))
  where enabled and email_enabled;
create index if not exists job_alerts_categories_gin_idx
  on profcaria.job_alert_subscriptions using gin(role_categories);
create index if not exists job_alerts_organizations_gin_idx
  on profcaria.job_alert_subscriptions using gin(organization_ids);

create table if not exists profcaria.ai_usage_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references profcaria.organizations(id) on delete cascade,
  job_id uuid references profcaria.jobs(id) on delete set null,
  application_id uuid references profcaria.applications(id) on delete set null,
  requested_by uuid references profcaria.accounts(id) on delete set null,
  purpose text not null check (purpose in ('screening','job_copy','title_moderation','insight','candidate_message','document_extraction')),
  provider text not null check (char_length(provider) between 1 and 60),
  model text not null check (char_length(model) between 1 and 120),
  provider_request_id text,
  input_units bigint not null default 0 check (input_units >= 0),
  output_units bigint not null default 0 check (output_units >= 0),
  calculated_cost_kes numeric(14,4) not null default 0 check (calculated_cost_kes >= 0),
  billed_amount_kes numeric(14,4) not null default 0 check (billed_amount_kes >= 0),
  status text not null default 'completed' check (status in ('queued','completed','failed','refunded')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists ai_usage_org_created_idx
  on profcaria.ai_usage_events(organization_id, created_at desc);
create index if not exists ai_usage_job_created_idx
  on profcaria.ai_usage_events(job_id, created_at desc) where job_id is not null;
create unique index if not exists ai_usage_provider_request_idx
  on profcaria.ai_usage_events(provider, provider_request_id) where provider_request_id is not null;

alter table profcaria.job_screening_profiles
  add column if not exists automatic_disposition_mode text not null default 'none',
  add column if not exists send_automatic_rejection_email boolean not null default false,
  add column if not exists rejection_delay_minutes integer not null default 60,
  add column if not exists enc_rejection_template text;

alter table profcaria.job_screening_profiles
  drop constraint if exists job_screening_profiles_automatic_disposition_check;
alter table profcaria.job_screening_profiles
  add constraint job_screening_profiles_automatic_disposition_check
  check (automatic_disposition_mode in ('none', 'knockout_only'));
alter table profcaria.job_screening_profiles
  drop constraint if exists job_screening_profiles_rejection_delay_check;
alter table profcaria.job_screening_profiles
  add constraint job_screening_profiles_rejection_delay_check
  check (rejection_delay_minutes between 0 and 10080);

alter table profcaria.job_alert_subscriptions enable row level security;
alter table profcaria.ai_usage_events enable row level security;
revoke all on profcaria.job_alert_subscriptions, profcaria.ai_usage_events from anon, authenticated;
grant all on profcaria.job_alert_subscriptions, profcaria.ai_usage_events to service_role;

comment on table profcaria.ai_usage_events is
  'Auditable AI usage metadata. Prompts, applicant documents and model outputs must never be stored here.';
