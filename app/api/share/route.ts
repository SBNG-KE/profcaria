import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { supabaseAdmin } from '@/lib/supabase';
import { createShortLink } from '@/lib/shortener';
import {
    getJobShareLink,
    getPostShareLink,
    getProfessionalProfileShareLink,
    getEmployerProfileShareLink
} from '@/lib/sharing';

export const runtime = 'nodejs';

/**
 * Unified Share API
 * 
 * Generates short, clean share links for any shareable content.
 * 
 * Query Parameters:
 * - type: 'post' | 'job' | 'profile'
 * - id: The ID of the resource to share
 * - userType: 'professional' | 'employer' (required when type='profile')
 */
export async function GET(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('profcaria_session')?.value;
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Authenticate user
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        await jwtVerify(token, secret);

        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type');
        const id = searchParams.get('id');
        const userType = searchParams.get('userType');

        if (!type || !id) {
            return NextResponse.json({ error: 'Missing type or id parameter' }, { status: 400 });
        }

        const origin = new URL(req.url).origin;
        let longLink: string;

        switch (type) {
            case 'post':
                longLink = getPostShareLink(id, origin);
                break;

            case 'job':
                longLink = getJobShareLink(id, origin);
                break;

            case 'profile':
                if (!userType) {
                    return NextResponse.json({ error: 'Missing userType parameter for profile share' }, { status: 400 });
                }

                if (userType === 'professional') {
                    // Get professional's username/slug
                    const { data: profile } = await supabaseAdmin
                        .from('professional.profiles')
                        .select('first_name, last_name')
                        .eq('id', id)
                        .single();

                    if (!profile) {
                        return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
                    }

                    // Create slug from name (firstname-lastname)
                    const slug = `${profile.first_name}-${profile.last_name}`.toLowerCase().replace(/\s+/g, '-');
                    longLink = getProfessionalProfileShareLink(slug, origin);
                } else if (userType === 'employer') {
                    // Get company slug
                    const { data: company } = await supabaseAdmin
                        .from('employer.companies')
                        .select('name')
                        .eq('id', id)
                        .single();

                    if (!company) {
                        return NextResponse.json({ error: 'Company not found' }, { status: 404 });
                    }

                    // Create slug from company name
                    const slug = company.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                    longLink = getEmployerProfileShareLink(slug, origin);
                } else {
                    return NextResponse.json({ error: 'Invalid userType' }, { status: 400 });
                }
                break;

            default:
                return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
        }

        // Generate short link
        const link = await createShortLink(longLink);

        return NextResponse.json({ link });
    } catch (error) {
        console.error('Unified Share API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
