-- Profcaria Paystack wallet bridge.
-- Applied after the focused jobs-platform migration that creates the profcaria schema.

create table if not exists profcaria.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references profcaria.organizations(id) on delete restrict,
  initiated_by uuid not null,
  provider text not null default 'paystack' check (provider = 'paystack'),
  purpose text not null default 'wallet_topup' check (purpose = 'wallet_topup'),
  reference text not null unique,
  status text not null default 'initialized' check (status in ('initialized','processing','success','failed','abandoned','reversed','refunded','disputed','review')),
  amount_kes numeric(14,2) not null check (amount_kes >= 100 and amount_kes <= 1000000),
  amount_subunit bigint not null check (amount_subunit >= 10000 and amount_subunit <= 100000000),
  currency text not null default 'KES' check (currency = 'KES'),
  payer_email_hash text not null,
  provider_transaction_id bigint,
  channel text,
  paid_at timestamptz,
  verified_at timestamptz,
  provider_summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payment_transactions_org_created_idx
  on profcaria.payment_transactions(organization_id, created_at desc);
create index if not exists payment_transactions_pending_idx
  on profcaria.payment_transactions(created_at)
  where status in ('initialized','processing');
create unique index if not exists usage_ledger_wallet_topup_reference_idx
  on profcaria.usage_ledger(provider_reference)
  where kind = 'wallet_topup' and provider_reference is not null;

alter table profcaria.payment_transactions enable row level security;
revoke all on profcaria.payment_transactions from anon, authenticated;
grant all on profcaria.payment_transactions to service_role;

create or replace function profcaria.finalize_paystack_wallet_topup(
  p_reference text,
  p_provider_transaction_id bigint,
  p_amount_subunit bigint,
  p_currency text,
  p_channel text,
  p_paid_at timestamptz,
  p_provider_summary jsonb default '{}'::jsonb
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_organization_id uuid;
  v_amount_kes numeric(14,2);
begin
  update profcaria.payment_transactions
     set status = 'success',
         provider_transaction_id = p_provider_transaction_id,
         channel = nullif(left(p_channel, 80), ''),
         paid_at = p_paid_at,
         verified_at = now(),
         provider_summary = coalesce(p_provider_summary, '{}'::jsonb),
         updated_at = now()
   where reference = p_reference
     and provider = 'paystack'
     and purpose = 'wallet_topup'
     and status in ('initialized','processing')
     and amount_subunit = p_amount_subunit
     and currency = p_currency
  returning organization_id, amount_kes into v_organization_id, v_amount_kes;

  if not found then
    if exists (
      select 1 from profcaria.payment_transactions
       where reference = p_reference
         and status = 'success'
         and amount_subunit = p_amount_subunit
         and currency = p_currency
    ) then
      return false;
    end if;
    raise exception 'Payment reference, amount, currency, or state did not match.';
  end if;

  insert into profcaria.organization_wallets(organization_id, balance_kes, reserved_kes, updated_at)
  values (v_organization_id, v_amount_kes, 0, now())
  on conflict (organization_id) do update
     set balance_kes = profcaria.organization_wallets.balance_kes + excluded.balance_kes,
         updated_at = now();

  insert into profcaria.usage_ledger(organization_id, kind, quantity, amount_kes, provider_reference, metadata)
  values (
    v_organization_id,
    'wallet_topup',
    1,
    v_amount_kes,
    p_reference,
    jsonb_build_object('provider', 'paystack', 'channel', nullif(left(p_channel, 80), ''))
  );

  return true;
end;
$$;

revoke all on function profcaria.finalize_paystack_wallet_topup(text,bigint,bigint,text,text,timestamptz,jsonb) from public, anon, authenticated;
grant execute on function profcaria.finalize_paystack_wallet_topup(text,bigint,bigint,text,text,timestamptz,jsonb) to service_role;
