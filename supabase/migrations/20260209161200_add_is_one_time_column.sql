-- Add is_one_time column to employer subscriptions
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'employer' AND table_name = 'subscriptions' AND column_name = 'is_one_time') THEN
        ALTER TABLE employer.subscriptions ADD COLUMN is_one_time BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Add is_one_time column to professional subscriptions
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'professional' AND table_name = 'subscriptions' AND column_name = 'is_one_time') THEN
        ALTER TABLE professional.subscriptions ADD COLUMN is_one_time BOOLEAN DEFAULT FALSE;
    END IF;
END $$;
