-- Add previous_contract_url to contracts table if not exists (checking first)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'previous_contract_url') THEN
        ALTER TABLE contracts ADD COLUMN previous_contract_url TEXT;
    END IF;
END $$;
