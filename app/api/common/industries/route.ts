import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'edge';

export async function GET() {
    try {
        const { data, error } = await supabaseAdmin
            .schema('public')
            .from('industries')
            .select('name, category')
            .order('name');

        if (error) throw error;

        return NextResponse.json({ industries: data });
    } catch (error) {
        console.error('Error fetching industries:', error);
        return NextResponse.json({ error: 'Failed to fetch industries' }, { status: 500 });
    }
}
