import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

export const runtime = 'nodejs';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: jobId } = await params;
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

        // Check if already applied or invited (in applications table)
        const { data: existing } = await supabaseAdmin
            .schema('employer')
            .from('applications')
            .select('id, status')
            .eq('job_id', jobId)
            .eq('user_id', professionalId)
            .single();

        if (existing) {
            // If already exists, we could arguably ensure it's not 'rejected' or update status?
            // For now, let's just return success to imply "Connection Exists"
            return NextResponse.json({ success: true, message: 'Connection already exists' });
        }

        // Encrypt empty defaults for form data
        const { encryptData } = require('@/lib/security'); // Lazy import or move to top if needed. 
        // Note: Function imports should be at top. I will update imports in tool call.

        // Insert Application with 'invited' status
        const { data: appData, error } = await supabaseAdmin
            .schema('employer')
            .from('applications')
            .insert([{
                job_id: jobId,
                user_id: professionalId,
                status: 'invited',
                enc_form_data: (await import('@/lib/security')).encryptData('{}'), // Dynamic import or consistent top import
                enc_access_list: (await import('@/lib/security')).encryptData('[]')
            }])
            .select()
            .single();

        if (error) {
            console.error('Invite/Create Application Error:', error);
            return NextResponse.json({ error: 'Failed to send invite' }, { status: 500 });
        }

        // Send Notification to Professional
        // Need Company Data for the message
        const { data: job } = await supabaseAdmin
            .schema('employer')
            .from('jobs')
            .select('company_id, enc_title, companies(enc_company_name)')
            .eq('id', jobId)
            .single();

        const { decryptData, encryptData: enc } = await import('@/lib/security');
        const jobTitle = job?.enc_title ? decryptData(job.enc_title) : 'a job';
        const companyName = job?.companies?.enc_company_name ? decryptData(job.companies.enc_company_name) : 'A company';

        await supabaseAdmin
            .schema('professional')
            .from('notifications')
            .insert([{
                user_id: professionalId,
                type: 'invite',
                enc_message: enc(`${companyName} has invited you to apply for ${jobTitle}`),
                application_id: appData.id,
                is_read: false
            }]);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Invite API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
