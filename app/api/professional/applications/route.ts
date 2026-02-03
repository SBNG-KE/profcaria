import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { supabaseAdmin } from '@/lib/supabase';
import { decryptData } from '@/lib/security';

export const runtime = 'nodejs';

// ... (previous imports)

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

        // 1. Fetch Applications (Existing Logic)
        const { data: applications, error: appError } = await supabaseAdmin
            .schema('employer')
            .from('applications')
            .select('id, status, created_at, job_id')
            .eq('user_id', uid)
            .order('created_at', { ascending: false });

        if (appError) {
            console.error('Fetch Applications Error:', appError);
            return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
        }

        // 2. Fetch Direct Message "Conversations" (New Logic)
        // We need to know who we talked to AND what type they are.
        const { data: sentDMs } = await supabaseAdmin
            .schema('employer')
            .from('messages')
            .select('recipient_id, recipient_type')
            .eq('sender_id', uid)
            .is('application_id', null);

        const { data: receivedDMs } = await supabaseAdmin
            .schema('employer')
            .from('messages')
            .select('sender_id, sender_type')
            .eq('recipient_id', uid)
            .is('application_id', null);

        const dmEmployerIds = new Set<string>();
        const dmProfessionalIds = new Set<string>();

        sentDMs?.forEach((m: any) => {
            if (m.recipient_type === 'employer') dmEmployerIds.add(m.recipient_id);
            if (m.recipient_type === 'professional') dmProfessionalIds.add(m.recipient_id);
        });
        receivedDMs?.forEach((m: any) => {
            if (m.sender_type === 'employer') dmEmployerIds.add(m.sender_id);
            if (m.sender_type === 'professional') dmProfessionalIds.add(m.sender_id);
        });

        // 3. Fetch Job Details for Applications
        const appJobIds = [...new Set((applications || []).map((app: { job_id: any; }) => app.job_id))];
        const { data: jobs, error: jobError } = await supabaseAdmin
            .schema('employer')
            .from('jobs')
            .select('id, enc_title, company_id')
            .in('id', appJobIds);

        if (jobError) throw jobError;

        // 4. Fetch Details (Combined)
        const appCompanyIds = jobs?.map((j: any) => j.company_id) || [];
        const allEmployerIds = [...new Set([...appCompanyIds, ...Array.from(dmEmployerIds)])];
        const allProfessionalIds = Array.from(dmProfessionalIds);

        // Fetch Employers
        const { data: employers, error: empError } = await supabaseAdmin
            .schema('employer')
            .from('companies')
            .select('id, enc_company_name, enc_logo_url, badge_type')
            .in('id', allEmployerIds);

        if (empError) throw empError;

        // Fetch Professionals
        let professionals: any[] = [];
        if (allProfessionalIds.length > 0) {
            const { data: profs, error: profError } = await supabaseAdmin
                .schema('professional')
                .from('users')
                .select('id, enc_first_name, enc_last_name, enc_profile_image_url, badge_type')
                .in('id', allProfessionalIds);

            if (!profError && profs) {
                professionals = profs;
            }
        }

        // 5. Format Applications
        const formattedApps = (applications || []).map((app: any) => {
            // ... (keep existing app logic)
            const job = jobs?.find((j: { id: any; }) => j.id === app.job_id);
            const employer = employers?.find((e: { id: any; }) => e.id === job?.company_id);

            return {
                id: app.id,
                status: app.status,
                createdAt: app.created_at,
                jobTitle: decryptData(job?.enc_title) || 'Unknown Position',
                companyName: decryptData(employer?.enc_company_name) || 'Secure Employer',
                companyLogoUrl: employer?.enc_logo_url ? decryptData(employer.enc_logo_url) : null,
                companyId: employer?.id || job?.company_id,
                badgeType: employer?.badge_type || 'none',
                isDm: false
            };
        });

        // 6. Format Direct Messages
        // We iterate over the unique IDs we found. 
        // Note: A user might have DMs with both an employer and a professional, or mixed.
        // We will create items for each unique conversation partner.

        const dmConversations: any[] = [];

        // Add Employer DMs
        dmEmployerIds.forEach(empId => {
            // Exclude if this employer is already in the applications list? 
            // Actually, some users might want to see the DM separately if it's unrelated to the application.
            // But usually, DMs merge with applications? 
            // For now, let's include them as distinct items if they don't share an app ID.

            const employer = employers?.find((e: any) => e.id === empId);
            dmConversations.push({
                id: `dm-emp-${empId}`,
                status: 'active',
                createdAt: new Date().toISOString(),
                jobTitle: 'Direct Message',
                companyName: decryptData(employer?.enc_company_name) || 'Unknown Company',
                companyLogoUrl: employer?.enc_logo_url ? decryptData(employer.enc_logo_url) : null,
                companyId: empId,
                badgeType: employer?.badge_type || 'none',
                isDm: true,
                otherPartyId: empId,
                otherPartyType: 'employer'
            });
        });

        // Add Professional DMs
        dmProfessionalIds.forEach(profId => {
            const prof = professionals?.find((p: any) => p.id === profId);
            if (prof) {
                const name = `${decryptData(prof.enc_first_name)} ${decryptData(prof.enc_last_name)}`;
                dmConversations.push({
                    id: `dm-prof-${profId}`,
                    status: 'active',
                    createdAt: new Date().toISOString(),
                    jobTitle: 'Direct Message', // Or "Professional"
                    companyName: name, // We map Person Name to "companyName" for UI compatibility
                    companyLogoUrl: decryptData(prof.enc_profile_image_url) || null,
                    companyId: null, // No company ID
                    badgeType: prof.badge_type || 'none',
                    isDm: true,
                    otherPartyId: profId,
                    otherPartyType: 'professional'
                });
            }
        });

        const combinedList = [...formattedApps, ...dmConversations];

        return NextResponse.json({ applications: combinedList });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
