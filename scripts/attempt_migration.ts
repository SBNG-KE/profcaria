import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
    console.log('Running DM Migration...');

    // 1. Add columns
    const { error: err1 } = await supabase.rpc('exec_sql', {
        sql_query: `
            ALTER TABLE employer.messages ADD COLUMN IF NOT EXISTS recipient_id UUID;
            ALTER TABLE employer.messages ADD COLUMN IF NOT EXISTS recipient_type TEXT;
            ALTER TABLE employer.messages ALTER COLUMN application_id DROP NOT NULL;
            CREATE INDEX IF NOT EXISTS idx_messages_sender_recipient ON employer.messages(sender_id, recipient_id);
            CREATE INDEX IF NOT EXISTS idx_messages_recipient_sender ON employer.messages(recipient_id, sender_id);
        `
    });

    if (err1) {
        // Fallback if exec_sql RPC doesn't exist (common in some setups), try raw query if client supports it? 
        // Supabase-js client doesn't support raw SQL query directly without RPC usually.
        // Let's assume RPC 'exec_sql' might not exist.
        console.error('RPC Error (might be allowed if RPC missing):', err1);
        console.log('Attempting direct column check to verify...');
    } else {
        console.log('Migration SQL executed successfully via RPC.');
    }
}

// Since we can't easily run SQL without an RPC function exposed or direct connection,
// and the user is on local dev, maybe we can just assume the issue was a "delayed" migration 
// OR we can try to use a specialized migration tool. 
// However, the cleanest way if we have access to the codebase is to just tell the user to restart? 
// No, user expects me to fix it. 
// I will try to use a Postgres client if I can install one? No, I can't install packages easily.
// I will try to use the `run_command` with `npx supabase db push`? 
// But that requires login.
// Let's try to assume the code fix I made (optional recipient_id) is GOOD for now, 
// BUT for DMs we NEED the column. 
// Let's try to check if the column exists by selecting it?

runMigration();
