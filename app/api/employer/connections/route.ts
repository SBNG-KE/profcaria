import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    const supabase = await createServerClient(await cookies());
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { applicationId } = await request.json();

        // 1. Get Application Details
        const { data: application, error: appError } = await supabase
            .from('applications')
            .select('professional_id, job_id, status')
            .eq('id', applicationId)
            .single();

        if (appError || !application) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 });
        }

        // 2. Insert into Connections (if not exists)
        // Assuming 'connections' table exists with employer_id, professional_id, status
        const { error: connectError } = await supabase
            .from('connections')
            .upsert({
                employer_id: user.id,
                professional_id: application.professional_id,
                status: 'connected',
                created_at: new Date().toISOString()
            });

        if (connectError) throw connectError;

        // 3. Update Application Status to 'hired' or 'connected'
        const { error: updateError } = await supabase
            .from('applications')
            .update({ status: 'hired' })
            .eq('id', applicationId);

        if (updateError) throw updateError;

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Connection error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
