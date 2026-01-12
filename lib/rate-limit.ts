/**
 * Rate Limiting Service
 * Protects API routes without affecting normal user experience
 * Uses in-memory store (for MVP) - upgrade to Redis for production at scale
 */

// In-memory store for rate limiting
// Note: This resets on serverless cold starts, which is actually fine for our generous limits
const rateLimitStore: Map<string, { count: number; resetTime: number }> = new Map();

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

/**
 * Check if a request should be allowed
 * Returns { allowed: boolean, remaining: number, resetIn: number }
 */
export function checkRateLimit(
    identifier: string,  // Usually IP or user ID
    type: RateLimitType
): { allowed: boolean; remaining: number; resetIn: number } {
    const config = RATE_LIMITS[type];
    const key = `${type}:${identifier}`;
    const now = Date.now();

    // Clean up expired entries occasionally
    if (Math.random() < 0.01) { // 1% chance per request
        cleanupExpired();
    }

    const existing = rateLimitStore.get(key);

    if (!existing || existing.resetTime < now) {
        // New window
        rateLimitStore.set(key, {
            count: 1,
            resetTime: now + config.windowMs,
        });
        return {
            allowed: true,
            remaining: config.maxRequests - 1,
            resetIn: config.windowMs,
        };
    }

    if (existing.count >= config.maxRequests) {
        // Rate limited
        return {
            allowed: false,
            remaining: 0,
            resetIn: existing.resetTime - now,
        };
    }

    // Increment counter
    existing.count++;
    return {
        allowed: true,
        remaining: config.maxRequests - existing.count,
        resetIn: existing.resetTime - now,
    };
}

/**
 * Clean up expired rate limit entries
 */
function cleanupExpired(): void {
    const now = Date.now();
    for (const [key, value] of rateLimitStore.entries()) {
        if (value.resetTime < now) {
            rateLimitStore.delete(key);
        }
    }
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
