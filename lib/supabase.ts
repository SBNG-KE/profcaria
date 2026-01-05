//lib/supabase.ts

import { createClient } from '@supabase/supabase-js';
import { createServerClient as createSSRClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// Updated Key Name per your request
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;
// The Secret Service Role Key (Server-side only)
const supabaseSecret = process.env.SUPABASE_SECRET_KEY!;

// 1. CLIENT-SIDE CLIENT (Safe for public usage)
// Initialized lazily to prevent build-time crashes if env vars are missing
export const supabase = new Proxy({} as any, {
  get(target, prop) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

    if (!url || !key) {
      if (typeof window === 'undefined') {
        // During build/SSR, if keys are missing, return a dummy object
        // to prevent immediate crashes, but warn if actually used.
        return (() => {
          console.warn(`Supabase client accessed during build/SSR without NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`);
          return {};
        }) as any;
      }
      throw new Error("Supabase client accessed without NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY");
    }

    const client = createClient(url, key);
    return (client as any)[prop];
  }
});

// 2. SERVER-SIDE ADMIN CLIENT (Bypasses RLS)
// Use this ONLY in Next.js API Routes (app/api/...)
// Initialized lazily to prevent build-time crashes if env vars are missing
let cachedAdmin: any = null;
export const supabaseAdmin = new Proxy({} as any, {
  get(target, prop) {
    if (cachedAdmin) return cachedAdmin[prop];

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const secret = process.env.SUPABASE_SECRET_KEY;

    if (!url || !secret) {
      // During build, just return a dummy proxy or throw informative error
      // if someone actually tries to call a method like .from()
      return (...args: any[]) => {
        throw new Error(`Supabase Admin client method "${String(prop)}" called without environment variables (URL/SECRET). If this happened during build, ensure your API routes are marked dynamic.`);
      };
    }

    cachedAdmin = createClient(url, secret, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    return cachedAdmin[prop];
  }
});

// 3. SERVER-SIDE CLIENT WITH COOKIE-BASED AUTH (Respects RLS)
// Use this in API routes when you need to authenticate as the current user
export async function createServerClient(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return createSSRClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        );
      },
    },
  });
}