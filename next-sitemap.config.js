/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://markiumpro.com',
  generateRobotsTxt: true,
  sitemapSize: 45000, // chunk size
  changefreq: 'weekly',
  priority: 0.7,
  // If you generate a server-side dynamic sitemap (server-sitemap.xml), add it here:
  robotsTxtOptions: {
    additionalSitemaps: [
      'https://markiumpro.com/server-sitemap.xml', // your dynamic sitemap route
    ],
  },
  // Optionally exclude admin or other paths:
  exclude: ['/admin/*', '/api/*'],
};
