import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { supabaseAdmin } from '@/lib/supabase';
import { decryptData } from '@/lib/security';

export const runtime = 'nodejs';

export async function GET(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('profcaria_session')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secretKey);
        const { uid, schema } = payload;

        if (schema !== 'employer') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 1. Get all jobs for this company
        const { data: jobs, error: jobsError } = await supabaseAdmin
            .schema('employer')
            .from('jobs')
            .select('id, enc_title')
            .eq('company_id', uid);

        if (jobsError) throw jobsError;
        if (!jobs || jobs.length === 0) return NextResponse.json({ applications: [] });

        const jobIds = jobs.map((j: { id: any; }) => j.id);

        // 2. Get all applications for these jobs
        const { data: applications, error: appError } = await supabaseAdmin
            .schema('employer')
            .from('applications')
            .select('*')
            .in('job_id', jobIds)
            .order('created_at', { ascending: false });

        if (appError) throw appError;
        if (!applications || applications.length === 0) return NextResponse.json({ applications: [] });

        // ... (previous logic)

        // 3. Get Professional Details for these applications
        const appUserIds = applications.map((app: { user_id: any; }) => app.user_id);

        // --- DM Logic Start ---
        // Fetch unique professionals we've talked to (sent or received) without an application
        const { data: sentDMs } = await supabaseAdmin
            .schema('employer')
            .from('messages')
            .select('recipient_id')
            .eq('sender_id', uid)
            .is('application_id', null)
            .eq('recipient_type', 'professional');

        const { data: receivedDMs } = await supabaseAdmin
            .schema('employer')
            .from('messages')
            .select('sender_id')
            .eq('recipient_id', uid)
            .is('application_id', null)
            .eq('sender_type', 'professional');

        const dmUserIds = new Set<string>();
        sentDMs?.forEach((m: any) => dmUserIds.add(m.recipient_id));
        receivedDMs?.forEach((m: any) => dmUserIds.add(m.sender_id));

        // specific check: avoid duplicates
        const allProfessionalIds = [...new Set([...appUserIds, ...Array.from(dmUserIds)])];
        // --- DM Logic End ---

        const { data: professionals, error: profError } = await supabaseAdmin
            .schema('professional')
            .from('users')
            .select('id, enc_first_name, enc_last_name, enc_profile_image_url, badge_type')
            .in('id', allProfessionalIds);

        if (profError) {
            console.error('Fetch Professionals Error:', profError);
        }

        const formattedApps = applications.map((app: any) => {
            const job = jobs.find((j: { id: any; }) => j.id === app.job_id);
            const prof = professionals?.find((p: { id: any; }) => p.id === app.user_id);
            const fName = prof?.enc_first_name ? decryptData(prof.enc_first_name) : '';
            const lName = prof?.enc_last_name ? decryptData(prof.enc_last_name) : '';

            return {
                id: app.id,
                status: app.status,
                createdAt: app.created_at,
                job: {
                    id: job?.id,
                    title: decryptData(job?.enc_title) || 'Unknown Job'
                },
                user: {
                    id: app.user_id,
                    name: prof ? `${fName} ${lName}` : 'Candidate',
                    profileImageUrl: (prof && prof.enc_profile_image_url) ? decryptData(prof.enc_profile_image_url) : null,
                    badgeType: prof?.badge_type || 'none'
                },
                isDm: false
            };
        });

        // Format DMs
        const dmConversations = Array.from(dmUserIds).map(userId => {
            const prof = professionals?.find((p: any) => p.id === userId);
            const fName = prof?.enc_first_name ? decryptData(prof.enc_first_name) : '';
            const lName = prof?.enc_last_name ? decryptData(prof.enc_last_name) : '';

            return {
                id: `dm-${userId}`,
                status: 'active',
                createdAt: new Date().toISOString(),
                job: {
                    id: 'dm',
                    title: 'Direct Message'
                },
                user: {
                    id: userId,
                    name: prof ? `${fName} ${lName}` : 'Candidate',
                    profileImageUrl: (prof && prof.enc_profile_image_url) ? decryptData(prof.enc_profile_image_url) : null,
                    badgeType: prof?.badge_type || 'none'
                },
                isDm: true,
                otherPartyId: userId
            };
        });

        return NextResponse.json({ applications: [...formattedApps, ...dmConversations] });

    } catch (error: any) {
        console.error('Fetch Employer Applications Error:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
