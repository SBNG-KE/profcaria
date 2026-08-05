-- Repair deployed databases where PostgREST retained the pre-rename schema
-- list. If any listed schema does not exist, PostgREST cannot build its schema
-- cache and every Data API query fails.
alter role authenticator set pgrst.db_schemas = 'public, professional, employer, profcaria';

notify pgrst, 'reload config';
notify pgrst, 'reload schema';
