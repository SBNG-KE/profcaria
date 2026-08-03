import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const privatePaths = ['/api/', '/employer/', '/professional/', '/work/', '/settings/', '/admin/', '/payment/', '/share/'];
  const aiCrawlers = ['GPTBot','ChatGPT-User','OAI-SearchBot','Google-Extended','ClaudeBot','Claude-Web','anthropic-ai','PerplexityBot','Applebot-Extended','Meta-ExternalAgent','CCBot'];
  return {
    rules: [
      { userAgent: '*', allow: ['/', '/jobs/', '/api/jobs'], disallow: privatePaths },
      { userAgent: aiCrawlers, allow: ['/', '/jobs/', '/api/jobs'], disallow: privatePaths },
    ],
    sitemap: 'https://www.profcaria.com/sitemap.xml',
    host: 'https://www.profcaria.com',
  };
}
