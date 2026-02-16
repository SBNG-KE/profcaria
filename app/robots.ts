import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    // 1. Paths to protect from ALL crawlers (authenticated/sensitive areas)
    // These contain PII or paid content and should never be indexed.
    const protectedPaths = [
        '/api/',
        '/employer/',
        '/professional/',
        '/payment/',
        '/share/',
    ]

    // 2. Legacy/Deactivated routes (Components/Modals)
    // Prevent these from showing up in search results as standalone pages.
    const deactivatedRoutes = [
        '/auth', '/auth/',
        '/documentation', '/documentation/',
        '/contact', '/contact/',
        '/pricing', '/pricing/',
        '/security/setup', '/security/setup/',
        '/security/verify', '/security/verify/',
    ]

    // Combine all disallowed paths for cleaner usage below
    const allDisallowed = [...protectedPaths, ...deactivatedRoutes];

    // 3. AI Crawlers to explicitly ALLOW
    // We list these explicitly so they are not accidentally blocked if you 
    // restrict generic bots in the future.
    const aiCrawlers = [
        // --- OpenAI ---
        'GPTBot',               // GPT model training
        'ChatGPT-User',         // ChatGPT live browsing
        'OAI-SearchBot',        // OpenAI Search (SearchGPT)

        // --- Google ---
        'Google-Extended',      // Gemini & Vertex AI training

        // --- Anthropic (Claude) ---
        'ClaudeBot',            // Claude model training
        'Claude-Web',           // Claude live browsing

        // --- Apple ---
        'Applebot-Extended',    // Apple Intelligence training

        // --- Meta (Facebook) ---
        'Meta-ExternalAgent',   // Llama model training

        // --- Perplexity ---
        'PerplexityBot',        // Perplexity Search

        // --- Others ---
        'Cohere-ai',            // Cohere
        'Bytespider',           // ByteDance (TikTok/Doubao)
        'CCBot',                // Common Crawl (Base data for many models)
    ]

    return {
        rules: [
            // Rule A: General rule for all other bots (Googlebot, Bingbot, etc.)
            {
                userAgent: '*',
                allow: '/',
                disallow: allDisallowed,
            },
            // Rule B: Explicit whitelist for AI Bots
            // (Grouped together to keep robots.txt file size efficient)
            {
                userAgent: aiCrawlers,
                allow: '/',
                disallow: allDisallowed,
            },
        ],
        sitemap: 'https://www.profcaria.com/sitemap.xml',
    }
}