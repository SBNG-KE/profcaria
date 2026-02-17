
// scripts/debug_company_ids_file.ts
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

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

    const results: any = {};

    const { data: cA } = await supabaseAdmin.schema('employer').from('companies').select('*').eq('id', idA).single();
    const { data: cB } = await supabaseAdmin.schema('employer').from('companies').select('*').eq('id', idB).single();

    if (cA) {
        results.companyA = {
            id: idA,
            found: true,
            name: decryptData(cA.enc_company_name),
            emailIndex: cA.work_email_index
        };
    } else {
        results.companyA = { id: idA, found: false };
    }

    if (cB) {
        results.companyB = {
            id: idB,
            found: true,
            name: decryptData(cB.enc_company_name),
            emailIndex: cB.work_email_index
        };
    } else {
        results.companyB = { id: idB, found: false };
    }

    // Check professional user for idA
    const { data: pA } = await supabaseAdmin.schema('professional').from('users').select('*').eq('id', idA).single();
    if (pA) {
        results.profUserA = {
            id: idA,
            found: true,
            firstName: decryptData(pA.enc_first_name),
            emailIndex: pA.email_index,
            dbId: pA.id
        };
    }

    fs.writeFileSync('debug_ids_out.json', JSON.stringify(results, null, 2));
    console.log('Done writing debug_ids_out.json');
}

main();
