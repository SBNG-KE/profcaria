import { createHash } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';
import { decryptData } from '@/lib/security';
import { getProfcariaSession } from '@/lib/profcaria-auth';

export async function getCompanyPaymentContext() {
  const session = await getProfcariaSession();
  if (!session || session.schema !== 'employer') return null;

  const { data: company, error } = await supabaseAdmin.schema('employer').from('companies')
    .select('enc_company_name,enc_work_email').eq('id', session.uid).maybeSingle();
  if (error || !company) throw new Error('Company account could not be loaded.');

  const email = decryptData(company.enc_work_email)?.trim().toLowerCase() || session.email?.trim().toLowerCase();
  const companyName = decryptData(company.enc_company_name)?.trim() || 'Company workspace';
  if (!email) throw new Error('A verified company email is required before payment.');

  const { error: organizationError } = await supabaseAdmin.schema('profcaria').from('organizations').upsert({
    id: session.uid,
    legacy_company_id: session.uid,
    name: companyName,
    created_by: session.uid,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'id' });
  if (organizationError) throw new Error('Company wallet is not ready. Apply the Profcaria database migrations first.');

  const { error: membershipError } = await supabaseAdmin.schema('profcaria').from('organization_members').upsert({
    organization_id: session.uid,
    user_id: session.uid,
    account_type: 'employer',
    role: 'owner',
    status: 'active',
    joined_at: new Date().toISOString(),
    ended_at: null,
  }, { onConflict: 'organization_id,user_id' });
  if (membershipError) throw new Error('Company owner access could not be prepared.');

  return {
    userId: session.uid,
    organizationId: session.uid,
    email,
    emailHash: createHash('sha256').update(email).digest('hex'),
  };
}

export async function finalizeVerifiedTopup(data: {
  reference: string;
  id: number;
  status: string;
  amount: number;
  currency: string;
  channel?: string;
  paid_at?: string | null;
  fees?: number | null;
}) {
  const { data: credited, error } = await supabaseAdmin.schema('profcaria').rpc('finalize_paystack_wallet_topup', {
    p_reference: data.reference,
    p_provider_transaction_id: data.id,
    p_amount_subunit: data.amount,
    p_currency: data.currency,
    p_channel: data.channel || 'unknown',
    p_paid_at: data.paid_at || new Date().toISOString(),
    p_provider_summary: { status: data.status, channel: data.channel || null, fees_subunit: data.fees || null },
  });
  if (error) throw new Error(error.message);
  return Boolean(credited);
}
