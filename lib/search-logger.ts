import { supabaseAdmin } from './supabase';

export async function logSearch(userId: string, query: string, filters: object = {}) {
    if (!userId || !query.trim()) return;

    try {
        await supabaseAdmin
            .schema('professional')
            .from('search_logs')
            .insert({
                user_id: userId,
                query: query.trim(),
                filters: filters
            });
    } catch (error) {
        console.error('Failed to log search:', error);
        // Fail silently so we don't block the user encounter
    }
}
