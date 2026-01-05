import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

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
            if (path.startsWith('/employer')) return NextResponse.redirect(new URL('/employer/login', req.url));
            if (path.startsWith('/professional')) return NextResponse.redirect(new URL('/professional/login', req.url));
            
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
        // We ONLY enforce this loop if the user is NOT on a public page (unless you want to block public viewing for partial users)
        // OR if they are currently inside the security flow (to allow them to complete it)
        
        const isProtectedContext = isProfessionalRoute || isEmployerRoute || isSecurityRoute;
        
        // Allow access to setup/verify pages to prevent infinite redirects
        if (isSetupOrVerify) {
             return NextResponse.next({ request: { headers: requestHeaders } });
        }

        // If we are in a protected context, we enforce 2FA
        if (isProtectedContext) {
            const hasAny2FA = hasTotp || hasPasskey;

            if (hasAny2FA) {
                // User has 2FA set up, but current session is not verified (AAL1)
                if (aal < 2) {
                    if (DEBUG) console.log(`🔐 [MIDDLEWARE] AAL1 detected, enforcing verify`);
                    return NextResponse.redirect(new URL('/security/verify', req.url));
                }
            } else {
                // User has NO 2FA set up at all -> Force Setup
                if (DEBUG) console.log(`🔐 [MIDDLEWARE] No 2FA detected, enforcing setup`);
                return NextResponse.redirect(new URL('/security/setup', req.url));
            }
        }

        // 4. Allow request to proceed with injected headers
        return NextResponse.next({
            request: {
                headers: requestHeaders,
            },
        });

    } catch (err) {
        console.error("🔐 [MIDDLEWARE] Token Verification Failed:", err);
        // If token is invalid/expired, remove it and redirect to login/home
        const response = NextResponse.redirect(new URL('/', req.url));
        response.cookies.delete('profcaria_session');
        return response;
    }
}

// Configuration to exclude static files and APIs from this middleware
export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};