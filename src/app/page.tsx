
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { SearchAndFilters } from '@/components/markets/search-and-filters';
import { MarketPageContent } from '@/components/markets/market-page-content';

import Hero from '@/components/home-page/hero-section';
import { Metadata } from 'next';
import { FeaturesGrid } from '@/components/home-page/feature-grid';
import { motion } from 'framer-motion';
import HeadingMarkets from '@/components/home-page/heading-markets';



export const metadata: Metadata = {
  metadataBase: new URL('https://markiumpro.com'),
  title: {
    default: 'Markium -  Prediction Markets, Pre-IPO and Tokenized Assets Platform',
    template: '%s | Markium - Prediction Trading Platform'
  },
  description: 'Trade on real-world events and outcomes with Markium. Bet on politics, sports, crypto, and current events with real money. Also, access data and trade on Pre IPO stocks and Tokenized Assets.',
  keywords: [
    'pre-IPO investment',
    'pre-IPO shares for sale',
    'invest in pre-IPO companies',
    'private equity pre-IPO',
    'pre-IPO stock opportunities',
    'early-stage investments',
    'pre-IPO investment platforms',
    'pre-IPO funding rounds',
    'best pre-IPO opportunities',
    'pre-IPO vs IPO',
    'prediction markets',
    'event trading',
    'outcome betting',
    'political betting',
    'election prediction',
    'sports betting markets',
    'crypto prediction',
    'event outcomes',
    'prediction trading',
    'binary options',
    'yes no markets',
    'real money betting',
    'outcome trading',
    'event betting platform',
    'prediction platform',
    'market making',
    'probability trading',
    'conditional markets',
    'event speculation',
    'future events betting',
    'crowd prediction',
    'wisdom of crowds',
    'information markets',
    'decision markets',
    'event derivatives',
    'outcome markets',
    'prediction exchange',
    'betting exchange',
    'event odds',
    'market probabilities',
    'real world events',
    'current events betting',
    'news prediction',
    'political outcomes',
    'election markets',
    'sports outcomes',
    'entertainment betting',
    'award show prediction',
    'reality prediction',
    'event forecasting',
    'probability betting',
    "tokenized real estate",
    "tokenized private equity",
    "tokenized assets platform",
    "blockchain tokenization",
    "tokenized stocks",
    "tokenized commodities",
    "digital securities",
    "fractional ownership via tokenization",
    "tokenized bonds",
    "tokenized art investment",

  ],
  authors: [{ name: 'Markium Team' }],
  creator: 'Markium',
  publisher: 'Markium',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://markiumpro.com',
    title: 'MarkiumPro - Prediction Markets & Event Trading Platform',
    description: 'Trade on real-world events and outcomes. Bet on politics, sports, crypto, and current events with real money. Advanced prediction markets with instant settlements.',
    siteName: 'MarkiumPro',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'MarkiumPro Prediction Markets Trading Dashboard'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MarkiumPro - Prediction Markets Platform',
    description: 'Trade on real-world events and outcomes. Bet on politics, sports, crypto with real money on our prediction markets platform.',
    images: ['/twitter-card.jpg'],
    creator: '@markiumpro'
  },
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
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
    yahoo: 'your-yahoo-verification-code'
  },
  category: 'finance',
  classification: 'Prediction Markets Platform',
  alternates: {
    canonical: 'https://markiumpro.com',
    languages: {
      'en-US': 'https://markiumpro.com',
      'en-GB': 'https://markiumpro.com/en-gb'
    }
  }
}

// Server component wrapper
export default async function MarketsPage({
  searchParams
}: {
  searchParams: Promise<{ tag?: string }>;
}) {
  const params = await searchParams;
  const queryClient = new QueryClient();

  // Prefetch regular events (for non-mentions categories)
  await queryClient.prefetchInfiniteQuery({
    queryKey: ['events', 'trending', 'infinite', { limit: 50, tagSlug: params.tag }],
    queryFn: () =>
      api.get('/events/trending', {
        params: { limit: 50, offset: 0, tag_slug: params.tag }
      }).then(res => res.data),
    initialPageParam: 0,
  });

  // Prefetch mentions if needed
  await queryClient.prefetchInfiniteQuery({
    queryKey: ['events', 'mentions', 'infinite'],
    queryFn: () =>
      api.get('/events/mentions', { params: { limit: 20, offset: 0 } })
        .then(res => res.data),
    initialPageParam: 0,
  });

  return (
    <div>



      <HydrationBoundary state={dehydrate(queryClient)}>

        <Hero />
        <FeaturesGrid />
        <div className="container mx-auto px-4 py-8">
          <HeadingMarkets />
          <SearchAndFilters />
          <MarketPageContent tagSlug={params.tag} />
        </div>
      </HydrationBoundary>
    </div>
  );
}

