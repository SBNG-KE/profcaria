import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { supabaseAdmin } from '@/lib/supabase';
import { decryptData } from '@/lib/security';

export const runtime = 'nodejs';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: applicationId } = await params;
        console.log(`🔍 [PROFILE_VIEW_API] Hit for App ID: ${applicationId}`);
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
            console.error(`❌ [PROFILE_VIEW_API] App not found or error`, appError);
            return NextResponse.json({ error: 'Application not found' }, { status: 404 });
        }

        // Check ownership (TS might complain about joined table structure)
        const jobData = application.jobs as any;
        if (jobData?.company_id !== companyId) {
            console.error(`❌ [PROFILE_VIEW_API] Forbidden: Company ID mismatch`);
            return NextResponse.json({ error: 'Forbidden: You do not own this job posting' }, { status: 403 });
        }

        const { user_id: professionalId, enc_access_list: encAccessList } = application;
        const accessList: string[] = JSON.parse(decryptData(encAccessList) || '[]');

        // 2. Fetch Professional Profile
        const { data: prof, error: profError } = await supabaseAdmin
            .schema('professional')
            .from('users')
            .select(`
                enc_first_name, 
                enc_last_name, 
                enc_current_role, 
                enc_profile_image_url, 
                enc_about,
                enc_phone_number,
                enc_email,
                email_index
            `)
            .eq('id', professionalId)
            .single();

        if (profError || !prof) {
            console.error(`❌ [PROFILE_VIEW_API] Prof profile not found`, profError);
            return NextResponse.json({ error: 'Professional profile not found' }, { status: 404 });
        }

        const profile = {
            id: professionalId,
            firstName: decryptData(prof.enc_first_name),
            lastName: decryptData(prof.enc_last_name),
            role: decryptData(prof.enc_current_role),
            profileImageUrl: decryptData(prof.enc_profile_image_url),
            about: decryptData(prof.enc_about),
            phone: decryptData(prof.enc_phone_number),
            email: decryptData(prof.enc_email)
        };

        // 3. Fetch Shared Documents
        const { data: documents } = await supabaseAdmin
            .schema('professional')
            .from('documents')
            .select('doc_type, enc_content, last_updated')
            .eq('user_id', professionalId)
            .in('doc_type', accessList);

        // 4. Fetch Full Profile Sections
        const [empRes, eduRes, skillsRes, certsRes, awardsRes, profsRes] = await Promise.all([
            supabaseAdmin.schema('professional').from('employment_history').select('*').eq('user_id', professionalId),
            supabaseAdmin.schema('professional').from('education').select('*').eq('user_id', professionalId),
            supabaseAdmin.schema('professional').from('skills').select('*').eq('user_id', professionalId),
            supabaseAdmin.schema('professional').from('certifications').select('*').eq('user_id', professionalId),
            supabaseAdmin.schema('professional').from('awards').select('*').eq('user_id', professionalId),
            supabaseAdmin.schema('professional').from('other_profiles').select('*').eq('user_id', professionalId)
        ]);

        // Helper to decrypt array of objects
        const decryptList = (list: any[], fields: string[]) => {
            return (list || []).map(item => {
                const decryptedItem: any = { ...item };
                fields.forEach(field => {
                    if (decryptedItem[field]) {
                        decryptedItem[field.replace('enc_', '')] = decryptData(decryptedItem[field]);
                        // optional: delete decryptedItem[field]; // remove enc field
                    }
                });
                return decryptedItem;
            });
        };

        const employmentHistory = decryptList(empRes.data || [], ['enc_title', 'enc_company', 'enc_description']);
        const education = decryptList(eduRes.data || [], ['enc_school', 'enc_degree', 'enc_field_of_study']);
        const skills = decryptList(skillsRes.data || [], ['enc_name']);
        const certifications = decryptList(certsRes.data || [], ['enc_name', 'enc_issuer']);
        const awards = decryptList(awardsRes.data || [], ['enc_title', 'enc_issuer']);
        const otherProfiles = decryptList(profsRes.data || [], []); // Usually not encrypted or minimal

        const sharedDocuments = (documents || []).map((doc: any) => ({
            type: doc.doc_type,
            content: decryptData(doc.enc_content),
            lastUpdated: doc.last_updated
        }));

        return NextResponse.json({
            profile,
            sharedDocuments,
            accessList,
            sections: {
                employmentHistory,
                education,
                skills,
                certifications,
                awards,
                otherProfiles
            }
        });

    } catch (error: any) {
        console.error('Profile Access API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
