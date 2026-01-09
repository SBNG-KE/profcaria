
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
    const token = generateSmartLinkToken({ jobId, type: 'job-share', ts: Date.now() });
    // Use the origin passed from the request/client
    return `${origin}/professional/find-work?ref=${token}`;
}
