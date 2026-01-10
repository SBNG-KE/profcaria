import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify, SignJWT } from 'jose';

// Define paths
const PROFESSIONAL_PATHS = ['/professional'];
const EMPLOYER_PATHS = ['/employer'];

// Explicit list of paths that do not require auth/2FA enforcement
const PUBLIC_PATHS = [
    '/',
    '/auth',
    '/professional/login',
    '/professional/signup',
    '/employer/login',
    '/employer/signup',
    // Note: API routes are excluded by the matcher below, so we don't need to list them here
];

const DEBUG = process.env.NODE_ENV === 'development';

export default async function middleware(req: NextRequest) {
    const path = req.nextUrl.pathname;

    if (DEBUG) {
        console.log(`🔐 [MIDDLEWARE] Path: ${path}`);
    }

    // 1. Skip Public Assets (Redundant if matcher is perfect, but good for safety)
    if (
        path.startsWith('/_next') ||
        path.startsWith('/static') ||
        path.match(/\.(ico|png|jpg|jpeg|svg|css|js)$/)
    ) {
        return NextResponse.next();
    }

    // 2. Determine Route Type
    const isProfessionalRoute = path.startsWith('/professional') && !PUBLIC_PATHS.includes(path);
    const isEmployerRoute = path.startsWith('/employer') && !PUBLIC_PATHS.includes(path);
    const isSecurityRoute = path.startsWith('/security');

    // Explicitly allow navigation within security flow
    const isSetupOrVerify = path.startsWith('/security/setup') || path.startsWith('/security/verify');

    // Check if the current path is strictly public
    const isPublicPath = PUBLIC_PATHS.some(p => path === p || (p !== '/' && path.startsWith(p)));

    // 3. Check for Session Cookie
    const token = req.cookies.get('profcaria_session')?.value;

    if (DEBUG) {
        console.log(`🔐 [MIDDLEWARE] Token present: ${!!token} | Route Type: ${isProfessionalRoute ? 'Prof' : isEmployerRoute ? 'Empl' : 'Other'}`);
    }

    // --- CASE A: No Token ---
    if (!token) {
        // If trying to access a protected route without a token, redirect to home/login
        if (isProfessionalRoute || isEmployerRoute || isSecurityRoute) {
            if (DEBUG) console.log(`🔐 [MIDDLEWARE] Protected route accessed without token. Redirecting.`);
            // You might want to redirect to a specific login page based on the route
            if (path.startsWith('/employer')) {
                const url = new URL('/employer/login', req.url);
                url.searchParams.set('redirect', path);
                return NextResponse.redirect(url);
            }
            if (path.startsWith('/professional')) {
                const url = new URL('/professional/login', req.url);
                url.searchParams.set('redirect', path);
                return NextResponse.redirect(url);
            }

            return NextResponse.redirect(new URL('/', req.url));
        }
        // Allow access to public paths
        return NextResponse.next();
    }

    // --- CASE B: Token Present (Verify & Enforce) ---
    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);

        const userSchema = payload.schema as string; // 'professional' or 'employer'
        const hasTotp = payload.has_totp as boolean;
        const hasPasskey = payload.has_passkey as boolean;
        const aal = (payload.aal as number) || 1;
        const now = Math.floor(Date.now() / 1000);
        const lastActive = (payload.last_active as number) || (payload.iat as number) || now;

        // --- INACTIVITY CHECK (e.g., 7 days) ---
        // If user hasn't been seen for > 7 days, force logout, even if token is valid for 30d.
        const IDLE_TIMEOUT = 7 * 24 * 60 * 60;
        if (now - lastActive > IDLE_TIMEOUT) {
            console.log('🔐 [MIDDLEWARE] Session idle timeout');
            const response = NextResponse.redirect(new URL('/', req.url));
            response.cookies.delete('profcaria_session');
            return response;
        }

        // Prepare headers for downstream
        const requestHeaders = new Headers(req.headers);
        requestHeaders.set('x-user-id', payload.uid as string);
        requestHeaders.set('x-user-schema', userSchema);

        // 1. Role-Based Access Control
        if (isEmployerRoute && userSchema !== 'employer') {
            return NextResponse.redirect(new URL('/professional/home', req.url));
        }
        if (isProfessionalRoute && userSchema !== 'professional') {
            return NextResponse.redirect(new URL('/employer/home', req.url));
        }

        // 2. Auth Page Redirect (If already logged in, move them to dashboard)
        if (path === '/professional/login' || path === '/professional/signup') {
            return NextResponse.redirect(new URL('/professional/home', req.url));
        }
        if (path === '/employer/login' || path === '/employer/signup') {
            return NextResponse.redirect(new URL('/employer/home', req.url));
        }

        // 3. 2FA / Security Enforcement
        const isProtectedContext = isProfessionalRoute || isEmployerRoute || isSecurityRoute;

        // Allow access to setup/verify pages to prevent infinite redirects
        if (isSetupOrVerify) {
            // We still want to refresh token if needed, but for now just pass through
            // Actually, better to use the common response object at the bottom?
            // But existing logic returns early.
            // We'll just return next() here. Verification pages often have short lived interactions.
            return NextResponse.next({ request: { headers: requestHeaders } });
        }

        if (isProtectedContext) {
            const hasAny2FA = hasTotp || hasPasskey;

            if (hasAny2FA) {
                if (aal < 2) {
                    if (DEBUG) console.log(`🔐 [MIDDLEWARE] AAL1 detected, enforcing verify`);
                    return NextResponse.redirect(new URL('/security/verify', req.url));
                }
            } else {
                if (DEBUG) console.log(`🔐 [MIDDLEWARE] No 2FA detected, enforcing setup`);
                return NextResponse.redirect(new URL('/security/setup', req.url));
            }
        }

        // 4. Allowed Request - Check for Token Refresh (Sliding Window)
        const response = NextResponse.next({
            request: {
                headers: requestHeaders,
            },
        });

        // Refresh if > 1 hour since last active
        const REFRESH_THRESHOLD = 60 * 60;
        if (now - lastActive > REFRESH_THRESHOLD) {
            if (DEBUG) console.log('🔐 [MIDDLEWARE] Refreshing session token (sliding window)');
            const newPayload = { ...payload, last_active: now }; // Update last_active

            // Sign new token
            // Note: SignJWT needs to be imported
            const newToken = await new SignJWT(newPayload)
                .setProtectedHeader({ alg: 'HS256' })
                .setIssuedAt()
                .setExpirationTime('30d') // Extend to full 30 days
                .sign(secret);

            response.cookies.set('profcaria_session', newToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 30 * 24 * 60 * 60, // 30 days
                path: '/'
            });
        }

        return response;

    } catch (err) {
        console.error("🔐 [MIDDLEWARE] Token Verification Failed:", err);
        const response = NextResponse.redirect(new URL('/', req.url));
        response.cookies.delete('profcaria_session');
        return response;
    }
}

// Configuration to exclude static files and APIs from this middleware
export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};