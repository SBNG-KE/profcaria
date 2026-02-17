
// scripts/debug_concise.ts
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

    console.log('start_debug');

    // 1. Inspect Company Keys
    const { data: comp } = await supabaseAdmin.schema('employer').from('companies').select('*').eq('id', companyId).single();
    if (comp) {
        console.log('Company Keys:', Object.keys(comp).join(', '));
        // Check for potential ID fields
        const idFields = Object.keys(comp).filter(k => k.includes('id') || k.includes('user') || k.includes('owner'));
        console.log('Company ID Fields:', idFields.map(k => `${k}:${comp[k]}`).join(', '));
    } else {
        console.log('Company not found');
    }

    // 2. Check Junction Table
    const { data: links, error } = await supabaseAdmin.schema('employer').from('company_users').select('*');
    if (error) console.log('company_users error:', error.message);
    else {
        console.log('company_users count:', links.length);
        if (links.length > 0) console.log('Sample Link:', JSON.stringify(links[0]));

        // Find specific link
        const myLink = links.find((l: any) => l.company_id === companyId || l.user_id === userId);
        if (myLink) console.log('MY LINK FOUND:', JSON.stringify(myLink));
    }

    // 3. Check public.users (auth)
    // We can't query auth.users easily via client, but we can check if professional.user has oauth_id or something.
    const { data: prof } = await supabaseAdmin.schema('professional').from('users').select('*').eq('id', userId).single();
    if (prof) {
        console.log('Prof User Keys:', Object.keys(prof).filter(k => k.includes('id')).join(', '));
    }

    console.log('end_debug');
}

main();
