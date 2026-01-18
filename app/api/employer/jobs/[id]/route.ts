import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { supabaseAdmin } from '@/lib/supabase';
import { encryptData } from '@/lib/security';

export const runtime = 'nodejs';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
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

        const { uid, schema } = payload;
        if (schema !== 'employer') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const body = await req.json();
        const { isActive, title, description, formSchema, location_type, location } = body;

        const updateData: any = { updated_at: new Date().toISOString() };
        if (isActive !== undefined) updateData.is_active = isActive;
        if (title !== undefined) updateData.enc_title = encryptData(title);
        if (description !== undefined) updateData.enc_description = encryptData(description);
        if (formSchema !== undefined) updateData.enc_form_schema = encryptData(JSON.stringify(formSchema));
        if (location_type !== undefined) updateData.location_type = location_type;
        if (location !== undefined) updateData.enc_location = location ? encryptData(location) : null;

        const { error } = await supabaseAdmin
            .schema('employer')
            .from('jobs')
            .update(updateData)
            .eq('id', id)
            .eq('company_id', uid);

        if (error) return NextResponse.json({ error: 'Update failed' }, { status: 500 });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    return PATCH(req, { params });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
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

        const { uid, schema } = payload;
        if (schema !== 'employer') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        // NEW: Check for unreviewed applications before deletion
        const { count: pendingCount } = await supabaseAdmin
            .schema('employer')
            .from('applications')
            .select('id', { count: 'exact', head: true })
            .eq('job_id', id)
            .eq('status', 'pending');

        if (pendingCount && pendingCount > 0) {
            return NextResponse.json({
                error: `Cannot delete this job. There are ${pendingCount} candidate(s) who have not been reviewed. Please accept, reject, or decline all applicants first.`,
                pendingCount
            }, { status: 403 });
        }

        const { error } = await supabaseAdmin
            .schema('employer')
            .from('jobs')
            .delete()
            .eq('id', id)
            .eq('company_id', uid);

        if (error) return NextResponse.json({ error: 'Delete failed' }, { status: 500 });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

