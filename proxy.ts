// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

/* ------------------ CONFIG ------------------ */

const PUBLIC_PATHS = [
  '/',
  '/auth',

  '/professional/login',
  '/professional/signup',

  '/employer/login',
  '/employer/signup',

  '/api/auth',
  '/api/employer/login',
  '/api/employer/signup',
  '/api/professional/login',
  '/api/professional/signup',
];

/* ------------------ HELPERS ------------------ */

function isPublicPath(path: string) {
  return PUBLIC_PATHS.some(
    (p) => path === p || path.startsWith(p + '/')
  );
}

function redirectHome(req: NextRequest) {
  const res = NextResponse.redirect(new URL('/', req.url));
  res.cookies.delete('profcaria_session');
  return res;
}

/* ------------------ MIDDLEWARE ------------------ */

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip Next.js internals & static assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg')
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get('profcaria_session')?.value;

  // No token → allow only public pages
  if (!token) {
    if (isPublicPath(pathname)) {
      return NextResponse.next();
    }
    return redirectHome(req);
  }

  // JWT secret MUST exist
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    return redirectHome(req);
  }

  // Verify JWT (EDGE-SAFE)
  let payload: any;
  try {
    const secret = new TextEncoder().encode(jwtSecret);
    const verified = await jwtVerify(token, secret);
    payload = verified.payload;
  } catch {
    return redirectHome(req);
  }

  // Minimal required claims
  const userSchema = payload?.schema;
  const userId = payload?.uid;

  if (!userSchema || !userId) {
    return redirectHome(req);
  }

  /* ------------------ ROLE GUARDS ------------------ */

  if (pathname.startsWith('/professional') && userSchema !== 'professional') {
    return NextResponse.redirect(new URL('/employer/home', req.url));
  }

  if (pathname.startsWith('/employer') && userSchema !== 'employer') {
    return NextResponse.redirect(new URL('/professional/home', req.url));
  }

  /* ------------------ 2FA LOGIC ------------------ */

  const hasTotp = Boolean(payload?.has_totp);
  const hasPasskey = Boolean(payload?.has_passkey);
  const aal = Number(payload?.aal ?? 1);

  const hasAny2FA = hasTotp || hasPasskey;

  const isSecuritySetup = pathname.startsWith('/security/setup');
  const isSecurityVerify = pathname.startsWith('/security/verify');
  const isApiSecurity = pathname.startsWith('/api/security');

  // Allow security pages
  if (isSecuritySetup || isSecurityVerify) {
    const headers = new Headers(req.headers);
    headers.set('x-user-id', userId);
    headers.set('x-user-schema', userSchema);

    return NextResponse.next({
      request: { headers },
    });
  }

  // Enforce 2FA on non-security routes
  if (!isApiSecurity) {
    if (!hasAny2FA) {
      return NextResponse.redirect(new URL('/security/setup', req.url));
    }

    if (hasAny2FA && aal < 2) {
      return NextResponse.redirect(new URL('/security/verify', req.url));
    }
  }

  /* ------------------ PASS THROUGH ------------------ */

  const headers = new Headers(req.headers);
  headers.set('x-user-id', userId);
  headers.set('x-user-schema', userSchema);

  return NextResponse.next({
    request: { headers },
  });
}

/* ------------------ MATCHER ------------------ */

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
