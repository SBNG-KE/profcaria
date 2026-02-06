import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    // Paths to protect from all crawlers (authenticated/sensitive areas)
    const protectedPaths = [
        '/api/',
        '/employer/',
        '/professional/',
        '/payment/',
        '/share/',
    ]

    // Legacy routes that are now modals/components within main layout
    // These pages exist but should not be crawled as separate pages
    const deactivatedRoutes = [
        '/auth',
        '/auth/',
        '/documentation',
        '/documentation/',
        '/contact',
        '/contact/',
        '/pricing',
        '/pricing/',
        '/security/setup',
        '/security/setup/',
        '/security/verify',
        '/security/verify/',
    ]

    // AI crawlers to explicitly allow for public content
    const aiCrawlers = [
        'GPTBot',           // OpenAI's ChatGPT crawler
        'ChatGPT-User',     // ChatGPT browse feature
        'Google-Extended',  // Google AI (Gemini/Bard)
        'ClaudeBot',        // Anthropic's Claude
        'anthropic-ai',     // Anthropic general crawler
        'PerplexityBot',    // Perplexity AI
        'Cohere-ai',        // Cohere
        'Bytespider',       // ByteDance AI
        'CCBot',            // Common Crawl (used by many AI models)
    ]

    return {
        rules: [
            // Default rule for all crawlers
            {
                userAgent: '*',
                allow: '/',
                disallow: [...protectedPaths, ...deactivatedRoutes],
            },
            // Specific rules for AI crawlers - allow public content (homepage only)
            ...aiCrawlers.map(bot => ({
                userAgent: bot,
                allow: ['/'],
                disallow: [...protectedPaths, ...deactivatedRoutes],
            })),
        ],
        sitemap: 'https://www.profcaria.com/sitemap.xml',
    }
}
