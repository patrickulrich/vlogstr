export function generateSitemap(baseUrl: string): string {
  const currentDate = new Date().toISOString();
  
  const urls = [
    {
      loc: baseUrl,
      lastmod: currentDate,
      changefreq: 'daily',
      priority: '1.0',
    },
    {
      loc: `${baseUrl}/discover`,
      lastmod: currentDate,
      changefreq: 'hourly',
      priority: '0.9',
    },
    {
      loc: `${baseUrl}/feed`,
      lastmod: currentDate,
      changefreq: 'hourly',
      priority: '0.8',
    },
  ];

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return xmlContent;
}

export function generateRobotsTxt(baseUrl: string): string {
  return `User-agent: *
Disallow: /dashboard
Disallow: /settings
Disallow: /profile

Allow: /
Allow: /discover
Allow: /feed
Allow: /video/*

# Block access to sensitive files
Disallow: /*.json$
Disallow: /api/
Disallow: /assets/

# Allow search engines to crawl content
Allow: /assets/*.css
Allow: /assets/*.js

Sitemap: ${baseUrl}/sitemap.xml`;
}