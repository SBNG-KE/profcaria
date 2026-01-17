import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { supabaseAdmin } from '@/lib/supabase';
import { encryptData, decryptData } from '@/lib/security';

export const runtime = 'nodejs';

// --- GET: Fetch Custom Cards ---
export async function GET(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('profcaria_session')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        const userId = payload.uid as string;

        const { data, error } = await supabaseAdmin
            .schema('professional')
            .from('custom_cards')
            .select('enc_title')
            .eq('user_id', userId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Fetch Cards Error:', error);
            return NextResponse.json({ error: 'DB Error' }, { status: 500 });
        }

        // Default cards
        const baseCards = ['RESUME', 'CV', 'CERTIFICATES'];

        // Decrypt DB cards
        const dbCards = data.map((c: { enc_title: string; }) => decryptData(c.enc_title)).filter(Boolean) as string[];

        // De-duplicate if necessary
        const allCards = Array.from(new Set([...baseCards, ...dbCards]));

        return NextResponse.json({ cards: allCards });

    } catch (err) {
        console.error('Cards Load Error:', err);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}

// --- PUT: Rename Custom Card ---
export async function PUT(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('profcaria_session')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        const userId = payload.uid as string;

        const { oldTitle, newTitle } = await req.json();
        if (!oldTitle || !newTitle) {
            return NextResponse.json({ error: 'oldTitle and newTitle required' }, { status: 400 });
        }

        const baseCards = ['RESUME', 'CV', 'CERTIFICATES'];
        if (baseCards.includes(oldTitle.toUpperCase())) {
            return NextResponse.json({ error: 'Cannot rename base cards' }, { status: 400 });
        }

        // Fetch user's custom cards to find the one to update
        const { data: cards, error: fetchError } = await supabaseAdmin
            .schema('professional')
            .from('custom_cards')
            .select('id, enc_title')
            .eq('user_id', userId);

        if (fetchError) throw fetchError;

        // Find the card with matching decrypted title
        const cardToUpdate = cards?.find((c: { id: string, enc_title: string }) => {
            const decrypted = decryptData(c.enc_title);
            return decrypted === oldTitle.toUpperCase();
        });

        if (!cardToUpdate) {
            return NextResponse.json({ error: 'Card not found' }, { status: 404 });
        }

        // Update with new encrypted title
        const encryptedNewTitle = encryptData(newTitle.toUpperCase());
        const { error: updateError } = await supabaseAdmin
            .schema('professional')
            .from('custom_cards')
            .update({ enc_title: encryptedNewTitle })
            .eq('id', cardToUpdate.id);

        if (updateError) throw updateError;

        return NextResponse.json({ success: true, newTitle: newTitle.toUpperCase() });

    } catch (err) {
        console.error('Card Rename Error:', err);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}

// --- POST: Create Custom Card ---
export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('profcaria_session')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        const userId = payload.uid as string;

        const { title } = await req.json();
        if (!title) return NextResponse.json({ error: 'Title required' }, { status: 400 });

        // Use encryption for titles as requested
        const encryptedTitle = encryptData(title.toUpperCase());

        const { error } = await supabaseAdmin
            .schema('professional')
            .from('custom_cards')
            .insert({
                user_id: userId,
                enc_title: encryptedTitle
            });

        if (error) throw error;

        return NextResponse.json({ success: true });

    } catch (err) {
        console.error('Card Save Error:', err);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}

// --- DELETE: Delete Custom Card ---
export async function DELETE(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('profcaria_session')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        const userId = payload.uid as string;

        const { title } = await req.json();
        if (!title) return NextResponse.json({ error: 'Title required' }, { status: 400 });

        const baseCards = ['RESUME', 'CV', 'CERTIFICATES'];
        if (baseCards.includes(title.toUpperCase())) {
            return NextResponse.json({ error: 'Cannot delete base cards' }, { status: 400 });
        }

        // Fetch user's custom cards to find the one to delete
        const { data: cards, error: fetchError } = await supabaseAdmin
            .schema('professional')
            .from('custom_cards')
            .select('id, enc_title')
            .eq('user_id', userId);

        if (fetchError) throw fetchError;

        // Find the card with matching decrypted title
        const cardToDelete = cards?.find((c: { id: string, enc_title: string }) => {
            const decrypted = decryptData(c.enc_title);
            return decrypted === title.toUpperCase();
        });

        if (!cardToDelete) {
            return NextResponse.json({ error: 'Card not found' }, { status: 404 });
        }

        // Delete the card from custom_cards table
        const { error: deleteError } = await supabaseAdmin
            .schema('professional')
            .from('custom_cards')
            .delete()
            .eq('id', cardToDelete.id);

        if (deleteError) throw deleteError;

        // Also delete the associated document content if it exists
        // Documents are stored with encrypted type matching the card title
        const encryptedType = encryptData(title.toUpperCase());
        await supabaseAdmin
            .schema('professional')
            .from('documents')
            .delete()
            .eq('user_id', userId)
            .eq('enc_type', encryptedType);

        return NextResponse.json({ success: true });

    } catch (err) {
        console.error('Card Delete Error:', err);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}
