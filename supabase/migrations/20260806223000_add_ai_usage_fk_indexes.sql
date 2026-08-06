-- Cover AI usage foreign-key access paths used by deletion and audit queries.
create index if not exists ai_usage_application_idx
  on profcaria.ai_usage_events(application_id) where application_id is not null;
create index if not exists ai_usage_requested_by_idx
  on profcaria.ai_usage_events(requested_by) where requested_by is not null;
