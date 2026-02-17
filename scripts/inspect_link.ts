
// scripts/inspect_link.ts
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
    const userId = '60f0f916-7b32-483f-afd6-681424a360bf';
    const companyId = '40e5c47c-4437-4a55-8c3d-4a4cec5a288b';

    console.log('--- Inspecting Company Record ---');
    const { data: comp } = await supabaseAdmin.schema('employer').from('companies').select('*').eq('id', companyId).single();
    if (comp) {
        console.log('Company Columns:', Object.keys(comp));
        console.log('Data:', JSON.stringify(comp, null, 2));
    } else {
        console.log('Company not found');
    }

    console.log('\n--- Inspecting Company Users ---');
    const { data: links } = await supabaseAdmin.schema('employer').from('company_users').select('*');
    console.log('Links found:', links?.length);
    if (links && links.length > 0) {
        console.log('Sample Link:', JSON.stringify(links[0], null, 2));
        const myLink = links.find((l: any) => l.company_id === companyId || l.user_id === userId);
        if (myLink) console.log('MATCHING LINK:', myLink);
        else console.log('No link found for these IDs in company_users');
    }
}

main();
