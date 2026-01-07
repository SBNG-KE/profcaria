import { put, del } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { supabaseAdmin } from '@/lib/supabase';
import { encryptData } from '@/lib/security';

export async function POST(request: Request) {
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
            return NextResponse.json({ error: 'Only professionals can upload profile images' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const filename = searchParams.get('filename') || `profile-${uid}.png`;

        // 1. Upload to Vercel Blob
        const blob = await put(filename, request.body!, {
            access: 'public',
            addRandomSuffix: true
        });

        // 2. Encrypt the URL and save to DB
        const encUrl = encryptData(blob.url);

        const { error: dbError } = await supabaseAdmin
            .schema('professional')
            .from('users')
            .update({ enc_profile_image_url: encUrl })
            .eq('id', uid);

        if (dbError) {
            console.error('DB Update Error:', dbError);
            return NextResponse.json({ error: 'Failed to update user profile' }, { status: 500 });
        }

        return NextResponse.json({ url: blob.url });
    } catch (error: any) {
        console.error('Upload Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
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
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 1. Get current image URL from DB
        const { data: user, error: fetchError } = await supabaseAdmin
            .schema('professional')
            .from('users')
            .select('enc_profile_image_url')
            .eq('id', uid)
            .single();

        if (fetchError || !user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // We don't necessarily need to delete from Vercel Blob if we don't have the URL easily, 
        // but it's better to keep it clean.
        // For now, just set it to null in DB.

        const { error: dbError } = await supabaseAdmin
            .schema('professional')
            .from('users')
            .update({ enc_profile_image_url: null })
            .eq('id', uid);

        if (dbError) {
            return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Delete Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
