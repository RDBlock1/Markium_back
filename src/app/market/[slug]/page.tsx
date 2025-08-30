
import { baseUrl } from "@/utils";
import { Metadata } from 'next';
import MarketDetailSection from "@/components/market/market-detail-section";

// Fetch market data function (reusable)
async function fetchMarketData(slug: string) {
  const res = await fetch(`${baseUrl}/api/slug-market`, {
    method: 'POST',
    body: JSON.stringify({ slug }),
    headers: { 'Content-Type': 'application/json' },
    // Add caching for better performance
    next: { revalidate: 300 } // 5 minutes cache
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch market data');
  }
  
  const marketData = await res.json();
  return marketData.data[0];
}

// Dynamic metadata generation
export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}): Promise<Metadata> {
  const slug = (await params).slug;
  
  try {
    const market = await fetchMarketData(slug);
    
    // Extract key information for SEO
    const marketName = market.question || 'Prediction Market';
    const description = market.description || 'Trade on this prediction market outcome';
    const tags = market.tags || [];
    const category = market.category || 'General';
    const endDate = market.endDate ? new Date(market.endDate).toLocaleDateString() : '';
    const currentPrice = market.currentPrice || market.probability || '';
    const volume = market.volume || '';
    
    // Create SEO-optimized title
    const seoTitle = `${marketName} - Prediction Market | MarkiumPro`;
    
    // Enhanced description with key market info
    const seoDescription = `${description.slice(0, 120)}... Current odds: ${currentPrice}. ${endDate ? `Resolves: ${endDate}.` : ''} Trade on MarkiumPro prediction markets.`;
    
    // Comprehensive keywords
    const keywords = [
      ...tags,
      'prediction market',
      'event betting',
      'outcome trading',
      category.toLowerCase(),
      marketName.toLowerCase().split(' '),
      'real money betting',
      'market odds',
      'event prediction',
      'trading platform'
    ].flat().filter(Boolean);
    
    // Create structured data for rich snippets
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": marketName,
      "description": description,
      "category": category,
      "url": `https://markiumpro.com/market/${slug}`,
      "offers": {
        "@type": "Offer",
        "price": currentPrice,
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock"
      },
      "brand": {
        "@type": "Brand",
        "name": "MarkiumPro"
      },
      "aggregateRating": volume ? {
        "@type": "AggregateRating",
        "ratingValue": "4.5",
        "reviewCount": Math.floor(parseFloat(volume) / 100) || "10"
      } : undefined
    };
    
    return {
      title: seoTitle,
      description: seoDescription,
      keywords: keywords.slice(0, 20), // Limit to 20 most relevant keywords
      
      // OpenGraph for social sharing
      openGraph: {
        title: `${marketName} - Live Prediction Market`,
        description: seoDescription,
        url: `https://markiumpro.com/market/${slug}`,
        type: 'website',
        siteName: 'MarkiumPro',
        images: [
          {
            url: market.image || '/og-market-default.jpg',
            width: 1200,
            height: 630,
            alt: `${marketName} prediction market chart`
          }
        ],
        locale: 'en_US'
      },
      
      // Twitter Card
      twitter: {
        card: 'summary_large_image',
        title: `${marketName} - Prediction Market`,
        description: `Current odds: ${currentPrice} | ${description.slice(0, 100)}...`,
        images: [market.image || '/twitter-market-default.jpg'],
        creator: '@markiumpro'
      },
      
      // Additional SEO
      alternates: {
        canonical: `https://markiumpro.com/market/${slug}`
      },
      
      // Robots
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
      
      // Additional metadata
      category: 'Prediction Markets',
      classification: `${category} Market`,
      
      // Rich snippets data
      other: {
        'structured-data': JSON.stringify(structuredData)
      }
    };
    
  } catch (error) {
    console.error('Error generating metadata for market:', slug, error);
    
    // Fallback metadata if market fetch fails
    return {
      title: `Market ${slug} - MarkiumPro Prediction Markets`,
      description: 'Trade on real-world events and outcomes with MarkiumPro prediction markets platform.',
      keywords: ['prediction market', 'event trading', 'outcome betting'],
      openGraph: {
        title: `Market ${slug} - MarkiumPro`,
        description: 'Trade on real-world events and outcomes',
        url: `https://markiumpro.com/market/${slug}`,
        images: [{ url: '/og-market-fallback.jpg', width: 1200, height: 630 }]
      },
      robots: {
        index: true,
        follow: true
      }
    };
  }
}

// Main page component
export default async function MarketPage({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}) {
  const slug = (await params).slug;
  
  try {
    const marketData = await fetchMarketData(slug);
    console.log('Market Data:', marketData);
    
    return (
      <div className="overflow-y-auto">
        {/* Structured Data Script */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              "itemListElement": [
                {
                  "@type": "ListItem",
                  "position": 1,
                  "name": "Home",
                  "item": "https://markiumpro.com"
                },
                {
                  "@type": "ListItem", 
                  "position": 2,
                  "name": "Markets",
                  "item": "https://markiumpro.com/markets"
                },
                {
                  "@type": "ListItem",
                  "position": 3,
                  "name": marketData.name,
                  "item": `https://markiumpro.com/market/${slug}`
                }
              ]
            })
          }}
        />

          <MarketDetailSection 
            params={{ slug }} 
            marketData={marketData} 
          />
      </div>
    );
    
  } catch (error) {
    console.error('Error loading market:', error);
    
    // Error fallback
    return (
      <div className="overflow-y-auto">
        <div className="container mx-auto px-4 py-8">
          <h1>Market Not Found</h1>
          <p>The requested market could not be loaded.</p>
        </div>
      </div>
    );
  }
}