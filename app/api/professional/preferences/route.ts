import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { encryptData, decryptData } from '@/lib/security';

export const runtime = 'nodejs';

// Helper to get user ID from session
async function getUserId() {
    const cookieStore = await cookies();
    const token = cookieStore.get('profcaria_session')?.value;

    if (!token) return null;

    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        return { uid: payload.uid as string, schema: payload.schema as string };
    } catch {
        return null;
    }
}

export async function GET(req: Request) {
    try {
        const auth = await getUserId();
        if (!auth || auth.schema !== 'professional') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data, error } = await supabaseAdmin
            .schema('professional')
            .from('preferences')
            .select('*')
            .eq('user_id', auth.uid)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
            console.error('Error fetching preferences:', error);
            return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
        }

        // Return empty defaults if no record exists yet
        const preferences = data || {
            target_roles: [],
            preferred_locations: { countries: [], continents: [] },
            work_modes: [],
            employment_types: [],
            is_open_to_relocation: false,
            experience_years_ranges: [],
            intent_headline: null,
            min_salary: null
        };

        // Decrypt intent headline and min salary if they exist
        if (data) {
            preferences.intent_headline = decryptData(data.enc_intent_headline) || null;
            preferences.min_salary = decryptData(data.enc_min_salary) || null;
            // Remove encrypted fields from response
            delete preferences.enc_intent_headline;
            delete preferences.enc_min_salary;
        }

        return NextResponse.json({ preferences });

    } catch (error) {
        console.error('Preferences GET Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const auth = await getUserId();
        if (!auth || auth.schema !== 'professional') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const {
            target_roles,
            preferred_locations,
            work_modes,
            employment_types,
            is_open_to_relocation,
            experience_years_ranges,
            intent_headline,
            min_salary
        } = body;

        // Build upsert data
        const upsertData: any = {
            user_id: auth.uid,
            target_roles: target_roles || [],
            preferred_locations: preferred_locations || { countries: [], continents: [] },
            work_modes: work_modes || [],
            employment_types: employment_types || [],
            is_open_to_relocation: !!is_open_to_relocation,
            experience_years_ranges: experience_years_ranges || [],
            updated_at: new Date().toISOString()
        };

        // Encrypt optional intent fields
        if (intent_headline !== undefined) {
            upsertData.enc_intent_headline = intent_headline ? encryptData(intent_headline) : null;
        }
        if (min_salary !== undefined) {
            upsertData.enc_min_salary = min_salary ? encryptData(min_salary) : null;
        }

        const { error } = await supabaseAdmin
            .schema('professional')
            .from('preferences')
            .upsert(upsertData, { onConflict: 'user_id' });

        if (error) {
            console.error('Supabase Preferences Update Error:', error);
            return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Preferences PUT Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
