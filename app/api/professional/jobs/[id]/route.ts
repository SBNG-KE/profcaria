import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { supabaseAdmin } from '@/lib/supabase';
import { decryptData } from '@/lib/security';

export const runtime = 'nodejs';

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = await params;
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

        const { data: job, error } = await supabaseAdmin
            .schema('employer')
            .from('jobs')
            .select(`
                *,
                company:companies (
                    id,
                    enc_company_name,
                    enc_logo_url
                )
            `)
            .eq('id', id)
            .single();

        if (error || !job) {
            return NextResponse.json({ error: 'Job not found' }, { status: 404 });
        }

        const decryptedJob = {
            id: job.id,
            title: decryptData(job.enc_title),
            description: decryptData(job.enc_description),
            formSchema: JSON.parse(decryptData(job.enc_form_schema) || '[]'),
            company: {
                id: job.company?.id,
                name: decryptData(job.company?.enc_company_name),
                logoUrl: decryptData(job.company?.enc_logo_url)
            }
        };

        return NextResponse.json(decryptedJob);

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
