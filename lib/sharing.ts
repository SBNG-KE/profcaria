
import crypto from 'crypto';

const SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

/**
 * Generates a secure "Smart Link" reference token.
 * Encodes the payload and signs it to prevent tampering.
 */
export function generateSmartLinkToken(payload: object): string {
    const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto
        .createHmac('sha256', SECRET)
        .update(data)
        .digest('base64url');

    return `${data}.${signature}`;
}

/**
 * Verifies and decodes a "Smart Link" token.
 * Returns null if invalid or tampered with.
 */
export function verifySmartLinkToken<T>(token: string): T | null {
    try {
        const [data, signature] = token.split('.');
        if (!data || !signature) return null;

        const expectedSignature = crypto
            .createHmac('sha256', SECRET)
            .update(data)
            .digest('base64url');

        if (signature !== expectedSignature) return null;

        return JSON.parse(Buffer.from(data, 'base64url').toString('utf-8')) as T;
    } catch (e) {
        return null;
    }
}

/**
 * Helper to build the full sharing URL
 */
export function getJobShareLink(jobId: string, origin: string): string {
    // Direct link to job details page for better UX
    return `${origin}/professional/jobs/${jobId}`;
}

/**
 * Helper to build post sharing URL
 */
export function getPostShareLink(postId: string, origin: string): string {
    // Links to feed with post query param (handled by both professional and employer feeds)
    return `${origin}/professional/feed?post=${postId}`;
}

/**
 * Helper to build professional profile sharing URL
 */
export function getProfessionalProfileShareLink(username: string, origin: string): string {
    // Uses the clean /p/[username] route
    return `${origin}/p/${encodeURIComponent(username)}`;
}

/**
 * Helper to build employer/company profile sharing URL
 */
export function getEmployerProfileShareLink(companySlug: string, origin: string): string {
    // Uses the clean /c/[slug] route
    return `${origin}/c/${encodeURIComponent(companySlug)}`;
}
