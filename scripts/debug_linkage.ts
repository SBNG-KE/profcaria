
// scripts/debug_linkage.ts
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseSecret = process.env.SUPABASE_SECRET_KEY!;

// Use Admin client to bypass RLS
const supabaseAdmin = createClient(supabaseUrl, supabaseSecret, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function main() {
    const userId = '60f0f916-7b32-483f-afd6-681424a360bf';
    const companyId = '40e5c47c-4437-4a55-8c3d-4a4cec5a288b';

    console.log('--- Debugging Linkage ---');
    console.log(`User ID: ${userId}`);
    console.log(`Comp ID: ${companyId}`);

    // 1. Check if Company ID is in User ID token by simulating getAuthenticatedUser behavior?
    // (Skipping token check, data linkage is more reliable)

    // 2. Search for link in employer schema tables
    const tables = ['company_users', 'users', 'members', 'employees', 'organization_members'];

    console.log('\n--- Checking Employer Tables ---');
    for (const t of tables) {
        const { data, error } = await supabaseAdmin.schema('employer').from(t).select('*').limit(5);
        if (error) {
            console.log(`Table employer.${t}: Error - ${error.message}`);
        } else {
            console.log(`Table employer.${t}: Found ${data.length} rows`);
            if (data.length > 0) {
                console.log('Sample:', data[0]);
                // Check if our IDs are in there
                const match = data.find((row: any) =>
                    Object.values(row).includes(userId) ||
                    Object.values(row).includes(companyId)
                );
                if (match) console.log('>>> MATCH FOUND in', t, match);
            }
        }
    }

    // 3. Check public schema for users/profiles
    console.log('\n--- Checking Public Tables ---');
    const { data: publicUsers, error: pubError } = await supabaseAdmin.from('users').select('*').eq('id', userId);
    if (publicUsers) console.log('Public User (auth?):', publicUsers[0]); // auth.users is not queryable directly by client usually

    // 4. Check Email Linkage
    // We suspect email_index might be the key?
    // employer.companies has work_email_index.
    // professional.users has email_index.

    const { data: userRecord } = await supabaseAdmin.schema('professional').from('users').select('email_index').eq('id', userId).single();
    const { data: compRecord } = await supabaseAdmin.schema('employer').from('companies').select('work_email_index').eq('id', companyId).single();

    if (userRecord && compRecord) {
        console.log('\n--- Checking Email Index Match ---');
        console.log('User  Email Index:', userRecord.email_index);
        console.log('Comp Work Email Index:', compRecord.work_email_index);
        if (userRecord.email_index === compRecord.work_email_index) {
            console.log('>>> MATCH! Link is via Email Index.');
        } else {
            console.log('>>> NO MATCH on Email Index.');
        }
    }

}

main();
