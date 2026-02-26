import { redirect, notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import { Metadata } from 'next';
import { decryptData } from '@/lib/security';

export const revalidate = 60; // Cache for 60 seconds (ISR)

type Props = {
    params: Promise<{ short_url: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { short_url } = await params;

    // Query professional first
    const { data: prof } = await supabaseAdmin
        .schema('professional')
        .from('users')
        .select('enc_first_name, enc_last_name, enc_current_role')
        .eq('short_url', short_url)
        .maybeSingle();

    if (prof) {
        const first = decryptData(prof.enc_first_name) || '';
        const last = decryptData(prof.enc_last_name) || '';
        return {
            title: `${first} ${last} | Profcaria Profile`,
            description: decryptData(prof.enc_current_role) || 'Professional Profile on Profcaria'
        }
    }

    // Query employer
    const { data: comp } = await supabaseAdmin
        .schema('employer')
        .from('companies')
        .select('enc_company_name, industry')
        .eq('short_url', short_url)
        .maybeSingle();

    if (comp) {
        const name = decryptData(comp.enc_company_name) || '';
        return {
            title: `${name} | Profcaria`,
            description: comp.industry || 'Company Profile on Profcaria'
        }
    }

    return {
        title: 'Profile | Profcaria'
    }
}

export default async function ShortUrlPublicProfile({ params }: Props) {
    const { short_url } = await params;

    if (!short_url) {
        return notFound();
    }

    // ======== 1. Check if it's a Professional ========
    const { data: profUser, error: profError } = await supabaseAdmin
        .schema('professional')
        .from('users')
        .select('id')
        .eq('short_url', short_url)
        .maybeSingle();

    if (profUser && profUser.id && !profError) {
        redirect(`/public/people/${profUser.id}?source=short`);
    }

    // ======== 2. Check if it's an Employer ========
    const { data: compUser, error: compError } = await supabaseAdmin
        .schema('employer')
        .from('companies')
        .select('id')
        .eq('short_url', short_url)
        .maybeSingle();

    if (compUser && compUser.id && !compError) {
        redirect(`/public/companies/${compUser.id}?source=short`);
    }

    // Default Not Found
    return notFound();
}
