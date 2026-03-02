import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { encryptData, decryptData } from '@/lib/security';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

export const runtime = 'nodejs';

async function getAuth() {
    const cookieStore = await cookies();
    const token = cookieStore.get('profcaria_session')?.value;
    if (!token) return null;
    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        if (payload.schema !== 'professional') return null;
        return { uid: payload.uid as string };
    } catch {
        return null;
    }
}

// GET - Vault summary: notes count, documents, salary history, hidden search status
export async function GET() {
    try {
        const auth = await getAuth();
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Fetch all vault data in parallel
        const [notesRes, docsRes, prefsRes, employmentRes] = await Promise.all([
            supabaseAdmin.schema('professional').from('career_notes')
                .select('id', { count: 'exact' }).eq('user_id', auth.uid),
            supabaseAdmin.schema('professional').from('documents')
                .select('id', { count: 'exact' }).eq('user_id', auth.uid),
            supabaseAdmin.schema('professional').from('preferences')
                .select('is_hidden_search, enc_salary_history, enc_min_salary')
                .eq('user_id', auth.uid).maybeSingle(),
            supabaseAdmin.schema('professional').from('employment_history')
                .select('id', { count: 'exact' }).eq('user_id', auth.uid),
        ]);

        // Decrypt salary history if exists
        let salaryHistory: any[] = [];
        if (prefsRes.data?.enc_salary_history) {
            try {
                const decrypted = decryptData(prefsRes.data.enc_salary_history);
                if (decrypted) salaryHistory = JSON.parse(decrypted);
            } catch { }
        }

        const minSalary = prefsRes.data?.enc_min_salary ? decryptData(prefsRes.data.enc_min_salary) : null;

        return NextResponse.json({
            vault: {
                notesCount: notesRes.count || 0,
                documentsCount: docsRes.count || 0,
                employmentCount: employmentRes.count || 0,
                isHiddenSearch: prefsRes.data?.is_hidden_search || false,
                salaryHistory,
                minSalary,
            }
        });
    } catch (error) {
        console.error('Vault Summary API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// PUT - Update vault settings (hidden search, salary history)
export async function PUT(req: Request) {
    try {
        const auth = await getAuth();
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const updates: any = { updated_at: new Date().toISOString() };

        if (typeof body.is_hidden_search === 'boolean') {
            updates.is_hidden_search = body.is_hidden_search;
        }

        if (body.salary_history !== undefined) {
            updates.enc_salary_history = body.salary_history
                ? encryptData(JSON.stringify(body.salary_history))
                : null;
        }

        const { error } = await supabaseAdmin
            .schema('professional')
            .from('preferences')
            .upsert({
                user_id: auth.uid,
                ...updates
            }, { onConflict: 'user_id' });

        if (error) {
            console.error('Vault PUT Error:', error);
            return NextResponse.json({ error: 'Failed to update vault settings' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Vault API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
