import { NextRequest, NextResponse } from 'next/server';
import { JSDOM } from 'jsdom';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    console.log('Link Preview API called');
    let targetUrl = '';

    try {
        const { searchParams } = new URL(request.url);
        const url = searchParams.get('url');

        console.log('Requested URL:', url);

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        targetUrl = url;
        if (!/^https?:\/\//i.test(url)) {
            targetUrl = 'https://' + url;
        }
        console.log('Target URL with protocol:', targetUrl);

        // Validate URL
        try {
            new URL(targetUrl);
        } catch (e) {
            console.error('Invalid URL format:', targetUrl);
            return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
        }

        console.log('Fetching:', targetUrl);
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5'
            },
            cache: 'no-store'
        });

        console.log('Fetch response status:', response.status);

        const contentType = response.headers.get('content-type');
        console.log('Content-Type:', contentType);

        if (!contentType || !contentType.includes('text/html')) {
            console.log('Not HTML, returning file/generic info');
            return NextResponse.json({
                url: targetUrl,
                title: targetUrl.split('/').pop() || '',
                description: 'File',
                image: '',
                siteName: new URL(targetUrl).hostname
            });
        }

        if (!response.ok) {
            throw new Error(`Failed to fetch URL. Status: ${response.status}`);
        }

        console.log('Parsing HTML text...');
        const html = await response.text();
        console.log('HTML length:', html.length);

        console.log('Initializing JSDOM...');
        const dom = new JSDOM(html);
        const doc = dom.window.document;

        const getMeta = (prop: string) =>
            doc.querySelector(`meta[property="${prop}"]`)?.getAttribute('content') ||
            doc.querySelector(`meta[name="${prop}"]`)?.getAttribute('content');

        const title = getMeta('og:title') || doc.title || '';
        const description = getMeta('og:description') || getMeta('description') || '';

        console.log('Extracted Title:', title);

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

        console.log('Extracted Image:', image);

        const siteName = getMeta('og:site_name') || new URL(targetUrl).hostname;

        return NextResponse.json({
            url: targetUrl,
            title,
            description,
            image,
            siteName
        });

    } catch (error: any) {
        console.error('CRITICAL Link Preview Error:', error);

        // Handle case where targetUrl is still empty/invalid if error happened very early
        let hostname = 'Error';
        try {
            if (targetUrl) hostname = new URL(targetUrl).hostname;
        } catch (e) {
            hostname = 'Invalid URL';
        }

        // Return 200 with fallback data to prevent UI crash
        return NextResponse.json({
            url: targetUrl || '',
            title: hostname,
            description: '',
            image: '',
            siteName: hostname
        });
    }
}
