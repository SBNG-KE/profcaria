
// scripts/simulate_route.ts
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
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
    const { decryptData } = await import('../lib/security');

    console.log('--- Simulating API Route Logic ---');

    // MOCK SESSION
    const user = {
        id: '60f0f916-7b32-483f-afd6-681424a360bf', // Stephen N
        schema: 'employer', // Simulating likely state
        email: 'sgakungo@gmail.com'
    };
    console.log('Mock User:', user);

    // MOCK REQUEST PARAMS
    const type = 'followers';
    const targetUserId = user.id; // Defaults to user.id
    const entityType = 'user'; // Explicit override from my fix

    console.log('Params:', { type, targetUserId, entityType });

    // LOGIC FROM ROUTE.TS
    let isTargetCompany = false;
    if (entityType) {
        isTargetCompany = entityType === 'company';
    } else {
        isTargetCompany = user.schema === 'employer' && targetUserId === user.id;
    }

    console.log('isTargetCompany:', isTargetCompany);

    if (isTargetCompany) {
        console.log('Fetching COMPANY followers...');
    } else {
        console.log('Fetching USER followers...');

        // Fetch user followers
        console.log(`Querying user_follows where following_id = ${targetUserId}`);
        const { data: followers, error } = await supabaseAdmin
            .schema('professional')
            .from('user_follows')
            .select('follower_id')
            .eq('following_id', targetUserId);

        if (error) {
            console.error('Error fetching followers:', error);
            return;
        }

        console.log(`Found ${followers?.length} raw follower records.`);
        console.log(followers);

        const formattedFollowers = (await Promise.all((followers || []).map(async (f: any) => {
            let u: any = null;
            let type = 'user';

            // 1. Try Professional User
            const { data: profUser } = await supabaseAdmin
                .schema('professional')
                .from('users')
                .select('id, enc_first_name, enc_last_name')
                .eq('id', f.follower_id)
                .single();

            if (profUser) {
                u = profUser;
                console.log(`  - Found User row for ${f.follower_id}`);
            } else {
                console.log(`  - NOT Found User row for ${f.follower_id}`);
                // 2. Try Employer Company
                const { data: company } = await supabaseAdmin
                    .schema('employer')
                    .from('companies')
                    .select('id, enc_company_name')
                    .eq('id', f.follower_id)
                    .single();

                if (company) {
                    u = company;
                    type = 'company';
                    console.log(`  - Found Company row for ${f.follower_id}`);
                }
            }

            if (!u) return null;

            let name = 'Professional';
            if (type === 'user') {
                const fName = u.enc_first_name ? decryptData(u.enc_first_name) : '';
                const lName = u.enc_last_name ? decryptData(u.enc_last_name) : '';
                name = `${fName} ${lName}`.trim() || 'Professional';
            } else {
                name = u.enc_company_name ? (decryptData(u.enc_company_name) || 'Company') : 'Company';
            }

            return {
                id: u.id,
                name: name,
                type: type
            };
        }))).filter(Boolean);

        console.log('Formatted Followers:', formattedFollowers);
        console.log('Result Count:', formattedFollowers.length);
    }

}

main();
