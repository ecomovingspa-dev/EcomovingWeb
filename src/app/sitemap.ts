import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
    return [
        {
            url: 'https://www.ecomoving.cl',
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 1,
        },
        // Future dynamic routes would go here (e.g. products, blog)
    ];
}
