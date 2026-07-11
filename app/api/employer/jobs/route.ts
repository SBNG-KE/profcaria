import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { supabaseAdmin } from '@/lib/supabase';
import { encryptData, decryptData } from '@/lib/security';
import { checkLimit, incrementUsage } from '@/lib/billing';
import { generateEmbedding } from '@/lib/embeddings';
import { validateJobCategory } from '@/lib/ai-moderation';

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

        // Check Limits
        const canPostJob = await checkLimit(uid as string, 'jobs');
        if (!canPostJob) {
            return NextResponse.json({ error: 'Job posting limit reached for your current plan.' }, { status: 403 });
        }

        // NEW: Check for pending applications - must review candidates before posting new jobs
        const { data: allJobs } = await supabaseAdmin
            .schema('employer')
            .from('jobs')
            .select('id')
            .eq('company_id', uid);

        if (allJobs && allJobs.length > 0) {
            const jobIds = allJobs.map((j: any) => j.id);
            const { count: pendingCount } = await supabaseAdmin
                .schema('employer')
                .from('applications')
                .select('id', { count: 'exact', head: true })
                .in('job_id', jobIds)
                .eq('status', 'pending');

            const MAX_PENDING_BEFORE_BLOCK = 10;
            if (pendingCount && pendingCount > MAX_PENDING_BEFORE_BLOCK) {
                return NextResponse.json({
                    error: `Please review pending candidates before posting new jobs. You have ${pendingCount} applications awaiting your decision.`,
                    pendingCount
                }, { status: 403 });
            }
        }

        const body = await req.json();
        const { title, description, formSchema, location_type, location, employment_type, role_category, role_categories } = body;

        if (!title || !description || !formSchema) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const moderation = await validateJobCategory(String(title).trim());
        if (!moderation.valid) {
            return NextResponse.json({ error: moderation.reason || 'Use a valid professional job title.' }, { status: 422 });
        }

        // Check Restricted Location Access
        if (body.is_restricted) {
            const { plan } = await import('@/lib/billing').then(m => m.getCompanyPlan(uid as string));
            if (!plan.limits.restrictedLocations) {
                return NextResponse.json({ error: 'Restricted locations require a Basic plan or higher.' }, { status: 403 });
            }
        }

        // Encrypt everything
        const encTitle = encryptData(title);
        const encDescription = encryptData(description);
        const encFormSchema = encryptData(JSON.stringify(formSchema));
        const encLocation = location ? encryptData(location) : null;
        const encTargetLocations = body.target_locations ? encryptData(JSON.stringify(body.target_locations)) : null;

        // Check Plan Limits for Applications
        const { plan } = await import('@/lib/billing').then(m => m.getCompanyPlan(uid as string));
        const planMaxApps = plan.limits.maxApplicationsPerJob || 10;

        let appsCap = body.max_applications ? parseInt(body.max_applications) : null;

        // Only enforce plan limit if user explicitly set a value
        if (appsCap && appsCap > planMaxApps) {
            appsCap = planMaxApps;
        }
        // If null/empty, it means unlimited - don't force plan max

        const { data, error } = await supabaseAdmin
            .schema('employer')
            .from('jobs')
            .insert([
                {
                    company_id: uid,
                    enc_title: encTitle,
                    enc_description: encDescription,
                    role_category: role_category || null,
                    role_categories: role_categories || (role_category ? [role_category] : []), // New array field
                    enc_form_schema: encFormSchema,

                    enc_location: encLocation,
                    enc_target_locations: encTargetLocations,
                    allowed_country_codes: body.target_locations || [], // Save plain text for strict filtering
                    is_restricted: body.is_restricted || false,
                    speed_boost_location: location ? location.split(',').pop()?.trim() : null, // Store "UK" or "Kenya" plain for speed algo
                    max_applications: appsCap, // Enforce Plan Cap
                    employment_type: body.employment_type || 'full-time',
                    location_type: body.location_type || 'remote',
                    is_active: true
                }
            ])
            .select()
            .single();

        if (error) {
            console.error('Job Creation Error:', error);
            return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
        }

        // Asynchronously update usage
        await incrementUsage(uid as string, 'jobs');

        // Auto-generate embedding for semantic matching (non-blocking)
        // This runs in background so job creation response is immediate
        const jobId = data.id;
        (async () => {
            try {
                const text = `${title} ${description}`.slice(0, 512);
                const embedding = await generateEmbedding(text);
                if (embedding) {
                    await supabaseAdmin
                        .schema('employer')
                        .from('jobs')
                        .update({ embedding_json: embedding })
                        .eq('id', jobId);
                    console.log(`[Jobs] Embedding generated for job ${jobId}`);
                }
            } catch (embError) {
                console.log('[Jobs] Embedding generation skipped:', embError);
                // Non-critical: rule-based matching still works
            }
        })();

        return NextResponse.json({ success: true, jobId: data.id });

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({
            error: 'Internal Server Error',
            details: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
        }, { status: 500 });
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
            role_category: job.role_category,
            role_categories: job.role_categories,
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
