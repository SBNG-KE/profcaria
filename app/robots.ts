import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/api/', '/employer/dashboard/', '/professional/dashboard/'], // Hide private areas if desired, though auth protects them
        },
        sitemap: 'https://www.profcaria.com/sitemap.xml',
    }
}
