-- Add is_available_for_hire to professional.users
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'professional' AND table_name = 'users' AND column_name = 'is_available_for_hire') THEN
        ALTER TABLE professional.users ADD COLUMN is_available_for_hire BOOLEAN DEFAULT TRUE;
    END IF;
END $$;
