
// scripts/debug_followers.ts
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseSecret = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseSecret) {
    console.error('Missing environment variables. Please check .env.local');
    process.exit(1);
}

import { decryptData } from '../lib/security';

const supabase = createClient(supabaseUrl, supabaseSecret, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function main() {
    // Dynamic import to ensure env vars are loaded
    const { decryptData } = await import('../lib/security');

    console.log('--- Debugging Follower Issue ---');

    // 1. Get the user (Steve) - we can search by email if known, or just list all users to find him
    // Assuming the user running this is the one with the issue.
    // If we don't know the user ID, we can search for the user who received the email.
    // The email screenshot shows "Bernard S" started following.
    // We should look for a user following "Steve" (or whoever the main user is).
    // Let's first list all users to identifying "Steve" and "Bernard S".

    console.log('\n--- Finding Users ---');
    const { data: users, error: usersError } = await supabase
        .schema('professional')
        .from('users')
        .select('id, enc_first_name, enc_last_name, enc_email');

    if (usersError) {
        console.error('Error fetching users:', usersError);
        return;
    }

    console.log(`Found ${users?.length} users.`);

    // Print User Map
    const userMap: Record<string, string> = {};
    users?.forEach(u => {
        try {
            const first = u.enc_first_name ? decryptData(u.enc_first_name) : '';
            const last = u.enc_last_name ? decryptData(u.enc_last_name) : '';
            const email = u.enc_email ? decryptData(u.enc_email) : '';
            const name = `${first} ${last} (${email})`;
            userMap[u.id] = name;
            console.log(`User ${u.id}: ${name}`);
        } catch (e) {
            console.log(`User ${u.id}: [Decryption Failed]`);
        }
    });

    // Helper to decrypt (mock since we don't have the key easily in script without more setup, 
    // OR we can just try to match partially if encryption is deterministic, which it likely isn't.
    // actually, let's just dump the IDs and raw statuses for now).
    // Wait, the encryption key is likely in env vars.
    // Let's try to load the encryption key too.

    // We can't easily decrypt without the specialized library logic, but we can check the relationships.
    // We can list all relationships in user_follows.

    console.log('\n--- Checking user_follows table ---');
    const { data: follows, error: followsError } = await supabase
        .schema('professional')
        .from('user_follows')
        .select('*');

    if (followsError) {
        console.error('Error fetching follows:', followsError);
        return;
    }


    // Check if the user ID exists in employer.companies
    // Assuming we want to check for '60f0f916-7b32-483f-afd6-681424a360bf' (Stephen) if we found him.
    // Or just list companies.

    console.log('\n--- Checking Companies ---');
    // Just check the specific ID that we suspect is Stephen
    const specificId = '60f0f916-7b32-483f-afd6-681424a360bf';
    const { data: company } = await supabase
        .schema('employer')
        .from('companies')
        .select('id, enc_company_name')
        .eq('id', specificId)
        .single();

    if (company) {
        console.log(`ID ${specificId} FOUND in employer.companies:`, company);
    } else {
        console.log(`ID ${specificId} NOT FOUND in employer.companies.`);
    }

    console.log(`Found ${follows?.length} follow records.`);


    // Let's see if we can identify the users by their ID if they are logged in the app.
    // But since this is a script, we see everything.

    // We want to find a record where:
    // follower_id = (Bernard S)
    // following_id = (Current User)

    // The user screenshot shows "Bernard S has started following your profile!".
    // If the user can provide their own ID (from the URL or local storage), that helps.
    // But we can guess the user is likely one of the few users in the DB since it's dev/test.

    // Let's try to match "Bernard" if we can decrypt.
    // Since we need to import `decryptData`, let's just dump the user table 
    // and I'll use my `decryptData` mock if I have the key, or just infer from context.

    // Actually, `lib/security.ts` uses `process.env.ENCRYPTION_KEY`.
    // I can read that file to see how it works.
    // But for now, let's just print the `user_follows` table. 
    // If it's empty, THAT is the problem.
    // If it has entries, we check if the referenced IDs exist in `professional.users`.

    console.log('\n--- Verifying Integrity ---');
    const outputLines = await Promise.all((follows || []).map(async f => {
        const followerName = userMap[f.follower_id] || 'UNKNOWN';
        const followingName = userMap[f.following_id] || 'UNKNOWN';

        return `Follow Record ${f.id}:
  - Follower: ${followerName} (${f.follower_id})
  - Following: ${followingName} (${f.following_id})`;
    }));

    const output = `
--- Debugging Follower Issue ---
Found ${users?.length} users.
Found ${follows?.length} follow records.

--- Verifying Integrity ---
${outputLines.join('\n')}
    `;

    console.log(output);
    const fs = require('fs');
    fs.writeFileSync('debug_output_utf8.txt', output, 'utf8');
}

main();
