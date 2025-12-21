import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { put, del } from '@vercel/blob';
import { supabaseAdmin } from '@/lib/supabase';
import { encryptData, decryptData } from '@/lib/security';

export const runtime = 'nodejs';

// POST: Upload a new logo
export async function POST(req: Request) {
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

        const { searchParams } = new URL(req.url);
        const filename = searchParams.get('filename') || 'logo.jpg';

        const blob = await put(`employer-logos/${uid}/${filename}`, req.body!, {
            access: 'public',
            addRandomSuffix: true
        });

        // Encrypt the URL before storing
        const encLogoUrl = encryptData(blob.url);

        const { error } = await supabaseAdmin
            .schema('employer')
            .from('companies')
            .update({ enc_logo_url: encLogoUrl })
            .eq('id', uid);

        if (error) throw error;

        return NextResponse.json({ success: true, url: blob.url });

    } catch (error: any) {
        console.error('Employer Logo Upload Error:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}

// DELETE: Remove the logo
export async function DELETE(req: Request) {
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

        // Get current logo URL to delete from blob storage
        const { data: company, error: fetchError } = await supabaseAdmin
            .schema('employer')
            .from('companies')
            .select('enc_logo_url')
            .eq('id', uid)
            .single();

        if (fetchError) throw fetchError;

        if (company?.enc_logo_url) {
            const logoUrl = decryptData(company.enc_logo_url);
            if (logoUrl) {
                try {
                    await del(logoUrl);
                } catch (e) {
                    console.log('Blob delete failed (may not exist):', e);
                }
            }
        }

        // Clear the logo URL in database
        const { error } = await supabaseAdmin
            .schema('employer')
            .from('companies')
            .update({ enc_logo_url: null })
            .eq('id', uid);

        if (error) throw error;

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Employer Logo Delete Error:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}

