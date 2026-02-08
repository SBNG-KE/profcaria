import { NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Lazy initialization to avoid build-time errors
let _supabaseAdmin: SupabaseClient | null = null;

function getSupabaseAdmin(): SupabaseClient {
    if (!_supabaseAdmin) {
        _supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
    }
    return _supabaseAdmin;
}

// Google Safe Browsing API key (add to .env.local)
const SAFE_BROWSING_API_KEY = process.env.GOOGLE_SAFE_BROWSING_API_KEY;

// Strike threshold before permanent block
const STRIKE_THRESHOLD = 10;

// Cache duration in hours (re-check after this)
const CACHE_DURATION_HOURS = 24;

interface SafeBrowsingResponse {
    matches?: Array<{
        threatType: string;
        platformType: string;
        threat: { url: string };
        cacheDuration: string;
    }>;
}

// Hash URL for efficient lookups
function hashUrl(url: string): string {
    return crypto.createHash('sha256').update(url.toLowerCase().trim()).digest('hex');
}

// Check URL against Google Safe Browsing API
async function checkSafeBrowsing(url: string): Promise<{ isSafe: boolean; threatType?: string }> {
    if (!SAFE_BROWSING_API_KEY) {
        console.warn('Google Safe Browsing API key not configured');
        return { isSafe: true }; // Allow if not configured
    }

    try {
        const response = await fetch(
            `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${SAFE_BROWSING_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    client: {
                        clientId: 'profcaria',
                        clientVersion: '1.0.0'
                    },
                    threatInfo: {
                        threatTypes: [
                            'MALWARE',
                            'SOCIAL_ENGINEERING',
                            'UNWANTED_SOFTWARE',
                            'POTENTIALLY_HARMFUL_APPLICATION'
                        ],
                        platformTypes: ['ANY_PLATFORM'],
                        threatEntryTypes: ['URL'],
                        threatEntries: [{ url }]
                    }
                })
            }
        );

        if (!response.ok) {
            console.error('Safe Browsing API error:', response.status);
            return { isSafe: true }; // Allow on API error
        }

        const data: SafeBrowsingResponse = await response.json();

        if (data.matches && data.matches.length > 0) {
            return {
                isSafe: false,
                threatType: data.matches[0].threatType
            };
        }

        return { isSafe: true };
    } catch (error) {
        console.error('Safe Browsing check failed:', error);
        return { isSafe: true }; // Allow on network error
    }
}

// POST - Check a URL and return its security status
export async function POST(req: Request) {
    try {
        const { url } = await req.json();

        if (!url || typeof url !== 'string') {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        // Normalize and hash the URL
        const normalizedUrl = url.trim().toLowerCase();
        const urlHash = hashUrl(normalizedUrl);

        // Check if we already have this URL in our database
        const { data: existingRecord } = await getSupabaseAdmin()
            .from('url_security')
            .select('*')
            .eq('url_hash', urlHash)
            .single();

        // If permanently blocked, return immediately
        if (existingRecord?.is_permanently_blocked) {
            return NextResponse.json({
                url: normalizedUrl,
                status: 'blocked',
                strikeCount: existingRecord.strike_count,
                message: 'This link has been permanently blocked as malicious.',
                threatType: existingRecord.threat_type
            });
        }

        // Check if cache is still valid
        if (existingRecord) {
            const lastChecked = new Date(existingRecord.last_checked);
            const hoursSinceCheck = (Date.now() - lastChecked.getTime()) / (1000 * 60 * 60);

            if (hoursSinceCheck < CACHE_DURATION_HOURS && existingRecord.status !== 'unchecked') {
                return NextResponse.json({
                    url: normalizedUrl,
                    status: existingRecord.status,
                    strikeCount: existingRecord.strike_count,
                    threatType: existingRecord.threat_type,
                    cached: true
                });
            }
        }

        // Call Google Safe Browsing API
        const safeBrowsingResult = await checkSafeBrowsing(normalizedUrl);

        let newStatus: 'safe' | 'suspicious' | 'malicious' = 'safe';
        let newStrikeCount = existingRecord?.strike_count || 0;
        let isPermanentlyBlocked = false;
        let threatType = existingRecord?.threat_type || null;

        if (!safeBrowsingResult.isSafe) {
            newStrikeCount += 1;
            threatType = safeBrowsingResult.threatType || 'UNKNOWN';

            // Determine status based on strike count
            if (newStrikeCount >= STRIKE_THRESHOLD) {
                newStatus = 'malicious';
                isPermanentlyBlocked = true;
            } else if (newStrikeCount >= 3) {
                newStatus = 'malicious';
            } else {
                newStatus = 'suspicious';
            }
        }

        // Upsert the record
        const { error: upsertError } = await getSupabaseAdmin()
            .from('url_security')
            .upsert({
                id: existingRecord?.id || crypto.randomUUID(),
                url: normalizedUrl,
                url_hash: urlHash,
                status: newStatus,
                threat_type: threatType,
                strike_count: newStrikeCount,
                is_permanently_blocked: isPermanentlyBlocked,
                last_checked: new Date().toISOString(),
                check_count: (existingRecord?.check_count || 0) + 1,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'url_hash'
            });

        if (upsertError) {
            console.error('Error upserting URL security record:', upsertError);
        }

        return NextResponse.json({
            url: normalizedUrl,
            status: isPermanentlyBlocked ? 'blocked' : newStatus,
            strikeCount: newStrikeCount,
            threatType,
            message: isPermanentlyBlocked
                ? 'This link has been permanently blocked as malicious.'
                : newStatus === 'malicious'
                    ? `Warning: This link has been flagged as dangerous (${newStrikeCount}/${STRIKE_THRESHOLD} strikes).`
                    : newStatus === 'suspicious'
                        ? 'This link appears suspicious. Proceed with caution.'
                        : 'This link appears safe.'
        });

    } catch (error) {
        console.error('URL security check error:', error);
        return NextResponse.json({ error: 'Failed to check URL' }, { status: 500 });
    }
}

// GET - Check a URL quickly (for inline display)
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get('url');

    if (!url) {
        return NextResponse.json({ error: 'URL parameter required' }, { status: 400 });
    }

    const urlHash = hashUrl(url.trim().toLowerCase());

    // Quick lookup in database without calling external API
    const { data: record } = await getSupabaseAdmin()
        .from('url_security')
        .select('status, strike_count, is_permanently_blocked, threat_type')
        .eq('url_hash', urlHash)
        .single();

    if (!record) {
        return NextResponse.json({
            status: 'unknown',
            message: 'URL has not been scanned yet.'
        });
    }

    return NextResponse.json({
        url: url,
        status: record.is_permanently_blocked ? 'blocked' : record.status,
        strikeCount: record.strike_count,
        threatType: record.threat_type,
        isBlocked: record.is_permanently_blocked
    });
}
