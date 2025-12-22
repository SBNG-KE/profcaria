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
        const body = await request.json();
        const { professionalId, jobId, contractUrl, contractValue } = body;

        // Check if there is already an active contract for this pair
        const { data: existingContract } = await supabase
            .from('contracts')
            .select('*')
            .eq('employer_id', user.id)
            .eq('professional_id', professionalId)
            .eq('job_id', jobId)
            .eq('status', 'active')
            .single();

        if (existingContract) {
            // Versioning Logic: Move current URL to previous, update current
            const { error: updateError } = await supabase
                .from('contracts')
                .update({
                    previous_contract_url: existingContract.contract_url,
                    contract_url: contractUrl,
                    contract_value: contractValue, // Update value if changed
                    updated_at: new Date().toISOString()
                })
                .eq('id', existingContract.id);

            if (updateError) throw updateError;
        } else {
            // Create new contract
            const { error: insertError } = await supabase
                .from('contracts')
                .insert({
                    employer_id: user.id,
                    professional_id: professionalId,
                    job_id: jobId,
                    contract_url: contractUrl,
                    contract_value: contractValue,
                    status: 'active'
                });

            if (insertError) throw insertError;
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Error creating/updating contract:", error);
        return NextResponse.json({ error: 'Failed to save contract' }, { status: 500 });
    }
}

export async function GET(request: Request) {
    const supabase = await createServerClient(await cookies());
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: contracts, error } = await supabase
        .from('contracts')
        .select(`
            *,
            profiles!professional_id (first_name, last_name, email),
            jobs (title)
        `)
        .eq('employer_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ contracts });
}
