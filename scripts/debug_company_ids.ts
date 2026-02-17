
// scripts/debug_company_ids.ts
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false } }
);

async function main() {
    const idA = '60f0f916-7b32-483f-afd6-681424a360bf'; // Session ID
    const idB = '40e5c47c-4437-4a55-8c3d-4a4cec5a288b'; // Followed ID

    // Dynamic import for security
    const { decryptData } = await import('../lib/security');

    console.log('--- Checking Company Records ---');

    const { data: cA } = await supabaseAdmin.schema('employer').from('companies').select('*').eq('id', idA).single();
    const { data: cB } = await supabaseAdmin.schema('employer').from('companies').select('*').eq('id', idB).single();

    if (cA) {
        console.log(`\nCompany A (${idA}): FOUND`);
        console.log(`Name: ${decryptData(cA.enc_company_name)}`);
        console.log(`EmailIndex: ${cA.work_email_index}`);
    } else {
        console.log(`\nCompany A (${idA}): NOT FOUND`);
    }

    if (cB) {
        console.log(`\nCompany B (${idB}): FOUND`);
        console.log(`Name: ${decryptData(cB.enc_company_name)}`);
        console.log(`EmailIndex: ${cB.work_email_index}`);
    } else {
        console.log(`\nCompany B (${idB}): NOT FOUND`);
    }

    // Check professional user for idA
    const { data: pA } = await supabaseAdmin.schema('professional').from('users').select('*').eq('id', idA).single();
    if (pA) {
        console.log(`\nProfessional User A (${idA}): FOUND`);
        console.log(`Name: ${decryptData(pA.enc_first_name)}`);
        console.log(`EmailIndex: ${pA.email_index}`);
    }

}

main();
