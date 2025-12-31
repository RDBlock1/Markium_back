/* eslint-disable react-hooks/preserve-manual-memoization */
/* eslint-disable @typescript-eslint/no-explicit-any */
// components/markets/market-grid.tsx
'use client';

import { MarketCard } from "@/components/markets/market-card";
import { useInfiniteTrendingEvents } from "@/hooks/polymarket/useTrendingEvents";
import { useMemo, useEffect } from "react";
import { useInView } from 'react-intersection-observer';
import { useFilterStore } from "@/store/filterStore";
import { motion, AnimatePresence } from "framer-motion";
import { Spinner } from "../ui/spinner";

function useDeduplicatedEvents(data: any) {
    return useMemo(() => {
        if (!data?.pages) return { all: [], featured: [], regular: [] };

        const uniqueEventsMap = new Map();

        data.pages.forEach((page: any) => {
            const events = page.data?.events || page.events || [];
            events.forEach((event: any) => {
                if (event?.id && !uniqueEventsMap.has(event.id)) {
                    uniqueEventsMap.set(event.id, event);
                }
            });
        });

        const allEvents = Array.from(uniqueEventsMap.values());
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

export function MarketGrid({ tagSlug }: { tagSlug?: string }) {
    // ⭐ Zustand store
    const { activeCategory, activeTag, sortBy, filters } = useFilterStore();

    // Determine tag to fetch
    const effectiveTag = activeTag !== 'all' ? activeTag :
        activeCategory !== 'trending' ? activeCategory :
            tagSlug;

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
    } = useInfiniteTrendingEvents({
        limit: 50,
        tagSlug: effectiveTag
    });

    const { all } = useDeduplicatedEvents(data);
    const { ref, inView } = useInView({ threshold: 0, rootMargin: '200px' });

    useEffect(() => {
        if (inView && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

    // ⭐ Apply Filters
    const filteredEvents = useMemo(() => {
        return all.filter((event: any) => {
            // ⭐ FIRST: Skip events with empty markets array
            if (!event.markets || event.markets.length === 0) {
                return false;
            }

            const eventTags = event.tags?.map((t: any) => t.slug.toLowerCase()) || [];
            const eventCategory = event.category?.toLowerCase() || '';
            const eventTitle = event.title?.toLowerCase() || '';

            if (filters.hideCrypto && (
                eventTags.includes('crypto') ||
                eventCategory.includes('crypto') ||
                eventTags.includes('bitcoin') ||
                eventTags.includes('ethereum')
            )) return false;

            if (filters.hideSports && (
                eventTags.includes('sports') ||
                eventCategory.includes('sports')
            )) return false;

            if (filters.hideMentions && eventTags.includes('mentions'))
                return false;

            if (filters.hideTrump && (
                eventTags.includes('trump') ||
                eventTitle.includes('trump')
            )) return false;

            if (filters.hidePolitics && (
                eventTags.includes('politics') ||
                eventCategory.includes('politics')
            )) return false;

            if (filters.hideElections && (
                eventTags.includes('elections') ||
                eventTitle.includes('election')
            )) return false;

            return true;
        });
    }, [all, filters]);

    // ⭐ Apply Sorting
    const sortedEvents = useMemo(() => {
        const sorted = [...filteredEvents];

        switch (sortBy) {
            case 'volume24hr':
                return sorted.sort((a, b) => (b.totalVolume24hr || 0) - (a.totalVolume24hr || 0));
            case 'totalVolume':
                return sorted.sort((a, b) => (b.totalVolume || 0) - (a.totalVolume || 0));
            case 'newest':
                return sorted.sort((a, b) =>
                    new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
                );
            case 'liquidity':
                return sorted.sort((a, b) => (b.totalLiquidity || 0) - (a.totalLiquidity || 0));
            case 'endingSoon':
                return sorted.sort((a, b) => {
                    const aEnd = new Date(a.endDate || '9999-12-31').getTime();
                    const bEnd = new Date(b.endDate || '9999-12-31').getTime();
                    return aEnd - bEnd;
                });
            case 'competitive':
                return sorted.sort((a, b) => (b.competitive || 0) - (a.competitive || 0));
            default:
                return sorted;
        }
    }, [filteredEvents, sortBy]);

    if (isLoading) {
        return (
            <div className="flex justify-center py-12 my-auto h-full w-full">
                <Spinner className="size-10" />
            </div>
        );
    }

    return (
        <div>
            <AnimatePresence mode="popLayout">
                <motion.div
                    layout
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-4"
                >
                    {sortedEvents.map((market: any, index: number) => (
                        <motion.div
                            key={market.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{
                                duration: 0.3,
                                delay: Math.min(index * 0.02, 0.3), // Max delay 300ms
                                layout: { type: "spring", stiffness: 350, damping: 25 }
                            }}
                        >
                            <MarketCard market={market} />
                        </motion.div>
                    ))}
                </motion.div>
            </AnimatePresence>

            {/* Infinite scroll trigger */}
            {hasNextPage && (
                <div ref={ref} className="text-center py-8 text-gray-500">
                    {isFetchingNextPage ? (
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-6 h-6 border-4 border-gray-600 border-t-transparent rounded-full mx-auto"
                        />
                    ) : (
                        'Scroll for more'
                    )}
                </div>
            )}

            {/* End indicator */}
            {!hasNextPage && sortedEvents.length > 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-8 text-gray-500"
                >
                    You&#39;ve reached the end! ({sortedEvents.length} markets shown)
                </motion.div>
            )}

            {/* No results */}
            {sortedEvents.length === 0 && !isLoading && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-12"
                >
                    <p className="text-lg font-semibold text-gray-300">No markets found</p>
                    <p className="text-sm text-gray-500 mt-2">Try adjusting your filters</p>
                </motion.div>
            )}
        </div>
    );
}