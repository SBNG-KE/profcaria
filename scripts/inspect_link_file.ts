
// scripts/inspect_link_file.ts
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
    const userId = '60f0f916-7b32-483f-afd6-681424a360bf';
    const companyId = '40e5c47c-4437-4a55-8c3d-4a4cec5a288b';
    const output: any = {};

    console.log('--- Inspecting ---');

    // Check Company
    const { data: comp } = await supabaseAdmin.schema('employer').from('companies').select('*').eq('id', companyId).single();
    if (comp) {
        output.company = {
            id: comp.id,
            keys: Object.keys(comp),
            // Look for owner_id or created_by
            owner_id: comp.owner_id || comp.user_id || comp.created_by,
            email_index: comp.work_email_index
        };
    } else {
        output.company = 'Not Found';
    }

    // Check Company Users
    const { data: links, error } = await supabaseAdmin.schema('employer').from('company_users').select('*');
    if (error) output.company_users_error = error.message;
    else {
        output.company_users_count = links.length;
        output.sample_link = links[0];
        output.my_link = links.find((l: any) => l.company_id === companyId || l.user_id === userId);
    }

    fs.writeFileSync('link_inspection.json', JSON.stringify(output, null, 2));
    console.log('Done.');
}

main();
