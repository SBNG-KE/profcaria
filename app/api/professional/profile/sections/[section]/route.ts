import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { supabaseAdmin } from '@/lib/supabase';
import { encryptData, decryptData } from '@/lib/security';

// Helper to sync the default headline
async function syncCurrentHeadline(userId: string) {
    try {
        const { data: employments } = await supabaseAdmin
            .schema('professional')
            .from('employment_history')
            .select('enc_title, enc_start_date, is_current')
            .eq('user_id', userId);

        if (!employments || employments.length === 0) {
            return;
        }

        const decrypted = employments.map((e: any) => ({
            title: e.enc_title ? decryptData(e.enc_title) : null,
            startDate: e.enc_start_date ? new Date(decryptData(e.enc_start_date) || 0).getTime() : 0,
            isCurrent: e.is_current
        })).filter((e: any) => e.title);

        if (decrypted.length === 0) {
            return;
        }

        const currentRoles = decrypted.filter((e: any) => e.isCurrent).sort((a: any, b: any) => b.startDate - a.startDate);
        const allRolesSorted = decrypted.sort((a: any, b: any) => b.startDate - a.startDate);

        const latestRole = currentRoles.length > 0 ? currentRoles[0] : allRolesSorted[0];

        if (latestRole && latestRole.title) {
            await supabaseAdmin
                .schema('professional')
                .from('users')
                .update({ enc_current_role: encryptData(latestRole.title) })
                .eq('id', userId);
        }
    } catch (e) {
        console.error("Failed to sync current headline:", e);
    }
}

export const runtime = 'nodejs';

// --- MAPPINGS ---
// Maps external JSON keys to Internal DB Columns
const SECTION_CONFIG: any = {
    education: {
        table: 'education',
        fields: {
            id: 'id',
            school: 'enc_school',
            degree: 'enc_degree',
            fieldOfStudy: 'enc_field_of_study',
            startDate: 'enc_start_date',
            endDate: 'enc_end_date',
            isCurrent: 'is_current',
            grade: 'enc_grade',
            description: 'enc_description'
        },
        encrypted: ['school', 'degree', 'fieldOfStudy', 'startDate', 'endDate', 'grade', 'description']
    },
    employment: {
        table: 'employment_history',
        fields: {
            id: 'id',
            company: 'enc_company',
            title: 'enc_title',
            location: 'enc_location',
            type: 'enc_type',
            startDate: 'enc_start_date',
            endDate: 'enc_end_date',
            isCurrent: 'is_current',
            description: 'enc_description'
        },
        encrypted: ['company', 'title', 'location', 'type', 'startDate', 'endDate', 'description']
    },
    certifications: {
        table: 'certifications',
        fields: {
            id: 'id',
            name: 'enc_name',
            issuer: 'enc_issuer',
            issueDate: 'enc_issue_date',
            expirationDate: 'enc_expiration_date',
            credentialId: 'enc_credential_id',
            credentialUrl: 'enc_credential_url',
            documentUrl: 'enc_document_url'
        },
        encrypted: ['name', 'issuer', 'issueDate', 'expirationDate', 'credentialId', 'credentialUrl', 'documentUrl']
    },
    awards: {
        table: 'awards',
        fields: {
            id: 'id',
            title: 'enc_title',
            issuer: 'enc_issuer',
            date: 'enc_date',
            description: 'enc_description',
            documentUrl: 'enc_document_url'
        },
        encrypted: ['title', 'issuer', 'date', 'description', 'documentUrl']
    },
    skills: {
        table: 'skills',
        fields: {
            id: 'id',
            name: 'enc_name',
            documentUrl: 'enc_document_url',
            endorsementCount: 'endorsement_count'
        },
        encrypted: ['name', 'documentUrl']
    },
    other_profiles: {
        table: 'other_profiles',
        fields: {
            id: 'id',
            network: 'enc_network',
            url: 'enc_url',
            description: 'enc_description'
        },
        encrypted: ['network', 'url', 'description']
    }
};

async function checkAuth(req: Request) {
    const cookieStore = await cookies();
    const token = cookieStore.get('profcaria_session')?.value;
    if (!token) throw new Error('Unauthorized');
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    if (payload.schema !== 'professional') throw new Error('Forbidden');
    return payload.uid as string;
}

// GET: Fetch items
export async function GET(req: Request, { params }: { params: Promise<{ section: string }> }) {
    try {
        const { section } = await params;
        const userId = await checkAuth(req);
        const config = SECTION_CONFIG[section];

        if (!config) return NextResponse.json({ error: 'Invalid section' }, { status: 400 });

        const { data, error } = await supabaseAdmin
            .schema('professional')
            .from(config.table)
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const decryptedData = data.map((item: any) => {
            const result: any = {};
            // Map DB columns back to JSON keys
            for (const [key, col] of Object.entries(config.fields)) {
                if (key === 'id' || key === 'isCurrent' || key === 'endorsementCount') {
                    result[key] = item[col as string];
                } else {
                    // Decrypt if it's an encrypted column
                    const isEncrypted = config.encrypted.includes(key);
                    result[key] = isEncrypted ? decryptData(item[col as string] as string) : item[col as string];
                }
            }
            return result;
        });

        return NextResponse.json({ data: decryptedData });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Error fetching' }, { status: 500 });
    }
}

// POST: Add new item
export async function POST(req: Request, { params }: { params: Promise<{ section: string }> }) {
    try {
        const { section } = await params;
        const userId = await checkAuth(req);
        // ... (existing config check) ...
        const config = SECTION_CONFIG[section];
        if (!config) return NextResponse.json({ error: 'Invalid section' }, { status: 400 });

        const body = await req.json();
        const dbData: any = { user_id: userId };

        // Map JSON keys to DB columns
        for (const [key, col] of Object.entries(config.fields)) {
            if (key === 'id') continue;
            if (body[key] !== undefined) {
                const isEncrypted = config.encrypted.includes(key);
                dbData[col as string] = isEncrypted ? encryptData(body[key]) : body[key];
            }
        }

        // NEW: Automatically close previous current role at same company
        if (section === 'employment' && body.company && body.isCurrent) {
            const { data: existingRoles } = await supabaseAdmin
                .schema('professional')
                .from(config.table)
                .select('id, enc_company, is_current')
                .eq('user_id', userId)
                .eq('is_current', true);

            if (existingRoles) {
                for (const existing of existingRoles) {
                    const compName = existing.enc_company ? decryptData(existing.enc_company) : null;
                    if (compName && compName.trim().toLowerCase() === String(body.company).trim().toLowerCase()) {
                        await supabaseAdmin
                            .schema('professional')
                            .from(config.table)
                            .update({
                                is_current: false,
                                enc_end_date: encryptData(body.startDate || new Date().toISOString().split('T')[0])
                            })
                            .eq('id', existing.id);
                    }
                }
            }
        }

        const { data, error } = await supabaseAdmin
            .schema('professional')
            .from(config.table)
            .insert([dbData])
            .select()
            .single();

        if (error) throw error;

        // NEW: Sync Search Index if relevant section
        if (['skills', 'employment', 'education', 'about'].includes(section)) {
            // Import dynamically or at top? Let's use dynamic import or top level.
            // But this file is strict. I'll add import at top.
            // For now, assume top-level import added.
            try {
                const { syncUserSearchIndex } = await import('@/lib/search-index');
                await syncUserSearchIndex(userId);
            } catch (err) {
                console.error("Background sync failed", err);
            }
        }

        // NEW: Notify Employer of Verified Role Addition
        if (section === 'employment' && body.company && body.title) {
            try {
                const { data: companies } = await supabaseAdmin
                    .schema('employer')
                    .from('companies')
                    .select('id, enc_company_name, enc_email, badge_type');

                if (companies) {
                    const matchedCompany = companies.find((c: any) => {
                        const name = c.enc_company_name ? decryptData(c.enc_company_name) : null;
                        return name && name.toLowerCase() === body.company.toLowerCase();
                    });

                    if (matchedCompany && matchedCompany.badge_type === 'verified') {
                        const { data: professional } = await supabaseAdmin
                            .schema('professional')
                            .from('users')
                            .select('enc_first_name, enc_last_name')
                            .eq('id', userId)
                            .single();

                        const professionalName = professional
                            ? `${decryptData(professional.enc_first_name)} ${decryptData(professional.enc_last_name)}`.trim()
                            : 'A professional';

                        const employerEmail = matchedCompany.enc_email ? decryptData(matchedCompany.enc_email) : null;
                        if (employerEmail) {
                            const { sendNewRoleNotification } = await import('@/lib/email');
                            const profileLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.profcaria.com'}/public/people/${userId}`;
                            sendNewRoleNotification(employerEmail, professionalName, body.title, body.company, profileLink).catch(console.error);
                        }

                        const message = `${professionalName} has added a new role on their profile indicating they work at your company: ${body.title}`;
                        await supabaseAdmin
                            .schema('employer')
                            .from('notifications')
                            .insert([{
                                company_id: matchedCompany.id,
                                enc_message: encryptData(message),
                                type: 'system',
                                sender_id: userId,
                                sender_type: 'professional'
                            }]);
                    }
                }
            } catch (notifyErr) {
                console.error("Failed to notify employer of new role:", notifyErr);
            }
        }

        // NEW: Sync Search Index
        if (['skills', 'employment', 'education'].includes(section)) {
            try {
                const { syncUserSearchIndex } = await import('@/lib/search-index');
                await syncUserSearchIndex(userId);
            } catch (err) { console.error("Background sync failed", err); }
        }

        if (section === 'employment') {
            await syncCurrentHeadline(userId);
        }

        return NextResponse.json({ success: true, id: data.id });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Error saving' }, { status: 500 });
    }
}

// PUT: Update item
export async function PUT(req: Request, { params }: { params: Promise<{ section: string }> }) {
    try {
        const { section } = await params;
        const userId = await checkAuth(req);
        // ... (existing config check) ...
        const config = SECTION_CONFIG[section];
        if (!config) return NextResponse.json({ error: 'Invalid section' }, { status: 400 });

        const body = await req.json();
        const { id, ...updates } = body;
        if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

        const dbData: any = {};
        for (const [key, col] of Object.entries(config.fields)) {
            if (key === 'id') continue;
            if (updates[key] !== undefined) {
                const isEncrypted = config.encrypted.includes(key);
                dbData[col as string] = isEncrypted ? encryptData(updates[key]) : updates[key];
            }
        }

        dbData.updated_at = new Date().toISOString();

        const { error } = await supabaseAdmin
            .schema('professional')
            .from(config.table)
            .update(dbData)
            .eq('id', id)
            .eq('user_id', userId);

        if (error) throw error;

        // NEW: Sync Search Index
        if (['skills', 'employment', 'education'].includes(section)) {
            try {
                const { syncUserSearchIndex } = await import('@/lib/search-index');
                await syncUserSearchIndex(userId);
            } catch (err) { console.error("Background sync failed", err); }
        }

        if (section === 'employment') {
            await syncCurrentHeadline(userId);
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Error updating' }, { status: 500 });
    }
}

// DELETE: Remove item
export async function DELETE(req: Request, { params }: { params: Promise<{ section: string }> }) {
    try {
        const { section } = await params;
        const userId = await checkAuth(req);
        // ... (existing config check) ...
        const config = SECTION_CONFIG[section];
        if (!config) return NextResponse.json({ error: 'Invalid section' }, { status: 400 });

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

        const { error } = await supabaseAdmin
            .schema('professional')
            .from(config.table)
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

        if (error) throw error;

        // NEW: Sync Search Index
        if (['skills', 'employment'].includes(section)) {
            try {
                const { syncUserSearchIndex } = await import('@/lib/search-index');
                await syncUserSearchIndex(userId);
            } catch (err) { console.error("Background sync failed", err); }
        }

        if (section === 'employment') {
            await syncCurrentHeadline(userId);
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Error deleting' }, { status: 500 });
    }
}
