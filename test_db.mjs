import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;
const user_id = "60f0f916-7b32-483f-afd6-681424a360bf";

const supabase = createClient(supabaseUrl, supabaseKey, {
  db: { schema: 'professional' }
});

async function check() {
    console.log("Mocking Session Creation...");
    const { data: newSession, error: sessionErr } = await supabase
        .from('career_ai_sessions')
        .insert({ user_id: user_id, title: "Test New Chat" })
        .select('id')
        .single();
        
    console.log("Insert Error:", sessionErr);
    console.log("Insert Data:", newSession);

    if (newSession) {
        // Clean up
        await supabase.from('career_ai_sessions').delete().eq('id', newSession.id);
        console.log("Cleaned up test session.");
    }
}
check();
