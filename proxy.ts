import { NextResponse } from 'next/server';

import type { NextRequest } from 'next/server';

import { jwtVerify } from 'jose';



// Define paths specific to roles to protect them

const PROFESSIONAL_PATHS = ['/professional'];

const EMPLOYER_PATHS = ['/employer'];

const PUBLIC_PATHS = [

    '/professional/login',

    '/professional/signup',

    '/employer/login',

    '/employer/signup',

    '/',

    '/auth',

    '/api/auth', // public auth endpoints

    '/api/employer/login',

    '/api/employer/signup',

    '/api/professional/login',

    '/api/professional/signup'

];

// DEBUG: Log all requests in development

const DEBUG = process.env.NODE_ENV === 'development';

export default async function proxy(req: NextRequest) {

    const path = req.nextUrl.pathname;

    if (DEBUG) {

        console.log(`🔐 [MIDDLEWARE] Path: ${path}`);

    }



    // 1. Skip public assets and api routes that don't need protection

    if (

        path.startsWith('/_next') ||

        path.startsWith('/static') ||

        path.endsWith('.ico') ||

        path.endsWith('.png') ||

        path.endsWith('.jpg')

    ) {

        return NextResponse.next();

    }



    // 2. Check for Session Cookie

    const token = req.cookies.get('profcaria_session')?.value;



    if (DEBUG) {

        console.log(`🔐 [MIDDLEWARE] Token present: ${!!token}`);

    }



    // 3. Define current route status

    const isPublic = PUBLIC_PATHS.some(p => path === p || path.startsWith(p + '/'));

    const isProfessionalRoute = path.startsWith('/professional') && !path.startsWith('/professional/login') && !path.startsWith('/professional/signup');

    const isEmployerRoute = path.startsWith('/employer') && !path.startsWith('/employer/login') && !path.startsWith('/employer/signup');

    const isSecurityRoute = path.startsWith('/security');

    const isSetupPath = path.startsWith('/security/setup');

    const isVerifyPath = path.startsWith('/security/verify');

    const isApiSecurity = path.startsWith('/api/security');



    // If no token and trying to access protected route

    if (!token) {

        if (isProfessionalRoute || isEmployerRoute || isSecurityRoute) {

            if (DEBUG) console.log(`🔐 [MIDDLEWARE] No token, redirecting to /`);

            return NextResponse.redirect(new URL('/', req.url));

        }

        return NextResponse.next();

    }



    // 4. Verify Token

    try {

        const secret = new TextEncoder().encode(process.env.JWT_SECRET);

        const { payload } = await jwtVerify(token, secret);



        const userSchema = payload.schema as string; // 'professional' or 'employer'

        const hasTotp = payload.has_totp as boolean;

        const aal = (payload.aal as number) || 1;



        if (DEBUG) {

            console.log(`🔐 [MIDDLEWARE] User: ${userSchema}, hasTotp: ${hasTotp}, aal: ${aal}`);

            console.log(`🔐 [MIDDLEWARE] Path analysis: isSetupPath=${isSetupPath}, isVerifyPath=${isVerifyPath}`);

        }



        // Prevent Professional from accessing Employer routes

        if (isEmployerRoute && userSchema !== 'employer') {

            if (DEBUG) console.log(`🔐 [MIDDLEWARE] Professional trying to access employer route`);

            return NextResponse.redirect(new URL('/professional/home', req.url));

        }



        // Prevent Employer from accessing Professional routes

        if (isProfessionalRoute && userSchema !== 'professional') {

            if (DEBUG) console.log(`🔐 [MIDDLEWARE] Employer trying to access professional route`);

            return NextResponse.redirect(new URL('/employer/home', req.url));

        }



        // Handle Redirects for Logged-In Users visiting Public Pages

        if (path === '/professional/login' || path === '/professional/signup') {

            if (userSchema === 'professional') {

                return NextResponse.redirect(new URL('/professional/home', req.url));

            }

        }

        if (path === '/employer/login' || path === '/employer/signup') {

            if (userSchema === 'employer') {

                return NextResponse.redirect(new URL('/employer/home', req.url));

            }

        }



        // 🔧 **CRITICAL FIX: 2FA Check Logic**

        // Allow navigation between setup and verify pages freely

        if (isSetupPath || isVerifyPath) {

            if (DEBUG) console.log(`🔐 [MIDDLEWARE] Allowing access to security page`);



            // Add user info to headers

            const requestHeaders = new Headers(req.headers);

            requestHeaders.set('x-user-id', payload.uid as string);

            requestHeaders.set('x-user-schema', userSchema);



            return NextResponse.next({

                request: {

                    headers: requestHeaders,

                },

            });

        }



        // For non-security routes, check 2FA status

        if (!isApiSecurity) {

            // Check if user has any 2FA method configured

            // We need to check both hasTotp from JWT AND check for passkeys

            const hasAny2FA = hasTotp || (payload.has_passkey as boolean) || false;



            if (DEBUG) {

                console.log(`🔐 [MIDDLEWARE] hasAny2FA: ${hasAny2FA}`);

            }



            if (hasAny2FA) {

                // User has 2FA configured, must verify (AAL 2) to access protected routes

                if (aal < 2) {

                    if (DEBUG) console.log(`🔐 [MIDDLEWARE] 2FA configured but not verified, redirecting to verify`);

                    return NextResponse.redirect(new URL('/security/verify', req.url));

                }

            } else {

                // User has NO 2FA configured, must setup

                if (DEBUG) console.log(`🔐 [MIDDLEWARE] No 2FA configured, redirecting to setup`);

                return NextResponse.redirect(new URL('/security/setup', req.url));

            }

        }



        // Add user info to headers

        const requestHeaders = new Headers(req.headers);

        requestHeaders.set('x-user-id', payload.uid as string);

        requestHeaders.set('x-user-schema', userSchema);



        return NextResponse.next({

            request: {

                headers: requestHeaders,

            },

        });



    } catch (err) {

        console.error("🔐 [MIDDLEWARE] Auth Error:", err);

        const response = NextResponse.redirect(new URL('/', req.url));

        response.cookies.delete('profcaria_session');

        return response;

    }

}



export const config = {

    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],

};