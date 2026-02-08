import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';

/**
 * Public Employer/Company Profile API
 * 
 * Fetches public company information by slug (company name converted to URL-friendly format)
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
    try {
        const { slug } = await params;

        if (!slug) {
            return NextResponse.json({ error: 'Missing slug parameter' }, { status: 400 });
        }

        // Convert slug back to searchable format
        // Slugs are lowercase with hyphens replacing spaces
        const searchPattern = slug.replace(/-/g, ' ');

        // First try exact match with slug format
        let { data: company } = await supabaseAdmin
            .from('employer.companies')
            .select(`
                id,
                name,
                industry,
                size,
                website,
                email,
                about,
                logo,
                location,
                created_at
            `)
            .ilike('name', searchPattern)
            .single();

        // If not found, try a more flexible search
        if (!company) {
            const { data: companies } = await supabaseAdmin
                .from('employer.companies')
                .select(`
                    id,
                    name,
                    industry,
                    size,
                    website,
                    email,
                    about,
                    logo,
                    location,
                    created_at
                `)
                .limit(10);

            // Find company where slug matches the slugified name
            company = companies?.find((c: { name: string }) => {
                const companySlug = c.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                return companySlug === slug;
            }) || null;
        }

        if (!company) {
            return NextResponse.json({ error: 'Company not found' }, { status: 404 });
        }

        // Return sanitized public data
        return NextResponse.json({
            company: {
                id: company.id,
                name: company.name,
                industry: company.industry,
                size: company.size,
                website: company.website,
                email: company.email,
                about: company.about,
                logo: company.logo,
                location: company.location,
                joinedDate: company.created_at
            }
        });
    } catch (error) {
        console.error('Public Employer API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
