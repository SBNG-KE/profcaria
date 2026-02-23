import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { supabaseAdmin } from '@/lib/supabase';
import { decryptData } from '@/lib/security';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

/**
 * Public Company Jobs API
 * 
 * Returns all active (open) jobs for a company by slug.
 * No auth required — this is a public endpoint.
 * Optional personalization if the visitor is logged in as a professional.
 * 
 * Query params:
 *   ?category=  — filter by role category
 *   ?location_type= — filter by remote/onsite/hybrid
 *   ?search= — keyword search in title/description
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
    try {
        const { slug } = await params;

        if (!slug) {
            return NextResponse.json({ error: 'Missing slug parameter' }, { status: 400 });
        }

        // --- 1. Find company by slug ---
        const searchPattern = slug.replace(/-/g, ' ');

        let company: any = null;

        // Try exact ilike match first
        const { data: exactMatch } = await supabaseAdmin
            .from('employer.companies')
            .select('id, name, industry, size, website, about, logo, location')
            .ilike('name', searchPattern)
            .single();

        if (exactMatch) {
            company = exactMatch;
        } else {
            // Fallback: slugify all company names and find match
            const { data: companies } = await supabaseAdmin
                .from('employer.companies')
                .select('id, name, industry, size, website, about, logo, location')
                .limit(200);

            company = companies?.find((c: { name: string }) => {
                const companySlug = c.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                return companySlug === slug;
            }) || null;
        }

        if (!company) {
            return NextResponse.json({ error: 'Company not found' }, { status: 404 });
        }

        // --- 2. Fetch active jobs for this company ---
        const { data: jobs, error: jobsError } = await supabaseAdmin
            .schema('employer')
            .from('jobs')
            .select('id, enc_title, enc_description, enc_location, location_type, role_category, role_categories, is_active, created_at')
            .eq('company_id', company.id)
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (jobsError) {
            console.error('Public Jobs Fetch Error:', jobsError);
            return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
        }

        // --- 3. Decrypt and transform jobs ---
        let decryptedJobs = (jobs || []).map((job: any) => ({
            id: job.id,
            title: decryptData(job.enc_title) || 'Untitled Role',
            description: decryptData(job.enc_description) || '',
            location: decryptData(job.enc_location) || '',
            location_type: job.location_type || 'remote',
            role_categories: job.role_categories || (job.role_category ? [job.role_category] : []),
            createdAt: job.created_at,
        }));

        // --- 4. Extract filter options from ALL jobs (before filtering) ---
        const allCategories = new Set<string>();
        const allLocationTypes = new Set<string>();

        decryptedJobs.forEach((job: any) => {
            if (job.location_type) allLocationTypes.add(job.location_type);
            if (job.role_categories) {
                job.role_categories.forEach((cat: string) => allCategories.add(cat));
            }
        });

        // --- 5. Apply filters ---
        const url = new URL(req.url);
        const categoryFilter = url.searchParams.get('category');
        const locationTypeFilter = url.searchParams.get('location_type');
        const searchFilter = url.searchParams.get('search')?.toLowerCase();

        if (categoryFilter) {
            decryptedJobs = decryptedJobs.filter((job: any) =>
                job.role_categories?.includes(categoryFilter)
            );
        }

        if (locationTypeFilter) {
            decryptedJobs = decryptedJobs.filter((job: any) =>
                job.location_type === locationTypeFilter
            );
        }

        if (searchFilter) {
            decryptedJobs = decryptedJobs.filter((job: any) =>
                job.title.toLowerCase().includes(searchFilter) ||
                job.description.toLowerCase().includes(searchFilter) ||
                job.location.toLowerCase().includes(searchFilter)
            );
        }

        // --- 6. Optional: Personalization for logged-in professionals ---
        let isPersonalized = false;


        try {
            const cookieStore = await cookies();
            const token = cookieStore.get('profcaria_session')?.value;

            if (token) {
                const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
                const { payload } = await jwtVerify(token, secretKey);

                if (payload.schema === 'professional' && payload.uid) {
                    // Fetch user preferences from search_index
                    const { data: searchIndex } = await supabaseAdmin
                        .schema('professional')
                        .from('search_index')
                        .select('skills, location')
                        .eq('user_id', payload.uid)
                        .single();

                    if (searchIndex) {
                        isPersonalized = true;

                        // Score jobs by relevance
                        const userSkills = (searchIndex.skills || []).map((s: string) => s.toLowerCase());
                        const userLocation = (searchIndex.location || '').toLowerCase();

                        decryptedJobs = decryptedJobs.map((job: any) => {
                            let score = 0;

                            // Category match
                            const jobCats = (job.role_categories || []).map((c: string) => c.toLowerCase());
                            userSkills.forEach((skill: string) => {
                                if (jobCats.some((cat: string) => cat.includes(skill) || skill.includes(cat))) {
                                    score += 3;
                                }
                                if (job.title.toLowerCase().includes(skill)) {
                                    score += 2;
                                }
                                if (job.description.toLowerCase().includes(skill)) {
                                    score += 1;
                                }
                            });

                            // Location match
                            if (userLocation && job.location.toLowerCase().includes(userLocation)) {
                                score += 2;
                            }

                            return { ...job, relevanceScore: score };
                        });

                        // Sort by relevance (highest first), then by date
                        decryptedJobs.sort((a: any, b: any) => {
                            if (b.relevanceScore !== a.relevanceScore) return b.relevanceScore - a.relevanceScore;
                            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                        });
                    }
                }
            }
        } catch (authErr) {
            // Not logged in or invalid token — that's fine, just skip personalization
        }

        // --- 7. Return response ---
        return NextResponse.json({
            company: {
                id: company.id,
                name: company.name,
                industry: company.industry,
                size: company.size,
                website: company.website,
                about: company.about,
                logo: company.logo,
                location: company.location,

            },
            jobs: decryptedJobs,
            filters: {
                categories: Array.from(allCategories).sort(),
                locationTypes: Array.from(allLocationTypes).sort(),
            },
            totalJobs: decryptedJobs.length,
            isPersonalized,
        });

    } catch (error) {
        console.error('Public Company Jobs API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
