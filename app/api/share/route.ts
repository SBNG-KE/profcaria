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
                    // Get professional's data
                    const { data: profile } = await supabaseAdmin
                        .schema('professional')
                        .from('users')
                        .select('enc_first_name, enc_last_name, short_url')
                        .eq('id', id)
                        .single();

                    if (!profile) {
                        return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
                    }

                    let shortUrl = profile.short_url;
                    if (!shortUrl) {
                        const { decryptData } = await import('@/lib/security');
                        const firstName = decryptData(profile.enc_first_name) || 'user';
                        const lastName = decryptData(profile.enc_last_name) || '';
                        let baseSlug = `${firstName}-${lastName}`.toLowerCase().replace(/\\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                        // ensure it's not empty
                        if (!baseSlug || baseSlug === '-') baseSlug = 'prof';

                        // find a unique slug
                        let uniqueSlug = baseSlug;
                        let counter = 1;
                        while (true) {
                            const { data: existing } = await supabaseAdmin
                                .schema('professional')
                                .from('users')
                                .select('short_url')
                                .eq('short_url', uniqueSlug)
                                .maybeSingle();

                            const { data: existingEmp } = await supabaseAdmin
                                .schema('employer')
                                .from('companies')
                                .select('short_url')
                                .eq('short_url', uniqueSlug)
                                .maybeSingle();

                            if (!existing && !existingEmp) break;
                            uniqueSlug = `${baseSlug}-${counter}`;
                            counter++;
                        }

                        // save it
                        await supabaseAdmin
                            .schema('professional')
                            .from('users')
                            .update({ short_url: uniqueSlug })
                            .eq('id', id);

                        shortUrl = uniqueSlug;
                    }

                    // Direct "site/your name"
                    return NextResponse.json({ link: `${origin}/${shortUrl}` });

                } else if (userType === 'employer') {
                    // Get company data
                    const { data: company } = await supabaseAdmin
                        .schema('employer')
                        .from('companies')
                        .select('enc_company_name, short_url')
                        .eq('id', id)
                        .single();

                    if (!company) {
                        return NextResponse.json({ error: 'Company not found' }, { status: 404 });
                    }

                    let shortUrl = company.short_url;
                    if (!shortUrl) {
                        const { decryptData } = await import('@/lib/security');
                        const companyName = decryptData(company.enc_company_name) || 'company';
                        let baseSlug = companyName.toLowerCase().replace(/\\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                        if (!baseSlug || baseSlug === '-') baseSlug = 'comp';

                        let uniqueSlug = baseSlug;
                        let counter = 1;
                        while (true) {
                            const { data: existing } = await supabaseAdmin
                                .schema('professional')
                                .from('users')
                                .select('short_url')
                                .eq('short_url', uniqueSlug)
                                .maybeSingle();

                            const { data: existingEmp } = await supabaseAdmin
                                .schema('employer')
                                .from('companies')
                                .select('short_url')
                                .eq('short_url', uniqueSlug)
                                .maybeSingle();

                            if (!existing && !existingEmp) break;
                            uniqueSlug = `${baseSlug}-${counter}`;
                            counter++;
                        }

                        // save it
                        await supabaseAdmin
                            .schema('employer')
                            .from('companies')
                            .update({ short_url: uniqueSlug })
                            .eq('id', id);

                        shortUrl = uniqueSlug;
                    }

                    return NextResponse.json({ link: `${origin}/${shortUrl}` });
                } else {
                    return NextResponse.json({ error: 'Invalid userType' }, { status: 400 });
                }
                break;

            default:
                return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
        }

        // Generate short link for jobs, posts (fallback)
        const link = await createShortLink(longLink);

        return NextResponse.json({ link });
    } catch (error) {
        console.error('Unified Share API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
