import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

interface LinkMetadata {
    title: string | null;
    description: string | null;
    image: string | null;
    favicon: string | null;
    siteName: string | null;
}

// Simple in-memory cache for link previews (with 1-hour TTL)
const cache = new Map<string, { data: LinkMetadata; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const url = searchParams.get('url');

        if (!url) {
            return NextResponse.json({ error: 'Missing URL parameter' }, { status: 400 });
        }

        // Validate URL
        let parsedUrl: URL;
        try {
            parsedUrl = new URL(url);
            if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
                return NextResponse.json({ error: 'Invalid URL protocol' }, { status: 400 });
            }
        } catch {
            return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
        }

        // Check cache
        const cached = cache.get(url);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            return NextResponse.json(cached.data);
        }

        // Fetch the page
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        let html: string;
        try {
            const response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Profcaria Link Preview Bot/1.0',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                }
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                return NextResponse.json({ error: 'Failed to fetch URL' }, { status: 502 });
            }

            html = await response.text();
        } catch (e: any) {
            clearTimeout(timeoutId);
            if (e.name === 'AbortError') {
                return NextResponse.json({ error: 'Request timeout' }, { status: 504 });
            }
            return NextResponse.json({ error: 'Failed to fetch URL' }, { status: 502 });
        }

        // Extract metadata using regex (no DOM parser needed in Edge runtime)
        const metadata: LinkMetadata = {
            title: null,
            description: null,
            image: null,
            favicon: null,
            siteName: null,
        };

        // Helper to extract meta content
        const getMetaContent = (nameOrProperty: string): string | null => {
            // Try property first (OpenGraph)
            const propertyPattern = new RegExp(
                `<meta[^>]*property=["']${nameOrProperty}["'][^>]*content=["']([^"']*)["']`,
                'i'
            );
            let match = html.match(propertyPattern);
            if (match) return match[1];

            // Try reversed attribute order
            const propertyPatternReversed = new RegExp(
                `<meta[^>]*content=["']([^"']*)["'][^>]*property=["']${nameOrProperty}["']`,
                'i'
            );
            match = html.match(propertyPatternReversed);
            if (match) return match[1];

            // Try name attribute
            const namePattern = new RegExp(
                `<meta[^>]*name=["']${nameOrProperty}["'][^>]*content=["']([^"']*)["']`,
                'i'
            );
            match = html.match(namePattern);
            if (match) return match[1];

            // Try reversed for name attribute
            const namePatternReversed = new RegExp(
                `<meta[^>]*content=["']([^"']*)["'][^>]*name=["']${nameOrProperty}["']`,
                'i'
            );
            match = html.match(namePatternReversed);
            if (match) return match[1];

            return null;
        };

        // Get title (OpenGraph > Twitter > HTML title)
        metadata.title = getMetaContent('og:title')
            || getMetaContent('twitter:title')
            || html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim()
            || null;

        // Get description
        metadata.description = getMetaContent('og:description')
            || getMetaContent('twitter:description')
            || getMetaContent('description')
            || null;

        // Get image
        metadata.image = getMetaContent('og:image')
            || getMetaContent('twitter:image')
            || getMetaContent('twitter:image:src')
            || null;

        // Make image URL absolute if relative
        if (metadata.image && !metadata.image.startsWith('http')) {
            metadata.image = new URL(metadata.image, parsedUrl.origin).href;
        }

        // Get site name
        metadata.siteName = getMetaContent('og:site_name')
            || parsedUrl.hostname.replace('www.', '')
            || null;

        // Get favicon
        const faviconMatch = html.match(/<link[^>]*rel=["'](?:icon|shortcut icon)["'][^>]*href=["']([^"']*)["']/i)
            || html.match(/<link[^>]*href=["']([^"']*)["'][^>]*rel=["'](?:icon|shortcut icon)["']/i);

        if (faviconMatch) {
            metadata.favicon = faviconMatch[1].startsWith('http')
                ? faviconMatch[1]
                : new URL(faviconMatch[1], parsedUrl.origin).href;
        } else {
            // Default to /favicon.ico
            metadata.favicon = `${parsedUrl.origin}/favicon.ico`;
        }

        // Cache the result
        cache.set(url, { data: metadata, timestamp: Date.now() });

        // Clean old cache entries periodically
        if (cache.size > 100) {
            const now = Date.now();
            for (const [key, value] of cache) {
                if (now - value.timestamp > CACHE_TTL) {
                    cache.delete(key);
                }
            }
        }

        return NextResponse.json(metadata);

    } catch (error) {
        console.error('[LinkPreview] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
