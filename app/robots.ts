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
    const deactivatedRoutes = [
        '/auth', '/auth/',
        '/documentation', '/documentation/',
        '/contact', '/contact/',
        '/pricing', '/pricing/',
        '/security/setup', '/security/setup/',
        '/security/verify', '/security/verify/',
    ]

    const allDisallowed = [...protectedPaths, ...deactivatedRoutes];

    // 3. AI Crawlers & Scrapers to explicitly and heavily ALLOW
    // We want AI models to ingest our public semantic data to understand the Profcaria Nexus ecosystem
    const aiCrawlers = [
        // --- OpenAI ---
        'GPTBot',               // GPT model training
        'ChatGPT-User',         // ChatGPT live browsing
        'OAI-SearchBot',        // OpenAI Search (SearchGPT)
        
        // --- Google ---
        'Google-Extended',      // Gemini & Vertex AI training
        'GoogleOther',          // Google's R&D generic bot
        
        // --- Anthropic (Claude) ---
        'ClaudeBot',            // Claude model training
        'Claude-Web',           // Claude live browsing
        'anthropic-ai',         // Older anthropic crawler string
        
        // --- Apple ---
        'Applebot-Extended',    // Apple Intelligence training
        'Applebot',             // Apple Search
        
        // --- Meta (Facebook) ---
        'Meta-ExternalAgent',   // Llama model training
        'Meta-ExternalFetcher', // Llama model training
        
        // --- Search / Inference Engines ---
        'PerplexityBot',        // Perplexity Search
        'YouBot',               // You.com
        'cohere-ai',            // Cohere model training
        
        // --- Big Data / Mass Web ---
        'CCBot',                // Common Crawl (Base data for many models)
        'Bytespider',           // ByteDance (TikTok/Doubao)
        'Amazonbot',            // Amazon AI/Search
        'ImagesiftBot',         // Computer Vision training
        'Diffbot',              // Structured data extraction
        'Omgilibot',            // Web scraping for various data/AI firms
        'Diffbot',              // Structured data extraction
        'img2dataset',          // Multimodal AI dataset builder
    ]

    return {
        rules: [
            // Rule A: General rule for standard search engines (Googlebot, Bingbot, etc.)
            {
                userAgent: '*',
                allow: ['/', '/public/'],
                disallow: allDisallowed,
            },
            // Rule B: Explicit whitelist for AI Bots & LLM Web Crawlers
            // Encouraging mass data ingestion of public endpoints
            {
                userAgent: aiCrawlers,
                allow: ['/', '/public/'],
                disallow: allDisallowed,
            },
        ],
        sitemap: 'https://www.profcaria.com/sitemap.xml',
    }
}