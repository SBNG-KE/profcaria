import { createHash } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';
import { decryptData } from '@/lib/security';
import { getProfcariaSession } from '@/lib/profcaria-auth';

export async function getCompanyPaymentContext(requestedOrganizationId?: string | null) {
  const session = await getProfcariaSession();
  if (!session) return null;

  let membershipQuery = supabaseAdmin.schema('profcaria').from('organization_members')
    .select('organization_id, role').eq('user_id', session.uid).eq('status', 'active').in('role', ['owner', 'admin']);
  if (requestedOrganizationId) membershipQuery = membershipQuery.eq('organization_id', requestedOrganizationId);
  const { data: membership, error: membershipError } = await membershipQuery.order('joined_at').limit(1).maybeSingle();
  if (membershipError) throw new Error('Company billing access could not be checked.');
  if (!membership) return null;

  const { data: account, error: accountError } = await supabaseAdmin.schema('profcaria').from('accounts')
    .select('enc_email').eq('id', session.uid).maybeSingle();
  if (accountError) throw new Error('The billing contact could not be loaded.');
  const email = decryptData(account?.enc_email)?.trim().toLowerCase() || session.email?.trim().toLowerCase();
  if (!email) throw new Error('A verified company email is required before payment.');

  return {
    userId: session.uid,
    organizationId: membership.organization_id,
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
