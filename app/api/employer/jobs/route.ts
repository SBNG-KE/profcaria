import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { supabaseAdmin } from '@/lib/supabase';
import { encryptData, decryptData } from '@/lib/security';

export const runtime = 'nodejs';

export async function POST(req: Request) {
    try {
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
            return NextResponse.json({ error: 'Only employers can create jobs' }, { status: 403 });
        }

        const body = await req.json();
        const { title, description, formSchema, location_type, location } = body;

        if (!title || !description || !formSchema) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Encrypt everything
        const encTitle = encryptData(title);
        const encDescription = encryptData(description);
        const encFormSchema = encryptData(JSON.stringify(formSchema));
        const encLocation = location ? encryptData(location) : null;
        const encTargetLocations = body.target_locations ? encryptData(JSON.stringify(body.target_locations)) : null;

        const { data, error } = await supabaseAdmin
            .schema('employer')
            .from('jobs')
            .insert([
                {
                    company_id: uid,
                    enc_title: encTitle,
                    enc_description: encDescription,
                    enc_form_schema: encFormSchema,

                    enc_location: encLocation,
                    enc_target_locations: encTargetLocations,
                    allowed_country_codes: body.target_locations || [], // Save plain text for strict filtering
                    is_restricted: body.is_restricted || false,
                    speed_boost_location: location ? location.split(',').pop()?.trim() : null, // Store "UK" or "Kenya" plain for speed algo
                    max_applications: body.max_applications ? parseInt(body.max_applications) : null,
                    is_active: true
                }
            ])
            .select()
            .single();

        if (error) {
            console.error('Job Creation Error:', error);
            return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
        }

        return NextResponse.json({ success: true, jobId: data.id });

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
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
            return NextResponse.json({ error: 'Only employers can access this route' }, { status: 403 });
        }

        const { data: jobs, error } = await supabaseAdmin
            .schema('employer')
            .from('jobs')
            .select('*')
            .eq('company_id', uid)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Fetch Jobs Error:', error);
            return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
        }

        // Fetch application counts for these jobs
        const jobIds = jobs?.map((j: { id: any; }) => j.id) || [];
        let applicationCounts: Record<string, number> = {};

        if (jobIds.length > 0) {
            const { data: appData, error: appError } = await supabaseAdmin
                .schema('employer')
                .from('applications')
                .select('job_id')
                .in('job_id', jobIds);

            if (!appError && appData) {
                appData.forEach((app: any) => {
                    applicationCounts[app.job_id] = (applicationCounts[app.job_id] || 0) + 1;
                });
            }
        }

        // Decrypt job info for the employer
        const decryptedJobs = (jobs || []).map((job: any) => ({
            id: job.id,
            title: decryptData(job.enc_title),
            description: decryptData(job.enc_description),
            location: decryptData(job.enc_location),
            location_type: job.location_type,
            formSchema: JSON.parse(decryptData(job.enc_form_schema) || '[]'),
            isActive: job.is_active,
            createdAt: job.created_at,
            applicantCount: applicationCounts[job.id] || 0
        }));

        return NextResponse.json({ jobs: decryptedJobs });

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
