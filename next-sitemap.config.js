/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: "https://markiumpro.com", // <-- change this to your domain
  generateRobotsTxt: true,           // will generate robots.txt
  sitemapSize: 7000,                 // split sitemap if you have 7000+ URLs
  outDir: "./public",                // outputs sitemap/robots to public/
};
