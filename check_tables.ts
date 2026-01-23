
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Missing env vars');
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

    console.log('Checking employer.posts...');
    const { data: empPosts, error: empError } = await supabase
        .schema('employer')
        .from('posts') // Guessing table name
        .select('id')
        .limit(1);

    if (empError) console.log('Employer posts error (likely table missing):', empError.message);
    else console.log('Employer posts exists!');
}

checkTables();
