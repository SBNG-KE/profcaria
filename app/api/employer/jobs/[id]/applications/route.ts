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
        const applicantIds = [...new Set(applications?.map(app => app.user_id) || [])];
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

        const decryptedApplications = applications?.map(app => ({
            ...app,
            formData: JSON.parse(decryptData(app.enc_form_data) || '{}'),
            applicant: usersMap[app.user_id] || { firstName: 'Unknown', lastName: 'User' }
        }));

        return NextResponse.json({ applications: decryptedApplications });

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
