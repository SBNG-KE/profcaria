import { supabaseAdmin } from '@/lib/supabase';
import { encryptData } from '@/lib/security';

type LegacyIdentity = 'professional' | 'employer';

export async function ensureOndwiraAccount(input: {
  id: string;
  identityType: LegacyIdentity;
  emailIndex: string;
  encryptedEmail?: string | null;
  displayName?: string | null;
  authUserId?: string | null;
  security?: {
    requires2fa?: boolean;
    hasPasskey?: boolean;
    hasTotp?: boolean;
    hasEmailOtp?: boolean;
    defaultMethod?: string | null;
  };
}) {
  const now = new Date().toISOString();
  const account = {
    id: input.id,
    email_index: input.emailIndex,
    enc_email: input.encryptedEmail || null,
    enc_display_name: input.displayName ? encryptData(input.displayName) : undefined,
    auth_user_id: input.authUserId || undefined,
    status: 'active',
    updated_at: now,
    last_login_at: now,
  };
  const { error: accountError } = await supabaseAdmin.schema('ondwira').from('accounts').upsert(account, { onConflict: 'id' });
  if (accountError) throw accountError;

  const { error: identityError } = await supabaseAdmin.schema('ondwira').from('account_identities').upsert({
    account_id: input.id,
    identity_type: input.identityType,
    identity_id: input.id,
  }, { onConflict: 'identity_type,identity_id' });
  if (identityError) throw identityError;

  const { error: preferenceError } = await supabaseAdmin.schema('ondwira').from('account_preferences').upsert({
    account_id: input.id,
  }, { onConflict: 'account_id', ignoreDuplicates: true });
  if (preferenceError) throw preferenceError;

  if (input.security) {
    const defaultMethod = ['passkey', 'totp', 'email'].includes(input.security.defaultMethod || '') ? input.security.defaultMethod : null;
    const { error: securityError } = await supabaseAdmin.schema('ondwira').from('account_security').upsert({
      account_id: input.id,
      requires_2fa: Boolean(input.security.requires2fa),
      has_passkey: Boolean(input.security.hasPasskey),
      has_totp: Boolean(input.security.hasTotp),
      has_email_otp: Boolean(input.security.hasEmailOtp),
      default_method: defaultMethod,
      updated_at: now,
    }, { onConflict: 'account_id' });
    if (securityError) throw securityError;
  }

  return input.id;
}

export async function syncOndwiraSecurity(accountId: string, security: {
  requires2fa?: boolean;
  hasPasskey?: boolean;
  hasTotp?: boolean;
  hasEmailOtp?: boolean;
  defaultMethod?: string | null;
}) {
  const changes: Record<string, unknown> = {
    account_id: accountId,
    updated_at: new Date().toISOString(),
  };
  if (security.requires2fa !== undefined) changes.requires_2fa = security.requires2fa;
  if (security.hasPasskey !== undefined) changes.has_passkey = security.hasPasskey;
  if (security.hasTotp !== undefined) changes.has_totp = security.hasTotp;
  if (security.hasEmailOtp !== undefined) changes.has_email_otp = security.hasEmailOtp;
  if (security.defaultMethod !== undefined) changes.default_method = ['passkey', 'totp', 'email'].includes(security.defaultMethod || '') ? security.defaultMethod : null;
  const { error } = await supabaseAdmin.schema('ondwira').from('account_security').upsert(changes, { onConflict: 'account_id' });
  if (error) throw error;
}
