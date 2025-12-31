
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { SearchAndFilters } from '@/components/markets/search-and-filters';
import { MarketPageContent } from '@/components/markets/market-page-content';
import { FeaturedMarkets } from '@/components/markets/featured-markets';
import { Metadata } from 'next';



export const metadata:Metadata = {
    title:"Markets of polymarket and kalshi | Markium",
    description:"Explore the latest markets of polymarket and kalshi on Markium ",
    keywords:["markets", "trending", "crypto"],
    creator:"Markium",
    publisher:"Markium",
    alternates:{
        canonical:"https://markiumpro.com/market"
    },
    openGraph:{
        title:"Markets of polymarket and kalshi | Markium",
        description:"Explore the latest markets of polymarket and kalshi on Markium",
        url:"https://markiumpro.com/market",
        siteName:"Markium",
        images:[
            {
                url:"https://markiumpro.com/og-image.png",
                width:1200,
                height:630,
                alt:"Markium - Explore the latest markets"
            }
        ]
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
        <HydrationBoundary state={dehydrate(queryClient)}>

            <div className="container mx-auto px-4 py-8">
                <FeaturedMarkets />
                <SearchAndFilters />
                <MarketPageContent tagSlug={params.tag} />
            </div>
        </HydrationBoundary>
    );
}

