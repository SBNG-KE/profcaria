import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { supabaseAdmin } from '@/lib/supabase';
import { encryptData } from '@/lib/security';

export const runtime = 'nodejs';

export async function POST(req: Request, { params }: { params: { id: string } }) {
    try {
        const { id: jobId } = await params;
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
        if (schema !== 'professional') {
            return NextResponse.json({ error: 'Only professionals can apply to jobs' }, { status: 403 });
        }

        const body = await req.json();
        const { formData, accessList } = body;

        if (!formData) {
            return NextResponse.json({ error: 'Missing application data' }, { status: 400 });
        }

        // Encrypt application data
        const encFormData = encryptData(JSON.stringify(formData));
        const encAccessList = encryptData(JSON.stringify(accessList || []));

        const { data, error } = await supabaseAdmin
            .schema('employer')
            .from('applications')
            .insert([
                {
                    job_id: jobId,
                    user_id: uid,
                    enc_form_data: encFormData,
                    enc_access_list: encAccessList,
                    status: 'pending'
                }
            ])
            .select()
            .single();

        if (error) {
            console.error('Application Error:', error);
            return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 });
        }

        // Create a notification for the employer (optional but good)
        // First we need to find the company_id for the job
        const { data: job } = await supabaseAdmin
            .schema('employer')
            .from('jobs')
            .select('company_id')
            .eq('id', jobId)
            .single();

        if (job) {
            await supabaseAdmin
                .schema('employer')
                .from('notifications')
                .insert([
                    {
                        company_id: job.company_id,
                        enc_message: encryptData('New application received for your job.'),
                        type: 'application'
                    }
                ]);
        }

        return NextResponse.json({ success: true, applicationId: data.id });

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
