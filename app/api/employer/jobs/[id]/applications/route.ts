import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { supabaseAdmin } from '@/lib/supabase';
import { decryptData } from '@/lib/security';

export const runtime = 'nodejs';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
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
        if (schema !== 'employer') {
            return NextResponse.json({ error: 'Only employers can view applications' }, { status: 403 });
        }

        // Fetch applications for the job
        const { data: applications, error: appError } = await supabaseAdmin
            .schema('employer')
            .from('applications')
            .select(`*`)
            .eq('job_id', jobId)
            .order('created_at', { ascending: false });

        if (appError) {
            console.error('Fetch Apps Error:', appError);
            return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
        }

        // Fetch professional details for each applicant
        const applicantIds = [...new Set(applications?.map((app: { user_id: any; }) => app.user_id) || [])];
        const { data: users, error: userError } = await supabaseAdmin
            .schema('professional')
            .from('users')
            .select('id, enc_first_name, enc_last_name, enc_profile_image_url')
            .in('id', applicantIds);

        const usersMap = (users || []).reduce((acc: any, user: any) => {
            acc[user.id] = {
                firstName: decryptData(user.enc_first_name),
                lastName: decryptData(user.enc_last_name),
                profileImageUrl: decryptData(user.enc_profile_image_url)
            };
            return acc;
        }, {});

        // Fetch invites for these applicants
        const { data: invites } = await supabaseAdmin
            .schema('employer')
            .from('job_invites')
            .select('professional_id')
            .eq('job_id', jobId)
            .in('professional_id', applicantIds);

        const invitedSet = new Set(invites?.map((i: { professional_id: any; }) => i.professional_id));

        const { data: company } = await supabaseAdmin
            .schema('employer')
            .from('companies')
            .select('enc_company_name')
            .eq('id', uid)
            .single();
        const employerCompanyName = company?.enc_company_name ? decryptData(company.enc_company_name) : null;

        const employedIds = [...new Set(applications?.filter((app: any) => app.status === 'employed').map((app: any) => app.user_id) || [])];

        // Fetch employment history only for employed applicants
        let progressionMap: Record<string, any[]> = {};
        if (employedIds.length > 0 && employerCompanyName) {
            const { data: empHistory } = await supabaseAdmin
                .schema('professional')
                .from('employment_history')
                .select('id, user_id, enc_title, enc_company, enc_start_date, enc_end_date, is_current')
                .in('user_id', employedIds);

            if (empHistory) {
                empHistory.forEach((e: any) => {
                    const compName = decryptData(e.enc_company);
                    if (compName && compName.toLowerCase() === employerCompanyName.toLowerCase()) {
                        if (!progressionMap[e.user_id]) progressionMap[e.user_id] = [];
                        progressionMap[e.user_id].push({
                            id: e.id,
                            title: decryptData(e.enc_title),
                            company: compName,
                            startDate: decryptData(e.enc_start_date),
                            endDate: decryptData(e.enc_end_date),
                            isCurrent: e.is_current
                        });
                    }
                });
                // Sort by startDate descending (newest on top)
                Object.values(progressionMap).forEach(arr => {
                    arr.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
                });
            }
        }

        const decryptedApplications = applications?.map((app: any) => ({
            ...app,
            formData: JSON.parse(decryptData(app.enc_form_data) || '{}'),
            applicant: usersMap[app.user_id] || { firstName: 'Unknown', lastName: 'User' },
            wasInvited: invitedSet.has(app.user_id), // Add flag
            progression: progressionMap[app.user_id] || [] // Add progression
        }));

        return NextResponse.json({ applications: decryptedApplications });

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// PATCH - Toggle star status on an application
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: jobId } = await params;
        const { applicationId, isStarred } = await req.json();

        if (!applicationId) {
            return NextResponse.json({ error: 'applicationId is required' }, { status: 400 });
        }

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

        const { schema } = payload;
        if (schema !== 'employer') {
            return NextResponse.json({ error: 'Only employers can star applications' }, { status: 403 });
        }

        // Verify the application belongs to this job
        const { data: application, error: fetchError } = await supabaseAdmin
            .schema('employer')
            .from('applications')
            .select('id, job_id, is_starred')
            .eq('id', applicationId)
            .eq('job_id', jobId)
            .single();

        if (fetchError || !application) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 });
        }

        // Toggle or set the star status
        const newStarred = typeof isStarred === 'boolean' ? isStarred : !application.is_starred;

        const { error: updateError } = await supabaseAdmin
            .schema('employer')
            .from('applications')
            .update({ is_starred: newStarred })
            .eq('id', applicationId);

        if (updateError) {
            console.error('Update Error:', updateError);
            return NextResponse.json({ error: 'Failed to update star status' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            applicationId,
            isStarred: newStarred
        });

    } catch (error: any) {
        console.error('PATCH Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
