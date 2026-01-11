
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
    try {
        // Load env
        const envPath = path.resolve(process.cwd(), '.env.local');
        if (!fs.existsSync(envPath)) {
            console.error('.env.local not found');
            return;
        }
        const envContent = fs.readFileSync(envPath, 'utf-8');
        const envVars: Record<string, string> = {};
        envContent.split('\n').forEach(line => {
            const parts = line.split('=');
            if (parts.length >= 2) {
                const key = parts[0].trim();
                const val = parts.slice(1).join('=').trim().replace(/^"|"$/g, '');
                if (key) envVars[key] = val;
            }
        });

        const url = envVars['NEXT_PUBLIC_SUPABASE_URL'];
        const secret = envVars['SUPABASE_SECRET_KEY'];

        if (!url || !secret) {
            console.error('Missing keys in .env.local');
            return;
        }

        console.log('Connecting to:', url);
        const supabase = createClient(url, secret, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        console.log('Checking Professional Users...');
        const { data: pro, error: proError } = await supabase
            .schema('professional')
            .from('users')
            .select('*')
            .limit(1);

        if (proError) {
            console.error('Professional API Error:', proError);
        } else {
            console.log('Professional User Found:', pro ? pro.length : 0);
            if (pro && pro.length > 0) {
                const keys = Object.keys(pro[0]);
                console.log('PROF_HAS_PHONE:', keys.includes('has_phone_otp'));
                console.log('PROF_HAS_EMAIL:', keys.includes('has_email_otp'));
            }
        }

        console.log('\nChecking Employer Companies...');
        const { data: emp, error: empError } = await supabase
            .schema('employer')
            .from('companies')
            .select('*')
            .limit(1);

        if (empError) {
            console.error('Employer API Error:', empError);
        } else {
            console.log('Employer Company Found:', emp ? emp.length : 0);
            if (emp && emp.length > 0) {
                const keys = Object.keys(emp[0]);
                console.log('EMP_HAS_PHONE:', keys.includes('has_phone_otp'));
                console.log('EMP_HAS_EMAIL:', keys.includes('has_email_otp'));
            }
        }

    } catch (err) {
        console.error('Script Error:', err);
    }
}

main();
