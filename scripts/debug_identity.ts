
// scripts/debug_identity.ts
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseSecret = process.env.SUPABASE_SECRET_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseSecret, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function main() {
    // Dynamic import for security
    const { hashForIndex, decryptData } = await import('../lib/security');

    console.log('--- Debugging Identity Resolution ---');

    const targetEmail = 'sgakungo@gmail.com';
    console.log(`Target Email: ${targetEmail}`);

    const generatedIndex = hashForIndex(targetEmail);
    console.log(`Generated Hash: ${generatedIndex}`);

    // Query by Exact Hash
    const { data: userByHash, error: hashError } = await supabaseAdmin
        .schema('professional')
        .from('users')
        .select('id, email_index, enc_email')
        .eq('email_index', generatedIndex)
        .maybeSingle();

    if (userByHash) {
        console.log('SUCCESS: Found user by hash!');
        console.log('ID:', userByHash.id);
    } else {
        console.log('FAILURE: Could not find user by generated hash.');
        console.log('DB Error (if any):', hashError);
    }

    console.log('\n--- Cross-Check: Scan all users ---');
    // If hash failed, let's find the user manually and see what their hash IS
    const { data: allUsers } = await supabaseAdmin
        .schema('professional')
        .from('users')
        .select('id, email_index, enc_email');

    if (allUsers) {
        let found = false;
        for (const u of allUsers) {
            const decEmail = decryptData(u.enc_email);
            if (decEmail === targetEmail) {
                console.log('MATCH FOUND via Decryption!');
                console.log('User ID:', u.id);
                console.log('Stored Index:', u.email_index);
                console.log('Gen    Index:', generatedIndex);
                console.log('Match?', u.email_index === generatedIndex);
                found = true;
                break;
            }
        }
        if (!found) console.log('User not found via decryption scan either.');
    }
}

main();
