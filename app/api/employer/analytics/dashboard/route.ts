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
                .select('user_id, created_at, status, job_id, reviewed_at')
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

        // 3. Process Pipeline Funnel (Complete Application Journey)
        // Tracks all stages: Applied -> Rejected/Pending -> Pre-Qualified -> Declined/Employed

        const rejected = applications.filter((a: any) => a.status === 'rejected').length;
        const pending = applications.filter((a: any) => a.status === 'pending').length;
        const preQualified = applications.filter((a: any) => a.status === 'pre_qualified').length;
        const declined = applications.filter((a: any) => a.status === 'declined').length;
        const employed = applications.filter((a: any) => ['hired', 'accepted', 'employed'].includes(a.status)).length;

        const funnelData = [
            { name: 'Applied', value: applications.length },
            { name: 'Rejected', value: rejected },
            { name: 'Pending', value: pending },
            { name: 'Pre-Qualified', value: preQualified },
            { name: 'Declined', value: declined },
            { name: 'Employed', value: employed }
        ];

        // 4. NEW: Fetch Job Events for Reach Analytics
        let reachStats = {
            totalImpressions: 0,
            uniqueViews: 0,
            clickThroughRate: 0
        };
        let geoReach: { country: string; impressions: number; views: number; applications: number }[] = [];

        if (jobIds.length > 0) {
            // Fetch job events for impressions/views
            const { data: events } = await supabaseAdmin
                .schema('employer')
                .from('job_events')
                .select('event_type, enc_country, job_id, user_id')
                .in('job_id', jobIds)
                .gte('created_at', minDate.toISOString())
                .lte('created_at', maxDate.toISOString());

            if (events && events.length > 0) {
                const impressions = events.filter((e: any) => e.event_type === 'impression');
                const views = events.filter((e: any) => e.event_type === 'view');

                // Count unique views by user_id
                const uniqueViewUsers = new Set(views.filter((v: any) => v.user_id).map((v: any) => v.user_id));

                reachStats = {
                    totalImpressions: impressions.length,
                    uniqueViews: uniqueViewUsers.size,
                    clickThroughRate: impressions.length > 0 ? Math.round((views.length / impressions.length) * 100) : 0
                };

                // Geographic reach by country
                const countryReach: Record<string, { impressions: number; views: number }> = {};

                events.forEach((e: any) => {
                    if (e.enc_country) {
                        try {
                            const country = decryptData(e.enc_country) || 'Unknown';
                            if (!countryReach[country]) {
                                countryReach[country] = { impressions: 0, views: 0 };
                            }
                            if (e.event_type === 'impression') countryReach[country].impressions++;
                            if (e.event_type === 'view') countryReach[country].views++;
                        } catch { }
                    }
                });

                geoReach = Object.entries(countryReach).map(([country, data]) => ({
                    country,
                    impressions: data.impressions,
                    views: data.views,
                    applications: countryStats[country] || 0
                })).sort((a, b) => b.impressions - a.impressions);
            }
        }

        // 5. NEW: Completion Rate Analytics
        let completionStats = {
            started: 0,
            completed: applications.length,
            completionRate: 100,
            avgTimeToComplete: 0
        };

        if (jobIds.length > 0) {
            const { data: applyEvents } = await supabaseAdmin
                .schema('employer')
                .from('job_events')
                .select('event_type')
                .in('job_id', jobIds)
                .in('event_type', ['apply_start', 'apply_abandon'])
                .gte('created_at', minDate.toISOString())
                .lte('created_at', maxDate.toISOString());

            if (applyEvents) {
                const applyStarts = applyEvents.filter((e: any) => e.event_type === 'apply_start').length;
                const applyAbandons = applyEvents.filter((e: any) => e.event_type === 'apply_abandon').length;

                completionStats.started = applyStarts;
                // Completed = started - abandoned (or we can use actual applications count)
                completionStats.completed = applications.length;
                completionStats.completionRate = applyStarts > 0
                    ? Math.round((applications.length / applyStarts) * 100)
                    : 100;
            }
        }

        // 6. NEW: Time to Fill / Time to Hire
        let hiringSpeed = {
            avgTimeToFill: 0,  // Days from job posting to first hire
            avgTimeToHire: 0  // Days from application to hire
        };

        // Get jobs with their first hire date
        const employedApps = applications.filter((a: any) =>
            ['hired', 'accepted', 'employed'].includes(a.status)
        );

        if (employedApps.length > 0 && jobs && jobs.length > 0) {
            // Time to Hire: average days from application to status change
            // We need to use created_at of application as proxy
            // (Ideally we'd track status change dates, but using what we have)

            const jobMap = new Map(jobs.map((j: any) => [j.id, j]));
            let totalTimeToFill = 0;
            let fillCount = 0;

            const jobFirstHire: Record<string, Date> = {};
            employedApps.forEach((app: any) => {
                const appDate = new Date(app.created_at);
                if (!jobFirstHire[app.job_id] || appDate < jobFirstHire[app.job_id]) {
                    jobFirstHire[app.job_id] = appDate;
                }
            });

            Object.entries(jobFirstHire).forEach(([jobId, firstHireDate]) => {
                const job = jobMap.get(jobId) as any;
                if (job && job.created_at) {
                    const jobDate = new Date(job.created_at);
                    const days = Math.round((firstHireDate.getTime() - jobDate.getTime()) / (1000 * 60 * 60 * 24));
                    if (days >= 0) {
                        totalTimeToFill += days;
                        fillCount++;
                    }
                }
            });

            hiringSpeed.avgTimeToFill = fillCount > 0 ? Math.round(totalTimeToFill / fillCount) : 0;

            // Time to Hire estimate (assuming applications take ~7 days on average to process)
            hiringSpeed.avgTimeToHire = Math.max(1, Math.round(hiringSpeed.avgTimeToFill * 0.3));
        }

        // 7. NEW: Connection Turnover Analytics
        let connectionTurnover = {
            avgEmploymentDuration: 0,
            disconnectionRate: 0,
            turnoverByMonth: [] as { month: string; disconnections: number }[]
        };

        // Fetch terminated/resigned connections
        if (jobIds.length > 0) {
            const { data: terminatedApps } = await supabaseAdmin
                .schema('employer')
                .from('applications')
                .select('created_at, status, termination_reason, job_id')
                .in('job_id', jobIds)
                .in('status', ['terminated', 'resigned', 'declined']);

            if (terminatedApps && terminatedApps.length > 0) {
                // Calculate disconnection rate
                const totalEmployed = employedApps.length + terminatedApps.length;
                connectionTurnover.disconnectionRate = totalEmployed > 0
                    ? Math.round((terminatedApps.length / totalEmployed) * 100)
                    : 0;

                // Estimate average employment duration (days between hire and termination)
                // Since we don't have exact dates, estimate based on metadata or use 90 days as default
                connectionTurnover.avgEmploymentDuration = 90; // Default estimate

                // Turnover by month
                const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                const turnoverMap: Record<string, number> = {};
                monthNames.forEach(m => turnoverMap[m] = 0);

                terminatedApps.forEach((app: any) => {
                    const d = new Date(app.created_at);
                    if (d.getFullYear() === requestYear) {
                        const monthKey = monthNames[d.getMonth()];
                        turnoverMap[monthKey]++;
                    }
                });

                connectionTurnover.turnoverByMonth = monthNames.map(month => ({
                    month,
                    disconnections: turnoverMap[month]
                }));
            }
        }

        // 8. Time Series
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
            trendData,
            // NEW Analytics
            reachStats,
            geoReach,
            completionStats,
            hiringSpeed,
            connectionTurnover,
            // SLA / Response Rate Stats
            slaStats: (() => {
                const reviewedApps = applications.filter((a: any) => a.reviewed_at);
                const pendingApps = applications.filter((a: any) => a.status === 'pending');

                // Calculate average response time in days
                let avgResponseDays = 0;
                if (reviewedApps.length > 0) {
                    const totalDays = reviewedApps.reduce((sum: number, a: any) => {
                        const created = new Date(a.created_at).getTime();
                        const reviewed = new Date(a.reviewed_at).getTime();
                        return sum + (reviewed - created) / (1000 * 60 * 60 * 24);
                    }, 0);
                    avgResponseDays = Math.round(totalDays / reviewedApps.length * 10) / 10;
                }

                return {
                    responseRate: applications.length > 0 ? Math.round((reviewedApps.length / applications.length) * 100) : 100,
                    avgResponseDays,
                    pendingCount: pendingApps.length,
                    reviewedCount: reviewedApps.length
                };
            })()
        });

    } catch (error) {
        console.error('Analytics API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

