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
                kyc_image_url,
                kyc_video_url,
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
                email_index,
                default_doc_mode,
                badge_type,
                intent_mode
            `)
            .eq('id', professionalId)
            .single();

        if (profError || !prof) {
            console.error(`❌ [PROFILE_VIEW_API] Prof profile not found`, profError);
            return NextResponse.json({ error: 'Professional profile not found' }, { status: 404 });
        }

        const docMode = prof.default_doc_mode || 'writing';

        const profile = {
            id: professionalId,
            firstName: decryptData(prof.enc_first_name),
            lastName: decryptData(prof.enc_last_name),
            role: decryptData(prof.enc_current_role),
            profileImageUrl: decryptData(prof.enc_profile_image_url),
            about: decryptData(prof.enc_about),
            phone: decryptData(prof.enc_phone_number),
            email: decryptData(prof.enc_email),
            city: '',
            country: '',
            badgeType: prof.badge_type || 'none',
            intentMode: prof.intent_mode || 'not_looking',
            docMode
        };

        // 3. Fetch Shared Documents (Written)
        const { data: documents } = await supabaseAdmin
            .schema('professional')
            .from('documents')
            .select('doc_type, enc_content, last_updated')
            .eq('user_id', professionalId)
            .in('doc_type', accessList);

        // 3b. Fetch Uploaded Documents (all uploaded files are automatically shared)
        const { data: uploadedDocs } = await supabaseAdmin
            .schema('professional')
            .from('uploaded_documents')
            .select('id, enc_name, enc_blob_url, file_type, file_size, created_at')
            .eq('user_id', professionalId);

        // 4. Fetch Full Profile Sections
        // 4. Fetch Full Profile Sections
        const [empRes, eduRes, skillsRes, certsRes, awardsRes, profsRes] = await Promise.all([
            supabaseAdmin.schema('professional').from('employment_history').select('*').eq('user_id', professionalId),
            supabaseAdmin.schema('professional').from('education').select('*').eq('user_id', professionalId),
            supabaseAdmin.schema('professional').from('skills').select('*').eq('user_id', professionalId),
            supabaseAdmin.schema('professional').from('certifications').select('*').eq('user_id', professionalId),
            supabaseAdmin.schema('professional').from('awards').select('*').eq('user_id', professionalId),
            supabaseAdmin.schema('professional').from('other_profiles').select('*').eq('user_id', professionalId)
        ]);

        // 4b. Fetch Verified Employment History (Connections)
        const { data: verifiedApps } = await supabaseAdmin
            .schema('employer')
            .from('applications')
            .select('*, jobs(id, enc_title, company_id)')
            .eq('user_id', professionalId)
            .in('status', ['hired', 'employed', 'terminated', 'resigned', 'pending_termination', 'pending_resignation']);

        let verifiedHistory: any[] = [];
        if (verifiedApps && verifiedApps.length > 0) {
            const companyIds = [...new Set(verifiedApps.map((a: any) => a.jobs?.company_id).filter(Boolean))];
            const { data: companies } = await supabaseAdmin
                .schema('employer')
                .from('companies')
                .select('id, enc_company_name, enc_logo_url')
                .in('id', companyIds);

            verifiedHistory = verifiedApps.map((app: any) => {
                const job = app.jobs;
                const company = companies?.find((c: any) => c.id === job?.company_id);
                const isCurrent = ['hired', 'employed', 'pending_termination', 'pending_resignation'].includes(app.status);

                return {
                    id: `verified_${app.id}`,
                    source: 'automatic', // Flag for frontend
                    title: job ? decryptData(job.enc_title) : 'Unknown Role',
                    company: company ? decryptData(company.enc_company_name) : 'Unknown Company',
                    companyLogo: company ? decryptData(company.enc_logo_url) : null,
                    startDate: new Date(app.created_at).toISOString().split('T')[0],
                    endDate: isCurrent ? null : (app.terminated_at ? new Date(app.terminated_at).toISOString().split('T')[0] : null),
                    isCurrent: isCurrent,
                    description: 'Verified Employment via Profcaria',
                    // location: 'Remote' // Optional if we had location data
                };
            });
        }

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

        // Helper to map snake_case to camelCase
        const toCamelCase = (obj: any) => {
            const newObj: any = {};
            for (const key in obj) {
                const camelKey = key.replace(/([-_][a-z])/ig, ($1) => $1.toUpperCase().replace('-', '').replace('_', ''));
                newObj[camelKey] = obj[key];
            }
            return newObj;
        };

        const manualHistory = decryptList(empRes.data || [], ['enc_title', 'enc_company', 'enc_description', 'enc_start_date', 'enc_end_date'])
            .map(item => {
                const camel = toCamelCase(item);
                return {
                    ...camel,
                    startDate: camel.startDate || camel.encStartDate,
                    endDate: camel.endDate || camel.encEndDate,
                    source: 'manual'
                };
            });

        // Merge and Sort (Latest first)
        const employmentHistory = [...manualHistory, ...verifiedHistory].sort((a, b) => {
            const dateA = new Date(a.startDate || '1900-01-01').getTime();
            const dateB = new Date(b.startDate || '1900-01-01').getTime();
            return dateB - dateA;
        });

        // Normalize others
        const education = decryptList(eduRes.data || [], ['enc_school', 'enc_degree', 'enc_field_of_study'])
            .map(item => toCamelCase(item));

        const skills = decryptList(skillsRes.data || [], ['enc_name'])
            .map(item => toCamelCase(item));

        const certifications = decryptList(certsRes.data || [], ['enc_name', 'enc_issuer'])
            .map(item => toCamelCase(item));

        const awards = decryptList(awardsRes.data || [], ['enc_title', 'enc_issuer'])
            .map(item => toCamelCase(item));

        const otherProfiles = decryptList(profsRes.data || [], ['enc_network', 'enc_url'])
            .map(item => {
                const camel = toCamelCase(item);
                return {
                    ...camel,
                    platform: camel.network, // Map network to platform
                };
            });

        const sharedDocuments = (documents || []).map((doc: any) => ({
            type: doc.doc_type,
            content: decryptData(doc.enc_content),
            lastUpdated: doc.last_updated
        }));

        // Format uploaded documents for response
        const uploadedDocuments = (uploadedDocs || []).map((doc: any) => ({
            id: doc.id,
            name: decryptData(doc.enc_name),
            blobUrl: decryptData(doc.enc_blob_url),
            fileType: doc.file_type,
            fileSize: doc.file_size,
            createdAt: doc.created_at
        }));

        // ── Verification Chain ──
        const badge = prof.badge_type || 'none';
        const verChecks: { label: string; status: string; detail: string }[] = [];

        verChecks.push({
            label: 'Identity',
            status: badge === 'gold' ? 'verified' : badge === 'blue' ? 'partial' : 'unverified',
            detail: badge === 'gold' ? 'Gold verified identity' : badge === 'blue' ? 'Blue verified' : 'Not yet verified',
        });

        const verifiedEmp = employmentHistory.filter((e: any) => e.source === 'automatic' || e.source === 'employer_verified' || e.source === 'application');
        verChecks.push({
            label: 'Employment Chain',
            status: verifiedEmp.length > 0 ? (verifiedEmp.length >= employmentHistory.length ? 'verified' : 'partial') : 'unverified',
            detail: `${verifiedEmp.length}/${employmentHistory.length} roles verified`,
        });

        const { count: refCount } = await supabaseAdmin.schema('employer').from('references').select('id', { count: 'exact', head: true }).eq('professional_id', professionalId).eq('status', 'completed');
        verChecks.push({
            label: 'References',
            status: (refCount || 0) >= 2 ? 'verified' : (refCount || 0) >= 1 ? 'partial' : 'unverified',
            detail: `${refCount || 0} verified references`,
        });

        const { data: radar } = await supabaseAdmin.from('professional_radar_stats').select('depth_score, execution_speed, collaboration_index, creativity_score').eq('user_id', professionalId).single();
        verChecks.push({
            label: 'Skill Endorsements',
            status: radar ? 'verified' : 'unverified',
            detail: radar ? 'AI-verified skill assessment' : 'No AI analysis yet',
        });

        verChecks.push({ label: 'Education', status: education.length > 0 ? 'verified' : 'unverified', detail: `${education.length} education entries` });

        const docTotal = (documents || []).length + (uploadedDocs || []).length;
        verChecks.push({ label: 'Documents', status: docTotal >= 2 ? 'verified' : docTotal >= 1 ? 'partial' : 'unverified', detail: `${docTotal} supporting documents` });

        verChecks.push({ label: 'Account Security', status: prof.two_factor_enabled ? 'verified' : 'unverified', detail: prof.two_factor_enabled ? '2FA enabled' : '2FA not enabled' });

        const vVerified = verChecks.filter(c => c.status === 'verified').length;
        const vPartial = verChecks.filter(c => c.status === 'partial').length;
        const vScore = Math.round(((vVerified * 100) + (vPartial * 50)) / verChecks.length);

        // ── Career Score ──
        const skillPower = radar ? Math.round(((radar.depth_score || 0) + (radar.execution_speed || 0) + (radar.collaboration_index || 0) + (radar.creativity_score || 0)) / 4) : 0;
        let profileStrength = 0;
        if (prof.enc_profile_image_url) profileStrength += 15;
        if (prof.enc_about) profileStrength += 15;
        if (prof.enc_current_role) profileStrength += 10;
        if (skills.length >= 3) profileStrength += 25;
        if (employmentHistory.length > 0) profileStrength += 25;
        profileStrength = Math.min(profileStrength, 100);
        const csOverall = Math.round(profileStrength * 0.2 + skillPower * 0.25 + vScore * 0.25 + profileStrength * 0.3);
        const csTier = csOverall >= 80 ? 'legendary' : csOverall >= 60 ? 'elite' : csOverall >= 40 ? 'rising' : csOverall >= 20 ? 'emerging' : 'newcomer';

        return NextResponse.json({
            profile,
            sharedDocuments,
            uploadedDocuments,
            accessList,
            kycData: {
                imageUrl: application.kyc_image_url || null,
                videoUrl: application.kyc_video_url || null,
            },
            sections: {
                employmentHistory,
                education,
                skills,
                certifications,
                awards,
                otherProfiles
            },
            verification: {
                checks: verChecks,
                score: vScore,
                verified: vVerified,
                total: verChecks.length
            },
            careerScore: {
                overall: csOverall,
                tier: csTier
            }
        });

    } catch (error: any) {
        console.error('Profile Access API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
