import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

export type OndwiraSession = {
  uid: string;
  schema: 'professional' | 'employer';
  email?: string;
};

/**
 * Transitional session reader. Social uses the existing account session while
 * Ondwira identity is introduced, so existing members do not need a second login.
 */
export async function getOndwiraSession(): Promise<OndwiraSession | null> {
  const token = (await cookies()).get('profcaria_session')?.value;
  if (!token || !process.env.JWT_SECRET) return null;

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    if (typeof payload.uid !== 'string' || (payload.schema !== 'professional' && payload.schema !== 'employer')) {
      return null;
    }
    return { uid: payload.uid, schema: payload.schema, email: typeof payload.email === 'string' ? payload.email : undefined };
  } catch {
    return null;
  }
}
