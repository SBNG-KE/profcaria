
import { supabaseAdmin } from './supabase';
import { customAlphabet } from 'nanoid';

// URL-safe alphabet, removing look-alike characters
const nanoid = customAlphabet('23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz', 6);

export async function createShortLink(originalUrl: string): Promise<string> {
    const code = nanoid();

    const { error } = await supabaseAdmin
        .from('short_links')
        .insert({
            id: code,
            original_url: originalUrl
        });

    if (error) {
        console.error('Shortener Error:', error);
        // Fallback to original if DB fails (unlikely, but safe)
        return originalUrl;
    }

    // Return the full short URL
    // Start with configured base URL or assume current origin if relative
    // For universal usage, we need the deployment domain.
    // We will assume process.env.NEXT_PUBLIC_APP_URL is set, or fallback to relative.
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://profcaria.com';
    return `${baseUrl}/l/${code}`;
}

export async function getOriginalUrl(code: string): Promise<string | null> {
    const { data } = await supabaseAdmin
        .from('short_links')
        .select('original_url')
        .eq('id', code)
        .single();

    return data?.original_url || null;
}
