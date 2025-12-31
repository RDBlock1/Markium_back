
// app/server-sitemap.xml/route.ts
import { NextResponse } from "next/server";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://markiumpro.com";

interface BlogSlugData {
  slug: string;
  updatedAt?: string;
}

interface MarketSlugData {
  slug: string;
  updatedAt?: string;
}

/** Fetch blog slugs from internal API */
async function getBlogSlugs(): Promise<BlogSlugData[]> {
  try {
    const res = await fetch(`${SITE_URL}/api/sitemap/blogs`, { 
      next: { revalidate: 60 },
      cache: 'no-store' // Ensure fresh data for sitemap
    });
    
    if (!res.ok) {
      console.error('Failed to fetch blog slugs:', res.status);
      return [];
    }
    
    const data = await res.json();
    // Handle both array directly or object with blogs property
    return Array.isArray(data) ? data : (data.blogs || []);
  } catch (error) {
    console.error('Error fetching blog slugs:', error);
    return [];
  }
}

/** Fetch market slugs from internal API */
async function getMarketSlugs(): Promise<MarketSlugData[]> {
  try {
    const res = await fetch(`${SITE_URL}/api/sitemap/markets`, { 
      next: { revalidate: 60 },
      cache: 'no-store' // Ensure fresh data for sitemap
    });
    
    if (!res.ok) {
      console.error('Failed to fetch market slugs:', res.status);
      return [];
    }
    
    const data = await res.json();
    // Handle both array directly or object with markets property
    return Array.isArray(data) ? data : (data.markets || []);
  } catch (error) {
    console.error('Error fetching market slugs:', error);
    return [];
  }
}

export async function GET() {
  try {
    // Fetch data in parallel for better performance
    const [blogData, marketData] = await Promise.all([
      getBlogSlugs(),
      getMarketSlugs()
    ]);

    // Build sitemap entries with proper URL structure and timestamps
    const blogUrls = blogData
      .filter(blog => blog.slug) // Ensure slug exists
      .map(blog => ({
        loc: `${SITE_URL}/blog/${blog.slug}`, // Assuming blog route structure
        lastmod: blog.updatedAt ? new Date(blog.updatedAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)
      }));

    const marketUrls = marketData
      .filter(market => market.slug) // Ensure slug exists
      .map(market => ({
        loc: `${SITE_URL}/markets/${market.slug}`, // Assuming markets route structure
        lastmod: market.updatedAt ? new Date(market.updatedAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)
      }));

    // Add static pages
    const staticUrls = [
      { loc: SITE_URL, lastmod: new Date().toISOString().slice(0, 10) },
      { loc: `${SITE_URL}/about`, lastmod: new Date().toISOString().slice(0, 10) },
      { loc: `${SITE_URL}/blog`, lastmod: new Date().toISOString().slice(0, 10) },
      { loc: `${SITE_URL}/markets`, lastmod: new Date().toISOString().slice(0, 10) },
      // Add more static pages as needed
    ];

    const allUrls = [...staticUrls, ...blogUrls, ...marketUrls];

    // Generate XML with proper formatting
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    (url) => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${url.loc === SITE_URL ? '1.0' : '0.8'}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

    return new NextResponse(xml, {
      status: 200,
      headers: { 
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate' 
      },
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    
    // Return a basic sitemap on error
    const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}</loc>
    <lastmod>${new Date().toISOString().slice(0, 10)}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;

    return new NextResponse(fallbackXml, {
      status: 200,
      headers: { 'Content-Type': 'application/xml' },
    });
  }
}

