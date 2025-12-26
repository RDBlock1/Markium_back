/* eslint-disable react-hooks/preserve-manual-memoization */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/markets/trending-market-list.tsx
'use client';

import { useInfiniteTrendingEvents } from '@/hooks/polymarket/useTrendingEvents';
import { useInView } from 'react-intersection-observer';
import { useEffect, useMemo } from 'react';



// components/markets/FeaturedCard.tsx
import Image from 'next/image';
import Link from 'next/link';

export function FeaturedCard({ event }: { event: any }) {
    return (
        <Link href={`/event/${event.slug}`}>
            <div className="border-2 border-yellow-400 rounded-lg p-6 hover:shadow-2xl bg-gradient-to-br from-yellow-50 to-white">
                <div className="absolute top-2 right-2 bg-yellow-400 px-3 py-1 rounded-full text-xs font-bold">
                    ⭐ FEATURED #{event.featuredOrder}
                </div>

                {event.image && (
                    <div className="relative h-56 mb-4 rounded overflow-hidden">
                        <Image src={event.image} alt={event.title} fill className="object-cover" />
                    </div>
                )}

                <h3 className="font-bold text-xl mb-3">{event.title}</h3>

                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/80 rounded p-3">
                        <p className="text-xs text-gray-600">24h Volume</p>
                        <p className="font-bold">${(event.totalVolume24hr / 1000000).toFixed(1)}M</p>
                    </div>
                    <div className="bg-white/80 rounded p-3">
                        <p className="text-xs text-gray-600">Markets</p>
                        <p className="font-bold">{event.markets.length}</p>
                    </div>
                </div>
            </div>
        </Link>
    );
}

export function EventCard({ event }: { event: any }) {
    return (
        <Link href={`/event/${event.slug}`}>
            <div className="border rounded-lg p-4 hover:shadow-lg">
                {event.image && (
                    <div className="relative h-48 mb-4">
                        <Image src={event.image} alt={event.title} fill className="object-cover rounded" />
                    </div>
                )}

                <h3 className="font-semibold text-lg mb-2">{event.title}</h3>

                <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex justify-between">
                        <span>24h Volume:</span>
                        <span className="font-semibold">${(event.totalVolume24hr / 1000000).toFixed(2)}M</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Markets:</span>
                        <span className="font-semibold">{event.markets.length}</span>
                    </div>
                </div>

                <div className={`mt-3 px-2 py-1 text-xs rounded inline-block
          ${event.tier === 'HOT' ? 'bg-red-100 text-red-800' : ''}
          ${event.tier === 'ACTIVE' ? 'bg-green-100 text-green-800' : ''}
        `}>
                    {event.tier}
                </div>
            </div>
        </Link>
    );
}

function useDeduplicatedEvents(data: any) {
    return useMemo(() => {
        if (!data?.pages) return { all: [], featured: [], regular: [] };

        // Flatten and deduplicate in one pass
        const uniqueEventsMap = new Map();

        data.pages.forEach((page: { data: { events: any; }; events: any; }) => {
            const events = page.data?.events || page.events || [];
            events.forEach((event: any) => {
                if (event?.id && !uniqueEventsMap.has(event.id)) {
                    uniqueEventsMap.set(event.id, event);
                }
            });
        });

        const allEvents = Array.from(uniqueEventsMap.values());

        // Separate in one pass
        const featured: any[] = [];
        const regular: any[] = [];

        allEvents.forEach(event => {
            if (event.featured) {
                featured.push(event);
            } else {
                regular.push(event);
            }
        });

        return { all: allEvents, featured, regular };
    }, [data?.pages]);
}


export function TrendingMarketsList({ tagSlug }: { tagSlug?: string }) {
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
    } = useInfiniteTrendingEvents({ limit: 50, tagSlug });

    const { all, featured, regular } = useDeduplicatedEvents(data);


    const { ref, inView } = useInView({ threshold: 0, rootMargin: '200px' });

    useEffect(() => {
        if (inView && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);



    // ⭐ Separate featured and regular (from deduplicated list)
    const featuredEvents = useMemo(() =>
        featured,
        [featured]
    );

    const regularEvents = useMemo(() =>
        regular,
        [regular]
    );

    if (isLoading) {
        return <div className="flex justify-center py-12">Loading...</div>;
    }

    return (
        <div className="space-y-12">
            {/* Featured Section */}
            {featuredEvents.length > 0 && (
                <section>
                    <h2 className="text-2xl font-bold mb-6">⭐ Featured Markets</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {featuredEvents.map(event => (
                            <FeaturedCard
                                key={event.id}
                                event={event}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Regular Markets */}
            <section>
                <h2 className="text-2xl font-bold mb-6">
                    {featuredEvents.length > 0 ? 'More Markets' : 'All Markets'}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {regularEvents.map(event => (
                        <EventCard
                            key={event.id}
                            event={event}
                        />
                    ))}
                </div>
            </section>


            {/* Infinite Scroll Trigger */}
            {hasNextPage && (
                <div ref={ref} className="text-center py-8">
                    {isFetchingNextPage ? 'Loading more...' : 'Scroll for more'}
                </div>
            )}

            {/* End of list */}
            {!hasNextPage && all.length > 0 && (
                <div className="text-center py-8 text-gray-500">
                    You&#39;ve reached the end! ({all.length} markets total)
                </div>
            )}
        </div>
    );
}