import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { supabaseAdmin } from '@/lib/supabase';
import { decryptData } from '@/lib/security';

export const runtime = 'nodejs';

export async function GET(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('profcaria_session')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secretKey);
        const { uid, schema } = payload;

        if (schema !== 'professional') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { data: applications, error } = await supabaseAdmin
            .schema('employer')
            .from('applications')
            .select('id, status, created_at, jobs(id, enc_title, employer:users(enc_first_name, enc_last_name, enc_company_name))')
            .eq('user_id', uid)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Fetch Applications Error:', error);
            return NextResponse.json({ error: 'Failed' }, { status: 500 });
        }

        const formattedApps = (applications || []).map((app: any) => ({
            id: app.id,
            status: app.status,
            createdAt: app.created_at,
            jobTitle: decryptData(app.jobs?.enc_title) || 'Unknown Position',
            companyName: decryptData(app.jobs?.employer?.enc_company_name) || 'Secure Employer'
        }));

        return NextResponse.json({ applications: formattedApps });

    } catch (error) {
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
