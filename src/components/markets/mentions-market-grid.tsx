/* eslint-disable react-hooks/preserve-manual-memoization */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/markets/MentionsMarketGrid.tsx
'use client';

import { MentionMarketCard } from "@/components/markets/mentions-market-card";
import { useInfiniteMentionsEvents } from "@/hooks/polymarket/useMentionsEvents";
import { useMemo, useEffect } from "react";
import { useInView } from 'react-intersection-observer';
import { motion } from "framer-motion";

export function MentionsMarketGrid() {
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        error
    } = useInfiniteMentionsEvents();

    const { ref, inView } = useInView({ threshold: 0, rootMargin: '200px' });

    useEffect(() => {
        if (inView && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

    // ⭐ FIXED: Extract events from {success, data, meta} structure
    const allEvents = useMemo(() => {
        if (!data?.pages) return [];


        const uniqueEventsMap = new Map();

        data.pages.forEach((page: any, pageIndex: number) => {
            // ⭐ FIX: Page is now { success: true, data: [...events], meta: {...} }
            // We need to extract page.data
            let events = [];

            if (page?.data && Array.isArray(page.data)) {
                // New structure: { success, data: [...], meta }
                events = page.data;
                console.log(`Page ${pageIndex}: Found ${events.length} events in page.data`);
            } else if (Array.isArray(page)) {
                // Fallback: Direct array (old structure)
                events = page;
                console.log(`Page ${pageIndex}: Found ${events.length} events (direct array)`);
            } else {
                console.warn(`Page ${pageIndex}: Unknown structure`, page);
            }

            events.forEach((event: any) => {
                if (event?.id && !uniqueEventsMap.has(event.id)) {
                    uniqueEventsMap.set(event.id, event);
                }
            });
        });

        const result = Array.from(uniqueEventsMap.values());
        console.log(`Total unique events: ${result.length}`);

        return result;
    }, [data?.pages]);

    // Separate LIVE and UPCOMING
    const liveEvents = useMemo(() => {
        const live = allEvents.filter((e: any) => e.streamStatus === 'LIVE');
        console.log(`LIVE events: ${live.length}`);
        return live;
    }, [allEvents]);

    const upcomingEvents = useMemo(() => {
        const upcoming = allEvents.filter((e: any) => e.streamStatus === 'UPCOMING');
        console.log(`UPCOMING events: ${upcoming.length}`);
        return upcoming;
    }, [allEvents]);

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full"
                />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12 text-red-400">
                <p>Failed to load mentions events</p>
                <p className="text-sm text-gray-400 mt-2">{error.message}</p>
            </div>
        );
    }

    return (
        <div>
            {/* Debug info - Remove after testing */}
            {process.env.NODE_ENV === 'development' && (
                <div className="mb-4 p-3 bg-gray-800/50 rounded text-xs font-mono">
                    <div className="text-gray-400">
                        Total: {allEvents.length} | LIVE: {liveEvents.length} | UPCOMING: {upcomingEvents.length}
                    </div>
                </div>
            )}

            {/* LIVE Events Section */}
            {liveEvents.length > 0 && (
                <section className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <h2 className="text-xl font-bold text-white">Live Now</h2>
                        <span className="text-sm text-gray-500">({liveEvents.length})</span>
                    </div>

                    <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {liveEvents.map((event: any) => (
                            <MentionMarketCard key={event.id} event={event} />
                        ))}
                    </motion.div>
                </section>
            )}

            {/* UPCOMING Events Section */}
            {upcomingEvents.length > 0 && (
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <h2 className="text-xl font-bold text-white">Upcoming</h2>
                        <span className="text-sm text-gray-500">({upcomingEvents.length})</span>
                    </div>

                    <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {upcomingEvents.map((event: any) => (
                            <MentionMarketCard key={event.id} event={event} />
                        ))}
                    </motion.div>
                </section>
            )}

            {/* Infinite scroll trigger */}
            {hasNextPage && (
                <div ref={ref} className="text-center py-8 text-gray-500">
                    {isFetchingNextPage ? 'Loading more...' : 'Scroll for more'}
                </div>
            )}

            {/* No results */}
            {allEvents.length === 0 && !isLoading && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12"
                >
                    <p className="text-lg font-semibold text-gray-300">No mention events available</p>
                    <p className="text-sm text-gray-500 mt-2">Check back later for live events</p>
                </motion.div>
            )}
        </div>
    );
}