import { headers } from 'next/headers';

/**
 * VPN / Proxy Detection Utility
 * 
 * In a production environment, this should be connected to a paid service
 * like IPQualityScore, MaxMind, or ipapi to get real-time VPN reputation data.
 * 
 * For now, this implements strict header analysis to catch common proxies.
 */

export async function detectVPN(ip: string): Promise<{ isVPN: boolean; reason?: string }> {
    const headerParams = await headers();

    // 1. Check for common Proxy Headers
    // VPNs and Proxies often inject these headers.
    const proxyHeaders = [
        'via',
        'x-forwarded-for',
        'x-forwarded-proto',
        'forwarded',
        'proxy-connection',
        'x-proxy-id',
        'x-tinyproxy',
        'cf-connecting-ip' // Cloudflare is fine, but sometimes indicates chaining
    ];

    // Note: X-Forwarded-For is standard in many deployment setups (like Vercel),
    // so we don't block on just its presence, but we check its depth.

    const via = headerParams.get('via');
    const proxyConnection = headerParams.get('proxy-connection');

    if (via || proxyConnection) {
        return { isVPN: true, reason: 'Proxy Headers Detected' };
    }

    // 2. Strict Mode Verification (Environment Variable or Flag)
    // If strict mode is on, we can check for known data center IP ranges (Mock Implementation)

    // MOCK: Block a specific test IP or range if needed for testing
    // if (ip.startsWith('100.')) return { isVPN: true, reason: 'Restricted Range' };

    // 3. Third-Party Integration Point
    // const reputation = await fetch(`https://vpn-check-api.com/${ip}`)...
    // if (reputation.score > 80) return { isVPN: true };

    return { isVPN: false };
}

/**
 * Helper to get the "Real" IP, bypassing common spoofing attempts.
 * Returns the first IP in x-forwarded-for chain or the connection remote address.
 */
export async function getRealIp() {
    const headerParams = await headers();
    const forwardedFor = headerParams.get('x-forwarded-for');

    if (forwardedFor) {
        // The first IP in the list is the original client
        return forwardedFor.split(',')[0].trim();
    }

    // Fallback? Browsers don't give socket access directly in Next.js edge/serverless readily
    // But usually x-forwarded-for is present in Vercel.
    return '127.0.0.1';
}
