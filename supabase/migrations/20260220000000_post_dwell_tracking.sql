-- Add views and dwell columns to posts for analytics tracking
ALTER TABLE professional.posts ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;
ALTER TABLE professional.posts ADD COLUMN IF NOT EXISTS dwell INTEGER DEFAULT 0;

ALTER TABLE employer.posts ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;
ALTER TABLE employer.posts ADD COLUMN IF NOT EXISTS dwell INTEGER DEFAULT 0;

-- Optional: Create an index to speed up sorts if we eventually sort by views (algorithm already doesn't sort by these directly but useful future-proofing)
CREATE INDEX IF NOT EXISTS idx_professional_posts_views ON professional.posts(views);
CREATE INDEX IF NOT EXISTS idx_employer_posts_views ON employer.posts(views);
