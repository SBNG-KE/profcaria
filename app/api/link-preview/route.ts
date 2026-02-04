import { NextRequest, NextResponse } from 'next/server';
import { JSDOM } from 'jsdom';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
        return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    let targetUrl = url;
    if (!/^https?:\/\//i.test(url)) {
        targetUrl = 'https://' + url;
    }

    try {
        // Validate URL
        new URL(targetUrl);

        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5'
            },
            cache: 'no-store'
        });

        if (!response.ok) {
            throw new Error('Failed to fetch URL');
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('text/html')) {
            // It's a file (image, pdf, etc.) or not HTML. Return basic info.
            return NextResponse.json({
                url: targetUrl,
                title: targetUrl.split('/').pop() || '',
                description: 'File',
                image: '',
                siteName: new URL(targetUrl).hostname
            });
        }

        const html = await response.text();
        const dom = new JSDOM(html);
        const doc = dom.window.document;

        const getMeta = (prop: string) =>
            doc.querySelector(`meta[property="${prop}"]`)?.getAttribute('content') ||
            doc.querySelector(`meta[name="${prop}"]`)?.getAttribute('content');

        const title = getMeta('og:title') || doc.title || '';
        const description = getMeta('og:description') || getMeta('description') || '';

        // Robust image extraction
        let image = getMeta('og:image') ||
            getMeta('twitter:image') ||
            doc.querySelector('link[rel="image_src"]')?.getAttribute('href') ||
            '';

        // Fix relative image URLs
        if (image && !image.match(/^https?:\/\//i)) {
            try {
                image = new URL(image, targetUrl).toString();
            } catch (e) {
                image = '';
            }
        }

        const siteName = getMeta('og:site_name') || new URL(targetUrl).hostname;

        return NextResponse.json({
            url: targetUrl,
            title,
            description,
            image,
            siteName
        });

    } catch (error: any) {
        console.error('Link Preview Error:', error);

        let hostname = '';
        try {
            hostname = new URL(targetUrl).hostname;
        } catch (e) {
            hostname = 'Invalid URL';
        }

        return NextResponse.json({
            url: targetUrl,
            title: hostname,
            description: '',
            image: '',
            siteName: hostname
        });
    }
}
