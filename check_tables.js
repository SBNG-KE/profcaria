
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load .env.local manually since dotenv might not be installed or configured
const envPath = path.resolve(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
        }
    });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY; // Use secret key from lib/supabase.ts

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Missing env vars: URL or Service Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function checkTables() {
    console.log('Checking professional.posts...');
    const { data: profPosts, error: profError } = await supabase
        .schema('professional')
        .from('posts')
        .select('id')
        .limit(1);

    if (profError) console.log('Professional posts error:', profError.message);
    else console.log('Professional posts exists.');

    console.log('Checking employer.companies...');
    const { data: companies, error: compError } = await supabase
        .schema('employer')
        .from('companies') // We need to know if this table exists and what cols it has
        .select('*')
        .limit(1);

    if (compError) {
        console.log('Employer companies error:', compError.message);
    } else {
        console.log('Employer companies exists.');
        if (companies && companies.length > 0) {
            console.log('Sample company keys:', Object.keys(companies[0]));
        } else {
            console.log('No companies found to inspect keys.');
        }
    }
}

checkTables();
