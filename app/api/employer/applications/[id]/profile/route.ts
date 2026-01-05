import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { supabaseAdmin } from '@/lib/supabase';
import { decryptData } from '@/lib/security';

export const runtime = 'nodejs';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: applicationId } = await params;
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

        const { uid: companyId, schema } = payload;
        if (schema !== 'employer') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        // 1. Fetch Application + Verify Ownership
        const { data: application, error: appError } = await supabaseAdmin
            .schema('employer')
            .from('applications')
            .select(`
                user_id,
                enc_access_list,
                jobs ( company_id )
            `)
            .eq('id', applicationId)
            .single();

        if (appError || !application) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 });
        }

        // Check ownership (TS might complain about joined table structure)
        const jobData = application.jobs as any;
        if (jobData?.company_id !== companyId) {
            return NextResponse.json({ error: 'Forbidden: You do not own this job posting' }, { status: 403 });
        }

        const { user_id: professionalId, enc_access_list: encAccessList } = application;
        const accessList: string[] = JSON.parse(decryptData(encAccessList) || '[]');

        // 2. Fetch Professional Profile
        const { data: prof, error: profError } = await supabaseAdmin
            .schema('professional')
            .from('users')
            .select('enc_first_name, enc_last_name, enc_current_role, enc_profile_image_url, email_index')
            .eq('id', professionalId)
            .single();

        if (profError || !prof) {
            return NextResponse.json({ error: 'Professional profile not found' }, { status: 404 });
        }

        const profile = {
            id: professionalId,
            firstName: decryptData(prof.enc_first_name),
            lastName: decryptData(prof.enc_last_name),
            role: decryptData(prof.enc_current_role),
            profileImageUrl: decryptData(prof.enc_profile_image_url),
            email: prof.email_index // Blind index, but serves as ID
        };

        // 3. Fetch Shared Documents
        const { data: documents, error: docError } = await supabaseAdmin
            .schema('professional')
            .from('documents')
            .select('doc_type, enc_content, last_updated')
            .eq('user_id', professionalId)
            .in('doc_type', accessList);

        const sharedDocuments = (documents || []).map(doc => ({
            type: doc.doc_type,
            content: decryptData(doc.enc_content),
            lastUpdated: doc.last_updated
        }));

        return NextResponse.json({
            profile,
            sharedDocuments,
            accessList
        });

    } catch (error: any) {
        console.error('Profile Access API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
