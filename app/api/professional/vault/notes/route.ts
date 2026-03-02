import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { encryptData, decryptData } from '@/lib/security';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

export const runtime = 'nodejs';

async function getAuth() {
    const cookieStore = await cookies();
    const token = cookieStore.get('profcaria_session')?.value;
    if (!token) return null;
    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        if (payload.schema !== 'professional') return null;
        return { uid: payload.uid as string };
    } catch {
        return null;
    }
}

// GET - Fetch all career notes
export async function GET() {
    try {
        const auth = await getAuth();
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data, error } = await supabaseAdmin
            .schema('professional')
            .from('career_notes')
            .select('*')
            .eq('user_id', auth.uid)
            .order('is_pinned', { ascending: false })
            .order('updated_at', { ascending: false });

        if (error) {
            console.error('Career Notes GET Error:', error);
            return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
        }

        const notes = (data || []).map((note: any) => ({
            id: note.id,
            title: decryptData(note.enc_title) || '',
            content: decryptData(note.enc_content) || '',
            category: decryptData(note.enc_category) || 'general',
            isPinned: note.is_pinned,
            createdAt: note.created_at,
            updatedAt: note.updated_at,
        }));

        return NextResponse.json({ notes });
    } catch (error) {
        console.error('Career Notes API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST - Create a new career note
export async function POST(req: Request) {
    try {
        const auth = await getAuth();
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { title, content, category } = await req.json();

        if (!title?.trim()) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .schema('professional')
            .from('career_notes')
            .insert({
                user_id: auth.uid,
                enc_title: encryptData(title),
                enc_content: content ? encryptData(content) : null,
                enc_category: encryptData(category || 'general'),
            })
            .select()
            .single();

        if (error) {
            console.error('Career Notes POST Error:', error);
            return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
        }

        return NextResponse.json({
            note: {
                id: data.id,
                title,
                content: content || '',
                category: category || 'general',
                isPinned: false,
                createdAt: data.created_at,
                updatedAt: data.updated_at,
            }
        });
    } catch (error) {
        console.error('Career Notes API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// PUT - Update a career note
export async function PUT(req: Request) {
    try {
        const auth = await getAuth();
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id, title, content, category, isPinned } = await req.json();

        if (!id) return NextResponse.json({ error: 'Note ID is required' }, { status: 400 });

        const updates: any = { updated_at: new Date().toISOString() };
        if (title !== undefined) updates.enc_title = encryptData(title);
        if (content !== undefined) updates.enc_content = content ? encryptData(content) : null;
        if (category !== undefined) updates.enc_category = encryptData(category);
        if (typeof isPinned === 'boolean') updates.is_pinned = isPinned;

        const { error } = await supabaseAdmin
            .schema('professional')
            .from('career_notes')
            .update(updates)
            .eq('id', id)
            .eq('user_id', auth.uid);

        if (error) {
            console.error('Career Notes PUT Error:', error);
            return NextResponse.json({ error: 'Failed to update note' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Career Notes API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE - Delete a career note
export async function DELETE(req: Request) {
    try {
        const auth = await getAuth();
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'Note ID is required' }, { status: 400 });

        const { error } = await supabaseAdmin
            .schema('professional')
            .from('career_notes')
            .delete()
            .eq('id', id)
            .eq('user_id', auth.uid);

        if (error) {
            console.error('Career Notes DELETE Error:', error);
            return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Career Notes API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
