
import { createClient } from '@supabase/supabase-js';

import fs from 'fs';
import path from 'path';

// Manual .env parsing
const envPath = path.resolve(process.cwd(), '.env.local');
console.log('Reading .env from:', envPath);

let supabaseUrl = '';
let supabaseServiceKey = '';

try {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const val = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
            if (key === 'NEXT_PUBLIC_SUPABASE_URL') supabaseUrl = val;
            if (key === 'SUPABASE_SERVICE_ROLE_KEY') supabaseServiceKey = val;
        }
    });
} catch (e) {
    console.error('Failed to read .env.local', e);
}

console.log('Keys loaded:', { URL: !!supabaseUrl, KEY: !!supabaseServiceKey });

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials. Check .env.local for NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function syncBadges() {
    console.log('Starting Badge Sync...');

    // 1. Sync Employers
    const { data: employerSubs, error: empError } = await supabase
        .schema('employer')
        .from('subscriptions')
        .select('company_id, plan_type')
        .eq('status', 'active');

    if (empError) {
        console.error('Error fetching employer subs:', empError);
    } else {
        console.log(`Found ${employerSubs.length} active employer subscriptions.`);
        for (const sub of employerSubs) {
            let badge = 'gray'; // Default/Basic
            if (sub.plan_type === 'pro') badge = 'blue';
            if (sub.plan_type === 'enterprise') badge = 'gold';
            if (sub.plan_type === 'verified') badge = 'blue';

            if (sub.company_id) {
                const { error: updateError } = await supabase
                    .schema('employer')
                    .from('companies')
                    .update({ badge_type: badge })
                    .eq('id', sub.company_id);

                if (updateError) console.error(`Failed to update company ${sub.company_id}:`, updateError);
                else console.log(`Updated Company ${sub.company_id} to ${badge}`);
            }
        }
    }

    // 2. Sync Professionals
    const { data: proSubs, error: proError } = await supabase
        .schema('professional')
        .from('subscriptions')
        .select('user_id, plan_type')
        .eq('status', 'active');

    if (proError) {
        console.error('Error fetching professional subs:', proError);
    } else {
        console.log(`Found ${proSubs.length} active professional subscriptions.`);
        for (const sub of proSubs) {
            let badge = 'gray';
            if (sub.plan_type === 'pro') badge = 'blue';
            if (sub.plan_type === 'premium') badge = 'gold';

            if (sub.user_id) {
                const { error: updateError } = await supabase
                    .schema('professional')
                    .from('users')
                    .update({ badge_type: badge })
                    .eq('id', sub.user_id);

                if (updateError) console.error(`Failed to update user ${sub.user_id}:`, updateError);
                else console.log(`Updated User ${sub.user_id} to ${badge}`);
            }
        }
    }

    console.log('Badge Sync Complete.');
}

syncBadges();
