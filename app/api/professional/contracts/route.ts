import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
    const supabase = await createServerClient(await cookies());
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch contracts where professional_id matches current user
    const { data: contracts, error } = await supabase
        .from('contracts')
        .select(`
            id,
            contract_url,
            previous_contract_url,
            contract_value,
            status,
            created_at,
            jobs (
                title,
                employer: profiles!employer_id (
                    company_name,
                    first_name,
                    last_name
                )
            )
        `)
        .eq('professional_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching professional contracts:", error);
        return NextResponse.json({ error: 'Failed to fetch contracts' }, { status: 500 });
    }

    // Format for frontend
    const formattedContracts = contracts.map((c: any) => ({
        id: c.id,
        jobTitle: c.jobs?.title || 'Unknown Role',
        employerName: c.jobs?.employer?.company_name || `${c.jobs?.employer?.first_name} ${c.jobs?.employer?.last_name}`,
        status: c.status,
        contractUrl: c.contract_url,
        previousContractUrl: c.previous_contract_url,
        createdAt: c.created_at,
        value: c.contract_value
    }));

    return NextResponse.json({ contracts: formattedContracts });
}
