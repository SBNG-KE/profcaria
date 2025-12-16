//lib/supabase.ts

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// Updated Key Name per your request
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;
// The Secret Service Role Key (Server-side only)
const supabaseSecret = process.env.SUPABASE_SECRET_KEY!;

// 1. CLIENT-SIDE CLIENT (Safe for public usage)
export const supabase = createClient(supabaseUrl, supabasePublishableKey);

// 2. SERVER-SIDE ADMIN CLIENT (Bypasses RLS)
// Use this ONLY in Next.js API Routes (app/api/...)
export const supabaseAdmin = createClient(supabaseUrl, supabaseSecret, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});