
// scripts/check_link_final.ts
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

    console.log('--- Checking OAuth Link ---');

    const { data: user } = await supabaseAdmin.schema('professional').from('users').select('oauth_provider_id').eq('id', userId).single();
    const { data: comp } = await supabaseAdmin.schema('employer').from('companies').select('oauth_provider_id').eq('id', companyId).single();

    console.log(`User  OAuth: ${user?.oauth_provider_id}`);
    console.log(`Comp OAuth: ${comp?.oauth_provider_id}`);

    if (user?.oauth_provider_id && user.oauth_provider_id === comp?.oauth_provider_id) {
        console.log('>>> MATCH! Link via oauth_provider_id');
    } else {
        console.log('>>> No Match on OAuth');
    }
}

main();
