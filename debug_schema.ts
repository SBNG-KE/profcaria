
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);

async function checkSchema() {
    console.log("--- PROFESSIONAL USERS ---");
    const { data: users, error: uErr } = await supabase.schema('professional').from('users').select('*').limit(1);
    if (uErr) console.error(uErr);
    else if (users.length) console.log(Object.keys(users[0]));
    else console.log("No users found");

    console.log("\n--- EMPLOYER JOBS ---");
    const { data: jobs, error: jErr } = await supabase.schema('employer').from('jobs').select('*').limit(1);
    if (jErr) console.error(jErr);
    else if (jobs.length) console.log(Object.keys(jobs[0]));
    else console.log("No jobs found");
}

checkSchema();
