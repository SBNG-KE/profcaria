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


        const { searchParams } = new URL(req.url);
        const range = searchParams.get('range'); // '7d' or null
        const yearParam = searchParams.get('year');
        const monthParam = searchParams.get('month');

        // Check Plan Limits for Analytics
        const { plan } = await import('@/lib/billing').then(m => m.getCompanyPlan(employerId as string));
        const historyYears = plan.limits.analyticsHistoryYears || 1;

        let minDate: Date;
        let maxDate: Date = new Date(); // Default end is now

        const currentYear = new Date().getFullYear();
        const requestYear = yearParam ? parseInt(yearParam) : currentYear;

        // Verify Plan Access for Historical Years
        if (currentYear - requestYear >= historyYears) {
            return NextResponse.json({ error: 'Plan upgrade required for historical data' }, { status: 403 });
        }

        const is7Days = range === '7d' || !yearParam; // Default to 7d if no year specified? Or default to 7d if range=7d. 
        // User asked for "Year Filter showing current year". 
        // Let's say: if range='7d' -> 7 days. If range is empty/null, check year. If year empty, default to 7d.

        if (is7Days && range === '7d') {
            minDate = new Date();
            minDate.setDate(minDate.getDate() - 7);
        } else {
            // Custom Year/Month
            minDate = new Date(requestYear, 0, 1); // Jan 1st
            maxDate = new Date(requestYear, 11, 31, 23, 59, 59); // Dec 31st

            if (monthParam && monthParam !== 'all') {
                const m = parseInt(monthParam);
                if (!isNaN(m) && m >= 1 && m <= 12) {
                    minDate = new Date(requestYear, m - 1, 1);
                    maxDate = new Date(requestYear, m, 0, 23, 59, 59);
                }
            }
        }

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
                .in('job_id', jobIds)
                .in('job_id', jobIds)
                .gte('created_at', minDate.toISOString())
                .lte('created_at', maxDate.toISOString())
                .order('created_at', { ascending: false })
                .limit(2000);

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
                    let country = 'Unknown';

                    if (plain.trim().startsWith('{')) {
                        try {
                            const parsed = JSON.parse(plain);
                            // Prioritize country, then city if country missing
                            country = parsed.country || parsed.city || 'Unknown';
                        } catch (e) {
                            // If JSON parse fails, treat as string
                            country = plain.split(',').pop()?.trim() || 'Unknown';
                        }
                    } else {
                        // Legacy string format: "City, Country" or just "Address"
                        const parts = plain.split(',');
                        if (parts.length > 1) {
                            country = parts.pop()?.trim() || 'Unknown';
                        } else {
                            country = plain.trim() || 'Unknown';
                        }
                    }

                    // Clean up country name if needed (e.g. remove trailing periods)
                    country = country.replace(/\.$/, '');

                    if (country && country !== 'null' && country !== 'undefined') {
                        userLocationMap[p.user_id] = country;
                        countryStats[country] = (countryStats[country] || 0) + 1;
                    }
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

        // 4. Time Series
        const trendMap: Record<string, number> = {};

        // Strategy: 
        // If 7 Days -> Daily buckets (Date String)
        // If Month Selected -> Daily buckets (Date String)
        // If Year Selected (All Months) -> Monthly buckets (Jan, Feb...)

        const isMonthlyView = !is7Days && (!monthParam || monthParam === 'all'); // Year view = Monthly buckets

        if (is7Days) {
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const key = d.toISOString().split('T')[0].slice(5); // MM-DD
                trendMap[key] = 0;
            }
        } else if (monthParam && monthParam !== 'all') {
            // Specific Month -> Daily buckets
            const start = new Date(minDate);
            const end = new Date(maxDate);
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                const key = d.toISOString().split('T')[0].slice(5); // MM-DD
                trendMap[key] = 0;
            }
        } else {
            // Yearly View -> Monthly buckets
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            monthNames.forEach(m => trendMap[m] = 0);
        }

        applications.forEach((app: any) => {
            const d = new Date(app.created_at);
            let key = '';

            if (isMonthlyView) {
                // Year View -> Monthly Names
                const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                key = monthNames[d.getMonth()];
            } else {
                // Daily View
                key = d.toISOString().split('T')[0].slice(5);
            }

            if (trendMap[key] !== undefined) trendMap[key]++;
        });

        const trendData = Object.keys(trendMap).map(key => ({
            date: key,
            count: trendMap[key]
        }));


        return NextResponse.json({
            stats: {
                totalJobs,
                activeJobs,
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
