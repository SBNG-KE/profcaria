/**
 * Rate Limiting Service
 * Protects API routes without affecting normal user experience
 * Uses Upstash Redis for persistent rate limiting across serverless instances
 */

import { Ratelimit } from '@upstash/ratelimit';
import { redis } from './redis';

export interface RateLimitConfig {
    windowMs: number;      // Time window in milliseconds
    maxRequests: number;   // Max requests per window
}

// Preset configurations (generous limits)
export const RATE_LIMITS = {
    // Authentication - Protect against brute force
    login: { windowMs: 60 * 1000, maxRequests: 10 },           // 10/minute
    signup: { windowMs: 60 * 1000, maxRequests: 5 },           // 5/minute
    otpVerify: { windowMs: 60 * 1000, maxRequests: 10 },       // 10/minute (6-digit = 1M combos)

    // File uploads - Reasonable limits
    upload: { windowMs: 60 * 60 * 1000, maxRequests: 50 },     // 50/hour

    // General API - Very generous
    api: { windowMs: 60 * 1000, maxRequests: 200 },            // 200/minute

    // Specific actions
    jobCreate: { windowMs: 60 * 60 * 1000, maxRequests: 20 },  // 20 jobs/hour
    application: { windowMs: 60 * 60 * 1000, maxRequests: 50 },// 50 applications/hour
    message: { windowMs: 60 * 1000, maxRequests: 60 },         // 60 messages/minute

    // Support - Prevent spam
    support: { windowMs: 60 * 60 * 1000, maxRequests: 10 },    // 10/hour
} as const;

export type RateLimitType = keyof typeof RATE_LIMITS;

// Convert ms sliding window to the format Upstash expects (e.g. '60 s')
function msToUpstashWindow(ms: number): `${number} ms` | `${number} s` | `${number} m` | `${number} h` | `${number} d` {
    return `${ms} ms`;
}

// Generate ratelimit instances dynamically based on RATE_LIMITS config
const ratelimiters = new Map<RateLimitType, Ratelimit>();

function getRatelimiter(type: RateLimitType): Ratelimit {
    if (!ratelimiters.has(type)) {
        const config = RATE_LIMITS[type];

        // Safety against Vercel Edge limitations where some advanced algorithms might be restricted
        // slidingWindow ensures if someone gets 10 requests per minute, they don't get 20 around the minute mark boundary.
        const ratelimit = new Ratelimit({
            redis: redis,
            limiter: Ratelimit.slidingWindow(config.maxRequests, msToUpstashWindow(config.windowMs)),
            analytics: true,
            // Prefix to separate rate limits belonging to profcaria
            prefix: '@profcaria/ratelimit',
        });

        ratelimiters.set(type, ratelimit);
    }
    return ratelimiters.get(type)!;
}

/**
 * Check if a request should be allowed (Upstash Redis version)
 * Returns { allowed: boolean, remaining: number, resetIn: number }
 */
export async function checkRateLimit(
    identifier: string,  // Usually IP or user ID
    type: RateLimitType
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
    const ratelimit = getRatelimiter(type);

    // Check against upstash
    const { success, limit, remaining, reset } = await ratelimit.limit(identifier);

    // Upstash returns `reset` as a raw timestamp in milliseconds since Unix Epoch.
    const resetIn = Math.max(0, reset - Date.now());

    return {
        allowed: success,
        remaining: remaining,
        resetIn: resetIn,
    };
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(
    type: RateLimitType,
    result: { remaining: number; resetIn: number }
): Record<string, string> {
    const config = RATE_LIMITS[type];
    return {
        'X-RateLimit-Limit': String(config.maxRequests),
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': String(Math.ceil(result.resetIn / 1000)),
    };
}

/**
 * Helper to get client identifier (IP or user ID)
 */
export function getClientIdentifier(
    request: Request,
    userId?: string
): string {
    // Prefer user ID if available (for authenticated routes)
    if (userId) {
        return `user:${userId}`;
    }

    // Fall back to IP
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
        return `ip:${forwarded.split(',')[0].trim()}`;
    }

    return 'ip:unknown';
}

/**
 * Create a rate-limited response
 */
export function rateLimitedResponse(resetIn: number): Response {
    const seconds = Math.ceil(resetIn / 1000);
    return new Response(
        JSON.stringify({
            error: 'Too many requests',
            message: `Please wait ${seconds} seconds before trying again`,
            retryAfter: seconds,
        }),
        {
            status: 429,
            headers: {
                'Content-Type': 'application/json',
                'Retry-After': String(seconds),
            },
        }
    );
}
