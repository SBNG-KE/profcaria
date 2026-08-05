-- Authentication is based on email/OAuth identity, not a public handle. Keep a
-- stable internal username for URLs and exact invitations without making the
-- person choose one during signup.
create or replace function profcaria.prepare_account_username()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.username is null or btrim(new.username) = '' then
    new.username := 'profcaria_' || substr(replace(new.id::text, '-', ''), 1, 12);
  else
    new.username := lower(btrim(new.username));
  end if;
  return new;
end;
$$;

update profcaria.accounts
set username = 'profcaria_' || substr(replace(id::text, '-', ''), 1, 12),
    username_updated_at = null,
    updated_at = now()
where username ~ '^ondwira_[0-9a-f]{12}$';

revoke execute on function profcaria.prepare_account_username() from public, anon, authenticated;

comment on column profcaria.accounts.username is
  'Stable handle generated at signup. A member may optionally choose a memorable handle later for profile links and exact invitations.';
