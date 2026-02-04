import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    console.log('Link Preview API called (Regex Version)');
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

        // Zero-dependency Regex Parser to avoid JSDOM/ESM issues
        const getMetaContent = (propName: string, propValue: string) => {
            const regex = new RegExp(`<meta[^>]*${propName}=["']${propValue}["'][^>]*content=["']([^"']*)["']`, 'i');
            const match = html.match(regex);
            return match ? match[1] : null;
        };

        const getTitle = () => {
            const ogTitle = getMetaContent('property', 'og:title');
            if (ogTitle) return ogTitle;
            const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
            return match ? match[1] : '';
        };

        const getDescription = () => {
            return getMetaContent('property', 'og:description') ||
                getMetaContent('name', 'description') || '';
        };

        const getImage = () => {
            let img = getMetaContent('property', 'og:image') ||
                getMetaContent('property', 'twitter:image');

            if (!img) {
                const linkMatch = html.match(/<link[^>]*rel=["']image_src["'][^>]*href=["']([^"']*)["']/i);
                img = linkMatch ? linkMatch[1] : '';
            }
            return img;
        };

        const getSiteName = () => {
            return getMetaContent('property', 'og:site_name') || new URL(targetUrl).hostname;
        };

        const title = getTitle();
        const description = getDescription();
        let image = getImage() || '';
        const siteName = getSiteName();

        console.log('Extracted Title:', title);

        // Fix relative image URLs
        if (image && !image.match(/^https?:\/\//i)) {
            try {
                image = new URL(image, targetUrl).toString();
            } catch (e) {
                image = '';
            }
        }

        console.log('Extracted Image:', image);

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
