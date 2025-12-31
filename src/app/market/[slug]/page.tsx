
import SpecificMarketMain from "@/components/markets/specific-market/main";
import { PolymarketEvent } from "@/types";
import { baseUrl } from "@/utils";
import { Metadata } from "next";
import Link from "next/link";

interface MarketAPIResponse {
  data: PolymarketEvent;
  success: boolean;
  error?: string;
}

async function fetchMarketData(slug: string): Promise<PolymarketEvent> {
  const response = await fetch(`${baseUrl}/api/slug-market`, {
    method: "POST",
    body: JSON.stringify({ slug }),
    headers: { "Content-Type": "application/json" },
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch market: ${response.status}`);
  }

  const result: MarketAPIResponse = await response.json();



  if (!result.success) {
    throw new Error(result.error || "Failed to fetch market data");
  }

  if (!result.data) {
    throw new Error("Market not found");
  }

  return result.data;
}

// ✅ Dynamic Metadata - await params
export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params;

  try {
    const market = await fetchMarketData(slug);

    return {
      title: `${market.title} | Markium` || "Market | Polymarket",
      description: market.description || "View the latest market details on Polymarket.",
      keywords: Array.isArray(market.tags)
        ? market.tags.map(tag => tag.label)
        : ["crypto", "markets", "prediction", "blockchain"],

      alternates: {
        canonical: `${baseUrl}/market/${slug}`,
      },
      robots: {
        index: true,
        follow: true,
        nocache: false,
        googleBot: {
          index: true,
          follow: true,
          "max-image-preview": "large",
          "max-snippet": -1,
          "max-video-preview": -1,
        },
      },
      other: {
        "x-robots-tag": "index, follow",
      },
      openGraph: {
        title: market.title,
        description: market.description,
        url: `${baseUrl}/market/${slug}`,
        siteName: "Polymarket",
        type: "website",
        images: [
          {
            url: market.image || `${baseUrl}/default-og-image.jpg`,
            width: 1200,
            height: 630,
            alt: market.title,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: market.title,
        description: market.description,
        images: [market.image || `${baseUrl}/default-og-image.jpg`],
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Market Not Found",
      description: "The requested market could not be found.",
      robots: { index: false, follow: false },
    };
  }
}

// ✅ Page component - await params
export default async function MarketSlugPage({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params;
  const market = await fetchMarketData(slug)

  if (!market){
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div
        role="status"
        className="max-w-xl w-full bg-neutral-900/60 backdrop-blur-sm rounded-2xl shadow-lg p-8 text-center"
      >
        <svg
        className="mx-auto h-12 w-12 text-cyan-600 dark:text-cyan-400"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
        >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>

        <h2 className="mt-4 text-2xl font-semibold text-slate-900 dark:text-white">
        Market not available
        </h2>

        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
        The requested market could not be found. It may have been removed or the link is incorrect.
        </p>

        <div className="mt-6 flex justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center px-4 py-2 rounded-md bg-cyan-600 text-white text-sm font-medium hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          Go to home
        </Link>

        <Link
          href="/market"
          className="inline-flex items-center px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          Browse markets
        </Link>
        </div>
      </div>
      </div>
    )
  }

  return <SpecificMarketMain params={{ slug }} marketData={market} />;
}