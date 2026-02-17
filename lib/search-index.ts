
import { supabaseAdmin } from './supabase';
import { decryptData } from './security';

/**
 * Syncs a user's encrypted profile data (Skills, Employment, Role, Name)
 * to the decrypted "search_index" table for efficient matching recommendations.
 */
export async function syncUserSearchIndex(userId: string) {
    try {
        console.log(`Syncing search index for user: ${userId}`);

        // 1. Fetch User Basics (Name, Location from preferences?)
        const { data: user, error: userError } = await supabaseAdmin
            .schema('professional')
            .from('users')
            .select('enc_first_name, enc_last_name, enc_current_role, enc_location')
            .eq('id', userId)
            .single();

        if (userError && userError.code !== 'PGRST116') console.error("Error fetching user for sync", userError);

        // 2. Fetch Skills
        const { data: skills, error: skillsError } = await supabaseAdmin
            .schema('professional')
            .from('skills')
            .select('enc_name')
            .eq('user_id', userId);

        if (skillsError) console.error("Error fetching skills for sync", skillsError);

        // 3. Fetch Employment (for Location fallback and Role fallback)
        const { data: employment, error: empError } = await supabaseAdmin
            .schema('professional')
            .from('employment_history')
            .select('enc_location, enc_title, is_current')
            .eq('user_id', userId)
            .order('enc_start_date', { ascending: false }); // Best effort ordering on encrypted date? No.
        // Actually enc_start_date cannot be ordered by SQL if encrypted.
        // We rely on 'is_current' or just taking all.

        if (empError) console.error("Error fetching employment for sync", empError);

        // --- Decrypt & Aggregate ---

        const firstName = user?.enc_first_name ? decryptData(user.enc_first_name) : '';
        const lastName = user?.enc_last_name ? decryptData(user.enc_last_name) : '';

        // Role: Prefer user.current_role, fallback to latest employment title
        let role = user?.enc_current_role ? decryptData(user.enc_current_role) : '';
        if (!role && employment && employment.length > 0) {
            // Find current
            const currentJob = employment.find((j: any) => j.is_current);
            if (currentJob?.enc_title) role = decryptData(currentJob.enc_title);
            else if (employment[0]?.enc_title) role = decryptData(employment[0].enc_title);
        }

        // Location: Prefer user.location, fallback to latest employment location
        let location = user?.enc_location ? decryptData(user.enc_location) : '';
        if (!location && employment && employment.length > 0) {
            const currentJob = employment.find((j: any) => j.is_current);
            if (currentJob?.enc_location) location = decryptData(currentJob.enc_location);
            else if (employment[0]?.enc_location) location = decryptData(employment[0].enc_location);
        }

        // Skills: Join all
        const skillsText = (skills || [])
            .map((s: any) => s.enc_name ? decryptData(s.enc_name) : '')
            .filter(Boolean)
            .join(' '); // Space separated for tsvector

        // 4. Upsert to Search Index
        const { error: upsertError } = await supabaseAdmin
            .schema('professional')
            .from('search_index')
            .upsert({
                user_id: userId,
                first_name: firstName,
                last_name: lastName,
                role_text: role,
                location_text: location,
                skills_text: skillsText,
                last_synced_at: new Date().toISOString()
            }, { onConflict: 'user_id' });

        if (upsertError) throw upsertError;

        console.log(`Successfully synced search index for user: ${userId}`);
        return true;

    } catch (error) {
        console.error("Error syncing search index:", error);
        return false;
    }
}
