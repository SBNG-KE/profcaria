import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { supabaseAdmin } from '@/lib/supabase';
import { decryptData, encryptData } from '@/lib/security';

export const runtime = 'nodejs';

// GET: Fetch all connections (accepted applications) for this professional
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

        // Get all accepted applications for this user
        const { data: applications, error: appError } = await supabaseAdmin
            .schema('employer')
            .from('applications')
            .select('*, jobs(id, enc_title, company_id)')
            .eq('user_id', uid)
            .in('status', ['accepted', 'hired', 'employed', 'offered', 'pending_termination', 'terminated'])
            .order('created_at', { ascending: false });

        if (appError) throw appError;
        if (!applications || applications.length === 0) return NextResponse.json({ connections: [] });

        // Get company details
        const companyIds = [...new Set(applications.map((app: any) => app.jobs?.company_id).filter(Boolean))];

        const { data: companies, error: compError } = await supabaseAdmin
            .schema('employer')
            .from('companies')
            .select('id, enc_company_name, enc_logo_url')
            .in('id', companyIds);

        if (compError) {
            console.error('Fetch Companies Error:', compError);
        }

        const connections = applications.map((app: any) => {
            const job = app.jobs;
            const company = companies?.find(c => c.id === job?.company_id);

            return {
                id: app.id,
                applicationId: app.id,
                status: app.status,
                connectedAt: app.created_at,
                job: {
                    id: job?.id,
                    title: decryptData(job?.enc_title) || 'Unknown Job'
                },
                company: {
                    id: company?.id,
                    name: company ? decryptData(company.enc_company_name) : 'Unknown Company',
                    logoUrl: company ? decryptData(company.enc_logo_url) : null
                }
            };
        });

        return NextResponse.json({ connections });

    } catch (error: any) {
        console.error('Fetch Professional Connections Error:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}

// PATCH: Request termination of a connection
export async function PATCH(req: Request) {
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

        const { applicationId, action } = await req.json();

        if (!applicationId || action !== 'request_termination') {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
        }

        // Verify ownership
        const { data: app, error: appError } = await supabaseAdmin
            .schema('employer')
            .from('applications')
            .select('id, user_id, jobs(company_id)')
            .eq('id', applicationId)
            .eq('user_id', uid)
            .single();

        if (appError || !app) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 });
        }

        // Update status to pending_termination (requires employer approval)
        const { error: updateError } = await supabaseAdmin
            .schema('employer')
            .from('applications')
            .update({ status: 'pending_termination' })
            .eq('id', applicationId);

        if (updateError) throw updateError;

        // Notify the employer
        const jobData = app.jobs as any;
        if (jobData?.company_id) {
            await supabaseAdmin
                .schema('employer')
                .from('notifications')
                .insert([{
                    company_id: jobData.company_id,
                    enc_message: encryptData('A connected professional has requested to terminate their employment connection.'),
                    type: 'connection'
                }]);
        }

        return NextResponse.json({ success: true, message: 'Termination request sent to employer for approval.' });

    } catch (error: any) {
        console.error('Request Termination Error:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}

