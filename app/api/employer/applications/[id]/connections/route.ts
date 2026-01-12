/**
 * API Route: Get user connections (previous employments)
 * Uses existing applications with connection statuses
 * Returns only company name and logo for privacy
 */

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { decryptData } from '@/lib/security';

export const runtime = 'nodejs';

interface Params {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/employer/applications/[id]/connections
 * Returns the professional's previous employment connections (company name + logo only)
 */
export async function GET(req: Request, { params }: Params) {
    try {
        const { id } = await params;

        // Get the application to find the user_id
        const { data: application, error: appError } = await supabaseAdmin
            .schema('employer')
            .from('applications')
            .select('user_id')
            .eq('id', id)
            .single();

        if (appError || !application) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 });
        }

        // Get all connection applications for this user
        // Connections are: hired, employed, or terminated (resigned/mutual/involuntary)
        const { data: connections, error: connError } = await supabaseAdmin
            .schema('employer')
            .from('applications')
            .select('id, jobs(company_id)')
            .eq('user_id', application.user_id)
            .in('status', ['hired', 'employed', 'resigned', 'terminated'])
            .order('created_at', { ascending: false });

        if (connError) {
            console.error('Error fetching connections:', connError);
            return NextResponse.json({ error: 'Failed to fetch connections' }, { status: 500 });
        }

        if (!connections || connections.length === 0) {
            return NextResponse.json({ connections: [] });
        }

        // Get unique company IDs
        const companyIds = [...new Set(connections.map((c: any) => c.jobs?.company_id).filter(Boolean))];

        if (companyIds.length === 0) {
            return NextResponse.json({ connections: [] });
        }

        // Get company details
        const { data: companies, error: compError } = await supabaseAdmin
            .schema('employer')
            .from('companies')
            .select('id, enc_company_name, enc_logo_url')
            .in('id', companyIds);

        if (compError) {
            console.error('Error fetching companies:', compError);
            return NextResponse.json({ connections: [] });
        }

        // Build unique company list (deduplicated)
        const seenCompanies = new Set<string>();
        const uniqueConnections = (companies || [])
            .filter((company: any) => {
                if (seenCompanies.has(company.id)) return false;
                seenCompanies.add(company.id);
                return true;
            })
            .map((company: any) => ({
                id: company.id,
                company: {
                    name: company.enc_company_name ? decryptData(company.enc_company_name) : 'Unknown Company',
                    logoUrl: company.enc_logo_url ? decryptData(company.enc_logo_url) : null
                }
            }));

        return NextResponse.json({ connections: uniqueConnections });

    } catch (error) {
        console.error('Connections API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
