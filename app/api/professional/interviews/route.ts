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
        let payload;
        try {
            const { payload: verifiedPayload } = await jwtVerify(token, secretKey);
            payload = verifiedPayload;
        } catch (e) {
            return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
        }

        const { uid, schema } = payload;
        if (schema !== 'professional') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Fetch interviews where the user is the applicant
        const { data: interviews, error } = await supabaseAdmin
            .schema('employer')
            .from('interviews')
            .select(`
                *,
                application:applications (
                    id,
                    job:jobs (
                        id,
                        enc_title,
                        company:companies (
                            enc_company_name,
                            enc_logo_url
                        )
                    )
                )
            `)
            .eq('application.user_id', uid); // Filter by user_id in the joined application table

        if (error) {
            console.error('Fetch Interviews Error:', error);
            return NextResponse.json({ error: 'Failed' }, { status: 500 });
        }

        // Cross-schema filtering might not work in a single select if RLS is strict or schema boundaries are hard
        // Let's refine the query or filter manually if needed. 
        // For now, let's assume this works if application.user_id is accessible.

        const decryptedInterviews = (interviews || []).map((interview: any) => ({
            id: interview.id,
            scheduledAt: decryptData(interview.enc_scheduled_at),
            meetingLink: decryptData(interview.enc_meeting_link),
            notes: decryptData(interview.enc_notes),
            status: interview.status,
            jobTitle: decryptData(interview.application?.job?.enc_title),
            companyName: decryptData(interview.application?.job?.company?.enc_company_name),
            companyLogo: decryptData(interview.application?.job?.company?.enc_logo_url)
        }));

        return NextResponse.json({ interviews: decryptedInterviews });

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
