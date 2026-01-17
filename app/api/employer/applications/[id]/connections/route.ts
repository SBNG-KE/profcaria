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
            .select('id, status, created_at, updated_at, jobs(company_id)')
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

        // Group connections by company with date info
        const companyConnectionMap = new Map<string, { companyId: string; startDate: string; endDate: string | null; status: string }>();

        connections.forEach((conn: any) => {
            const companyId = conn.jobs?.company_id;
            if (!companyId) return;

            // Use earliest date as start, latest as end
            if (!companyConnectionMap.has(companyId)) {
                companyConnectionMap.set(companyId, {
                    companyId,
                    startDate: conn.created_at,
                    endDate: conn.status === 'employed' || conn.status === 'hired' ? null : conn.updated_at,
                    status: conn.status
                });
            } else {
                const existing = companyConnectionMap.get(companyId)!;
                // Update start date to earliest
                if (new Date(conn.created_at) < new Date(existing.startDate)) {
                    existing.startDate = conn.created_at;
                }
                // Update end date to latest, or null if still employed
                if (conn.status === 'employed' || conn.status === 'hired') {
                    existing.endDate = null;
                    existing.status = conn.status;
                } else if (existing.endDate && new Date(conn.updated_at) > new Date(existing.endDate)) {
                    existing.endDate = conn.updated_at;
                }
            }
        });

        const companyIds = [...companyConnectionMap.keys()];

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

        // Build connection list with dates
        const uniqueConnections = (companies || [])
            .map((company: any) => {
                const connInfo = companyConnectionMap.get(company.id);
                return {
                    id: company.id,
                    company: {
                        name: company.enc_company_name ? decryptData(company.enc_company_name) : 'Unknown Company',
                        logoUrl: company.enc_logo_url ? decryptData(company.enc_logo_url) : null
                    },
                    startDate: connInfo?.startDate || null,
                    endDate: connInfo?.endDate || null,
                    isCurrentlyEmployed: connInfo?.status === 'employed' || connInfo?.status === 'hired'
                };
            });

        return NextResponse.json({ connections: uniqueConnections });

    } catch (error) {
        console.error('Connections API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
