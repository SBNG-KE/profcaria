import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: applicationId } = await params;
        const cookieStore = await cookies();
        const token = cookieStore.get('profcaria_session')?.value;

        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
        let payload;
        try {
            const { payload: verifiedPayload } = await jwtVerify(token, secretKey);
            payload = verifiedPayload;
        } catch (e) {
            return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
        }

        const { uid: userId } = payload;

        // Check if application belongs to user
        const { data: app, error: fetchError } = await supabaseAdmin
            .schema('employer')
            .from('applications')
            .select('user_id, status')
            .eq('id', applicationId)
            .single();

        if (fetchError || !app) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 });
        }

        if (app.user_id !== userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Allow retraction only if pending (user said "if still not shortlisted")
        // Actually, user said "retract the first one if still not shortlisted".
        if (app.status !== 'pending') {
            return NextResponse.json({ error: 'Cannot retract processed application' }, { status: 400 });
        }

        // Delete the application
        const { error: deleteError } = await supabaseAdmin
            .schema('employer')
            .from('applications')
            .delete()
            .eq('id', applicationId);

        if (deleteError) throw deleteError;

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Delete Application Error:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
