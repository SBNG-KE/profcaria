import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import { NextResponse } from 'next/server';
import { validateJobCategory } from '@/lib/ai-moderation';

export async function GET(request: Request) {
    // supabaseAdmin has full access, fine for public category list
    const supabase = supabaseAdmin;

    try {
        const { data, error } = await supabase
            .from('role_categories')
            .select('*')
            .order('label', { ascending: true });

        if (error) throw error;

        return NextResponse.json({ categories: data });
    } catch (error) {
        console.error('Error fetching categories:', error);
        return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const supabase = supabaseAdmin;

    try {
        const { label } = await request.json();

        if (!label || label.trim().length < 3) {
            return NextResponse.json({ error: 'Category name must be at least 3 characters' }, { status: 400 });
        }

        if (label.length > 50) {
            return NextResponse.json({ error: 'Category name is too long' }, { status: 400 });
        }

        // Check Custom Auth
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. AI Moderation Check
        const aiCheck = await validateJobCategory(label);
        if (!aiCheck.valid) {
            return NextResponse.json({ error: aiCheck.reason || 'Invalid category' }, { status: 400 });
        }

        // Generate a slug from the label
        const slug = label
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
            .replace(/^-+|-+$/g, '');   // Trim hyphens

        // Check if exists
        const { data: existing } = await supabase
            .from('role_categories')
            .select('slug')
            .eq('slug', slug)
            .single();

        if (existing) {
            return NextResponse.json({ category: existing, message: 'Category already exists' });
        }

        const { data, error } = await supabase
            .from('role_categories')
            .insert({
                slug,
                label: label.trim(),
                keywords: [label.toLowerCase()],
                is_custom: true
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ category: data });

    } catch (error) {
        console.error('Error creating category:', error);
        return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
    }
}

