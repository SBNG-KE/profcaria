const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
    console.log('Fetching a random user id directly from professional.users...');
    const { data: users, error: userError } = await supabase
        .schema('professional')
        .from('users')
        .select('id')
        .limit(1);

    if (userError || !users?.length) {
        console.error('Failed to fetch user:', userError);
        return;
    }

    const targetId = users[0].id;
    console.log(`Found a user id: ${targetId}`);

    console.log('Attempting to insert profile view...');

    const insertData = {
        viewed_professional_id: targetId,
        viewer_id: null
    };

    const { data, error } = await supabase
        .schema('professional')
        .from('profile_views')
        .insert(insertData)
        .select();

    if (error) {
        console.error('SUPABASE INSERT ERROR =>', error);
    } else {
        console.log('SUPABASE INSERT SUCCESS =>', data);
    }
}

testInsert();
