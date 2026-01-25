import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { supabaseAdmin } from '@/lib/supabase';
import { encryptData, decryptData } from '@/lib/security';

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
            credentialUrl: 'enc_credential_url'
        },
        encrypted: ['name', 'issuer', 'issueDate', 'expirationDate', 'credentialId', 'credentialUrl']
    },
    awards: {
        table: 'awards',
        fields: {
            id: 'id',
            title: 'enc_title',
            issuer: 'enc_issuer',
            date: 'enc_date',
            description: 'enc_description'
        },
        encrypted: ['title', 'issuer', 'date', 'description']
    },
    skills: {
        table: 'skills',
        fields: {
            id: 'id',
            name: 'enc_name',
            endorsementCount: 'endorsement_count'
        },
        encrypted: ['name']
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

        const { data, error } = await supabaseAdmin
            .schema('professional')
            .from(config.table)
            .insert([dbData])
            .select()
            .single();

        if (error) throw error;

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

        dbData.updated_at = new Date().toISOString(); // Auto update timestamp if column exists (skills doesn't but others do)

        const { error } = await supabaseAdmin
            .schema('professional')
            .from(config.table)
            .update(dbData)
            .eq('id', id)
            .eq('user_id', userId);

        if (error) throw error;

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

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Error deleting' }, { status: 500 });
    }
}
