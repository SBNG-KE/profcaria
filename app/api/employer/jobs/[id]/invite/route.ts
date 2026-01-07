import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

export const runtime = 'nodejs';

export async function POST(req: Request, { params }: { params: { id: string } }) {
    try {
        const jobId = params.id;
        const cookieStore = await cookies();
        const token = cookieStore.get('profcaria_session')?.value;

        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        let auth;
        try {
            const { payload } = await jwtVerify(token, secret);
            auth = payload;
        } catch {
            return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
        }

        if (auth.schema !== 'employer') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const { professionalId } = body;

        if (!professionalId) {
            return NextResponse.json({ error: 'Professional ID required' }, { status: 400 });
        }

        // Check if already invited
        const { data: existing } = await supabaseAdmin
            .schema('employer')
            .from('job_invites')
            .select('id')
            .eq('job_id', jobId)
            .eq('professional_id', professionalId)
            .single();

        if (existing) {
            return NextResponse.json({ success: true, message: 'Already invited' });
        }

        // Insert Invite
        const { error } = await supabaseAdmin
            .schema('employer')
            .from('job_invites')
            .insert([{
                job_id: jobId,
                professional_id: professionalId,
                status: 'pending'
            }]);

        if (error) {
            console.error('Invite Error:', error);
            return NextResponse.json({ error: 'Failed to send invite' }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Invite API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
