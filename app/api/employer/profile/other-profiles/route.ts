import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { supabaseAdmin } from '@/lib/supabase';
import { encryptData, decryptData } from '@/lib/security';

export const runtime = 'nodejs';

async function checkAuth(req: Request) {
    const cookieStore = await cookies();
    const token = cookieStore.get('profcaria_session')?.value;
    if (!token) throw new Error('Unauthorized');
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    if (payload.schema !== 'employer') throw new Error('Forbidden');
    return payload.uid as string;
}

export async function GET(req: Request) {
    try {
        const userId = await checkAuth(req);
        const { data, error } = await supabaseAdmin
            .schema('employer')
            .from('other_profiles')
            .select('*')
            .eq('company_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const profiles = data.map((item: any) => ({
            id: item.id,
            network: decryptData(item.enc_network),
            url: decryptData(item.enc_url),
            description: decryptData(item.enc_description)
        }));

        return NextResponse.json({ data: profiles });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Error fetching' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const userId = await checkAuth(req);
        const { network, url, description } = await req.json();

        const { data, error } = await supabaseAdmin
            .schema('employer')
            .from('other_profiles')
            .insert([{
                company_id: userId,
                enc_network: encryptData(network),
                enc_url: encryptData(url),
                enc_description: description ? encryptData(description) : null
            }])
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json({ success: true, id: data.id });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Error saving' }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const userId = await checkAuth(req);
        const { id, network, url, description } = await req.json();

        const updates: any = {};
        if (network) updates.enc_network = encryptData(network);
        if (url) updates.enc_url = encryptData(url);
        if (description !== undefined) updates.enc_description = encryptData(description);
        updates.updated_at = new Date().toISOString();

        const { error } = await supabaseAdmin
            .schema('employer')
            .from('other_profiles')
            .update(updates)
            .eq('id', id)
            .eq('company_id', userId);

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Error updating' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const userId = await checkAuth(req);
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        const { error } = await supabaseAdmin
            .schema('employer')
            .from('other_profiles')
            .delete()
            .eq('id', id)
            .eq('company_id', userId);

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Error deleting' }, { status: 500 });
    }
}
