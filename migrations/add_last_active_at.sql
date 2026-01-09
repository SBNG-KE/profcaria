-- Add last_active_at to professional.users
ALTER TABLE professional.users
ADD COLUMN IF NOT EXISTS last_active_at timestamptz;

-- Add last_active_at to employer.companies
ALTER TABLE employer.companies
ADD COLUMN IF NOT EXISTS last_active_at timestamptz;

-- Optional: Index for performance if checking activity often across many users
CREATE INDEX IF NOT EXISTS idx_prof_users_last_active ON professional.users(last_active_at);
CREATE INDEX IF NOT EXISTS idx_emp_companies_last_active ON employer.companies(last_active_at);
