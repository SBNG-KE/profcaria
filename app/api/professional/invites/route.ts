import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { decryptData } from '@/lib/security';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

export const runtime = 'nodejs';

async function getAuth() {
    const cookieStore = await cookies();
    const token = cookieStore.get('profcaria_session')?.value;
    if (!token) return null;
    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        if (payload.schema !== 'professional') return null;
        return { uid: payload.uid as string };
    } catch {
        return null;
    }
}

// GET: Fetch all invites for the current professional
export async function GET() {
    try {
        const auth = await getAuth();
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: invites, error } = await supabaseAdmin
            .schema('employer')
            .from('job_invites')
            .select('id, job_id, company_id, status, created_at, viewed_at, enc_message')
            .eq('professional_id', auth.uid)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Fetch invites error:', error);
            return NextResponse.json({ error: 'Failed to fetch invites' }, { status: 500 });
        }

        // Enrich with job and company details
        const enriched = await Promise.all((invites || []).map(async (invite: any) => {
            let jobTitle = 'Unknown Job';
            let companyName = 'Unknown Company';
            let companyLogo = '';
            let jobLocation = '';

            // Get job details
            if (invite.job_id) {
                const { data: job } = await supabaseAdmin
                    .schema('employer')
                    .from('jobs')
                    .select('enc_title, enc_location')
                    .eq('id', invite.job_id)
                    .single();
                if (job) {
                    jobTitle = job.enc_title ? decryptData(job.enc_title) || 'Untitled' : 'Untitled';
                    jobLocation = job.enc_location ? decryptData(job.enc_location) || '' : '';
                }
            }

            // Get company details
            if (invite.company_id) {
                const { data: company } = await supabaseAdmin
                    .schema('employer')
                    .from('companies')
                    .select('company_name, company_logo')
                    .eq('id', invite.company_id)
                    .single();
                if (company) {
                    companyName = company.company_name || 'Unnamed Company';
                    companyLogo = company.company_logo || '';
                }
            }

            const message = invite.enc_message ? decryptData(invite.enc_message) : '';

            return {
                id: invite.id,
                jobId: invite.job_id,
                companyId: invite.company_id,
                jobTitle,
                companyName,
                companyLogo,
                jobLocation,
                message,
                status: invite.status,
                createdAt: invite.created_at,
                viewedAt: invite.viewed_at,
            };
        }));

        return NextResponse.json({ invites: enriched });
    } catch (error) {
        console.error('Invites API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// PUT: Respond to an invite (accept/decline) or mark as viewed
export async function PUT(req: Request) {
    try {
        const auth = await getAuth();
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { inviteId, action } = await req.json();

        if (!inviteId || !action) {
            return NextResponse.json({ error: 'inviteId and action are required' }, { status: 400 });
        }

        // Verify invite belongs to this professional
        const { data: invite } = await supabaseAdmin
            .schema('employer')
            .from('job_invites')
            .select('id, professional_id, job_id')
            .eq('id', inviteId)
            .eq('professional_id', auth.uid)
            .single();

        if (!invite) {
            return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
        }

        if (action === 'view') {
            await supabaseAdmin.schema('employer')
                .from('job_invites')
                .update({ viewed_at: new Date().toISOString() })
                .eq('id', inviteId);
        } else if (action === 'accept') {
            // Accept = auto-apply to the job
            await supabaseAdmin.schema('employer')
                .from('job_invites')
                .update({ status: 'accepted' })
                .eq('id', inviteId);

            // Create an application for this job
            await supabaseAdmin.schema('employer')
                .from('applications')
                .upsert({
                    job_id: invite.job_id,
                    user_id: auth.uid,
                    status: 'invited',
                }, { onConflict: 'job_id,user_id' });
        } else if (action === 'decline') {
            await supabaseAdmin.schema('employer')
                .from('job_invites')
                .update({ status: 'declined' })
                .eq('id', inviteId);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Invite Action Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
