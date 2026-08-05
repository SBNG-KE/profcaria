import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { supabaseAdmin } from '@/lib/supabase';

export type ProfcariaSession = {
  uid: string;
  schema: 'professional' | 'employer';
  email?: string;
};

/**
 * Transitional session reader. Social uses the existing account session while
 * Profcaria identity is introduced, so existing members do not need a second login.
 */
export async function getProfcariaSession(): Promise<ProfcariaSession | null> {
  const token = (await cookies()).get('profcaria_session')?.value;
  if (!token || !process.env.JWT_SECRET) return null;

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    if (typeof payload.uid !== 'string' || (payload.schema !== 'professional' && payload.schema !== 'employer')) {
      return null;
    }
    // A signed JWT is not enough after account deletion or suspension. Checking
    // the canonical account also invalidates cookies left behind by a data wipe.
    const { data: account, error } = await supabaseAdmin.schema('profcaria').from('accounts')
      .select('id, status').eq('id', payload.uid).maybeSingle();
    if (error || account?.status !== 'active') return null;

    return { uid: payload.uid, schema: payload.schema, email: typeof payload.email === 'string' ? payload.email : undefined };
  } catch {
    return null;
  }
}
