import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/menu', '/order/*'],
      disallow: ['/kitchen/*', '/admin/*'],
    },
  };
}
