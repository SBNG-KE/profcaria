import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { decryptData } from '@/lib/security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('profcaria_session')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        let auth;
        try {
            const { payload } = await jwtVerify(token, secret);
            auth = payload;
        } catch {
            return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
        }

        if (auth.schema !== 'employer') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const employerId = auth.uid;

        // 1. Fetch Key Stats
        // A. Total Jobs (Active vs Closed)
        const { data: jobs } = await supabaseAdmin
            .schema('employer')
            .from('jobs')
            .select('id, enc_title, is_active, created_at, enc_location, location_type')
            .eq('company_id', employerId);

        console.log(`[Analytics API] Employer: ${employerId}, Jobs Found: ${jobs?.length || 0}`);

        const totalJobs = jobs?.length || 0;
        const activeJobs = jobs?.filter((j: any) => j.is_active).length || 0;

        // B. Applications (Traffic & Geography)
        // Fetch last 500 applications across all my jobs
        const jobIds = jobs?.map((j: any) => j.id) || [];
        let applications: any[] = [];
        let professionals: any[] = [];

        if (jobIds.length > 0) {
            const { data: apps } = await supabaseAdmin
                .schema('employer')
                .from('applications')
                .select('user_id, created_at, status, job_id')
                .in('job_id', jobIds)
                .order('created_at', { ascending: false })
                .limit(500);

            applications = apps || [];

            // Fetch location data for these professionals to build the heatmap
            const profIds = applications.map((a: any) => a.user_id);
            if (profIds.length > 0) {
                const { data: profs } = await supabaseAdmin
                    .schema('professional')
                    .from('activity_logs')
                    .select('user_id, enc_location_details')
                    .in('user_id', profIds)
                    .neq('enc_location_details', null);
                professionals = profs || [];
            }
        }

        // 2. Process Geographical "War Room" Data
        const countryStats: Record<string, number> = {};
        const locationDetails: { lat: number, lng: number, city: string, count: number }[] = []; // Mock lat/lng for now or derive

        // Map user_id to their location
        const userLocationMap: Record<string, string> = {};

        professionals.forEach((p: any) => {
            if (userLocationMap[p.user_id]) return; // Only process once per user
            try {
                const plain = decryptData(p.enc_location_details);
                if (plain) {
                    let country = '';
                    if (plain.trim().startsWith('{')) {
                        const parsed = JSON.parse(plain);
                        country = parsed.country || 'Unknown';
                    } else {
                        country = plain.split(',').pop()?.trim() || 'Unknown';
                    }

                    userLocationMap[p.user_id] = country;
                    countryStats[country] = (countryStats[country] || 0) + 1;
                }
            } catch { }
        });

        // 3. Process Pipeline Funnel (Real Data Only)
        // We track: Applied -> Pre-Qualified -> Employed (Hired)

        const preQualified = applications.filter((a: any) => ['pre_qualified', 'shortlisted', 'interview'].includes(a.status)).length;
        const employed = applications.filter((a: any) => ['hired', 'accepted', 'employed'].includes(a.status)).length;

        const funnelData = [
            { name: 'Applied', value: applications.length },
            { name: 'Pre-Qualified', value: preQualified },
            { name: 'Employed', value: employed }
        ];

        // 4. Time Series (Last 7 Days Applications)
        const last7Days: Record<string, number> = {};
        // Initialize last 7 days keys
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = d.toISOString().split('T')[0];
            last7Days[key] = 0;
        }

        applications.forEach((app: any) => {
            const dateKey = new Date(app.created_at).toISOString().split('T')[0];
            if (last7Days[dateKey] !== undefined) {
                last7Days[dateKey]++;
            }
        });

        const trendData = Object.keys(last7Days).map(key => ({
            date: key.slice(5), // MM-DD
            count: last7Days[key]
        }));


        return NextResponse.json({
            stats: {
                totalJobs,
                activeJobs,
                totalApplications: applications.length,
                totalApplications: applications.length,
                interviewRate: applications.length > 0 ? Math.round((employed / applications.length) * 100) : 0
            },
            geoHeatmap: Object.entries(countryStats)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value),
            funnelData,
            trendData
        });

    } catch (error) {
        console.error('Analytics API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
