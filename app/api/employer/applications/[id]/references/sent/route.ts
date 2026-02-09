import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import { decryptData } from '@/lib/security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/employer/applications/[id]/references/sent
 * 
 * Get all reference requests that were sent for a specific application
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (user.schema !== 'employer') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id: applicationId } = await params;

        // Verify the application belongs to this company
        const { data: application, error: appError } = await supabaseAdmin
            .schema('employer')
            .from('applications')
            .select('*, jobs(company_id)')
            .eq('id', applicationId)
            .single();

        if (appError || !application) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 });
        }

        if (application.jobs?.company_id !== user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Get all reference requests for this application
        const { data: requests, error } = await supabaseAdmin
            .schema('employer')
            .from('reference_requests')
            .select('*')
            .eq('requesting_application_id', applicationId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Enrich with company names
        const enrichedRequests = await Promise.all((requests || []).map(async (req: any) => {
            const { data: targetCompany } = await supabaseAdmin
                .schema('employer')
                .from('companies')
                .select('enc_company_name')
                .eq('id', req.target_company_id)
                .single();

            return {
                id: req.id,
                targetCompanyId: req.target_company_id,
                targetCompanyName: targetCompany ? decryptData(targetCompany.enc_company_name) : 'Unknown Company',
                status: req.status,
                createdAt: req.created_at,
                respondedAt: req.responded_at
            };
        }));

        return NextResponse.json({ sentRequests: enrichedRequests });

    } catch (error: any) {
        console.error('Sent References API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
