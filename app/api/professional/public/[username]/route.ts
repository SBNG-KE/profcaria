import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = 'nodejs';

/**
 * Public Professional Profile API
 * 
 * Fetches public profile information by username slug (firstname-lastname format)
 */
export async function GET(
    request: NextRequest,
    props: { params: Promise<{ username: string }> }
) {
    try {
        const params = await props.params;
        const username = params.username;

        if (!username) {
            return NextResponse.json({ error: 'Missing username parameter' }, { status: 400 });
        }

        // Parse the slug - expected format is firstname-lastname
        const parts = username.toLowerCase().split('-');

        if (parts.length < 2) {
            return NextResponse.json({ error: 'Invalid username format' }, { status: 400 });
        }

        // Try to find by first name and last name pattern
        const firstName = parts[0];
        const lastName = parts.slice(1).join(' '); // Handle multi-part last names

        // Search for matching profile
        let { data: profiles } = await supabaseAdmin
            .from('professional.profiles')
            .select(`
                id,
                first_name,
                last_name,
                profile_image_url,
                role,
                about,
                country,
                city,
                website,
                created_at,
                badge_type
            `)
            .ilike('first_name', firstName)
            .ilike('last_name', lastName.replace(/\s+/g, '%'));

        // Find exact match
        let profile = profiles?.find((p: { first_name: string; last_name: string }) => {
            const slug = `${p.first_name}-${p.last_name}`.toLowerCase().replace(/\s+/g, '-');
            return slug === username.toLowerCase();
        });

        // If not found via name match, try all profiles and match slug
        if (!profile) {
            const { data: allProfiles } = await supabaseAdmin
                .from('professional.profiles')
                .select(`
                    id,
                    first_name,
                    last_name,
                    profile_image_url,
                    role,
                    about,
                    country,
                    city,
                    website,
                    created_at,
                    badge_type
                `)
                .limit(100);

            profile = allProfiles?.find((p: { first_name: string; last_name: string }) => {
                const slug = `${p.first_name}-${p.last_name}`.toLowerCase().replace(/\s+/g, '-');
                return slug === username.toLowerCase();
            });
        }

        if (!profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        // Fetch additional data: experience, education
        const [experienceRes, educationRes] = await Promise.all([
            supabaseAdmin
                .from('professional.employment_history')
                .select('job_title, company_name, start_date, end_date, is_current, description')
                .eq('professional_id', profile.id)
                .order('start_date', { ascending: false })
                .limit(5),
            supabaseAdmin
                .from('professional.education')
                .select('institution, degree, field_of_study, start_year, end_year')
                .eq('professional_id', profile.id)
                .order('end_year', { ascending: false })
                .limit(5)
        ]);

        const experience = experienceRes.data?.map((exp: { job_title: string; company_name: string; start_date: string; end_date: string | null; is_current: boolean; description: string | null }) => ({
            title: exp.job_title,
            company: exp.company_name,
            dateRange: exp.is_current
                ? `${new Date(exp.start_date).getFullYear()} - Present`
                : `${new Date(exp.start_date).getFullYear()} - ${exp.end_date ? new Date(exp.end_date).getFullYear() : 'Present'}`,
            description: exp.description
        })) || [];

        const education = educationRes.data?.map((edu: { institution: string; degree: string | null; field_of_study: string | null; start_year: number | null; end_year: number | null }) => ({
            institution: edu.institution,
            degree: edu.degree,
            field: edu.field_of_study,
            years: `${edu.start_year || ''} - ${edu.end_year || ''}`
        })) || [];

        // Return sanitized public data
        return NextResponse.json({
            profile: {
                id: profile.id,
                firstName: profile.first_name,
                lastName: profile.last_name,
                profileImage: profile.profile_image_url,
                headline: profile.role,
                about: profile.about,
                location: [profile.city, profile.country].filter(Boolean).join(', '),
                website: profile.website,
                experience,
                education,
                createdAt: profile.created_at,
                badgeType: profile.badge_type
            }
        });
    } catch (error) {
        console.error('Public Professional API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
