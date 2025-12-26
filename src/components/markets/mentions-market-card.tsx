// src/components/markets/MentionMarketCard.tsx
"use client";

import { Clock, Circle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import type { MentionsEvent } from "@/hooks/polymarket/useMentionsEvents";

export function MentionMarketCard({ event }: { event: MentionsEvent }) {
    // Parse markets
    const markets = event.markets?.slice(0, 8) || []; // Show top 8

    // Format volume
    const formatVolume = (vol: number) => {
        if (vol >= 1000000) return `$${(vol / 1000000).toFixed(1)}M`;
        if (vol >= 1000) return `$${(vol / 1000).toFixed(0)}K`;
        return `$${vol.toFixed(0)}`;
    };

    // Format start time
    const formatStartTime = (dateStr?: string) => {
        if (!dateStr) return null;
        const date = new Date(dateStr);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
    };

    // Get status badge
    const getStatusBadge = () => {
        const status = event.streamStatus;
        if (status === 'LIVE') {
            return (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/20 border border-red-500/30">
                    <Circle className="w-2 h-2 fill-red-500 text-red-500 animate-pulse" />
                    <span className="text-xs font-semibold text-red-400">LIVE</span>
                </div>
            );
        }
        if (status === 'UPCOMING') {
            return (
                <div className="px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-500/30">
                    <span className="text-xs font-semibold text-blue-400">UPCOMING</span>
                </div>
            );
        }
        return null;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group"
        >
            <Card className="relative bg-transparent h-[420px] rounded-xl p-5 border border-gray-800/50 backdrop-blur-xl overflow-hidden transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-cyan-500/5">

                {/* Header */}
                <div className="flex items-start gap-4 mb-4">
                    <div className="relative">
                        <img
                            src={event.image || event.icon}
                            alt={event.title}
                            className="relative w-14 h-14 rounded-xl object-cover ring-2 ring-white/10 group-hover:ring-white/20 transition-all duration-300"
                        />
                    </div>

                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-white leading-tight line-clamp-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-300 transition-all duration-300">
                            {event.title}
                        </h3>

                        {/* Status + Start Time */}
                        <div className="flex items-center gap-2 mt-2">
                            {getStatusBadge()}
                            {event.startTime && (
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                    <Clock className="w-3 h-3" />
                                    <span>{formatStartTime(event.startTime)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Markets List */}
                <div className="space-y-2 overflow-y-auto h-72 scrollbar-hide">
                    {markets.map((market, index) => {
                        const outcomes = JSON.parse(market.outcomes || '["Yes", "No"]');
                        const prices = JSON.parse(market.outcomePrices || '[0.5, 0.5]');
                        const yesPrice = parseFloat(prices[0]);
                        const noPrice = parseFloat(prices[1]);
                        const yesPercentage = Math.round(yesPrice * 100);
                        const isResolved = market.umaResolutionStatus === 'resolved';

                        return (
                            <div
                                key={index}
                                className={`group/option flex items-center gap-3 p-2.5 rounded-xl bg-transparent border hover:border-gray-600/50 transition-all duration-300 hover:bg-gray-800/50 ${isResolved ? 'opacity-50' : ''
                                    }`}
                            >
                                <span className="flex-1 text-sm text-gray-200 font-medium truncate group-hover/option:text-white transition-colors">
                                    {market.groupItemTitle}
                                </span>

                                <div className="flex gap-1.5 opacity-70 group-hover/option:opacity-100 transition-opacity">
                                    <span className="text-xs text-gray-400">{yesPercentage}%</span>
                                    <button
                                        className="px-3 py-1.5 text-xs font-semibold bg-emerald-400/20 text-white border border-cyan-500/30 rounded-lg hover:bg-cyan-500/20 hover:border-cyan-500/50 transition-all duration-200 hover:scale-105 active:scale-95"
                                        disabled={isResolved}
                                    >
                                        {outcomes[0]}
                                    </button>
                                    <button
                                        className="px-3 py-1.5 text-xs font-semibold bg-red-500/40 text-white border border-pink-500/30 rounded-lg hover:bg-pink-500/20 hover:border-pink-500/50 transition-all duration-200 hover:scale-105 active:scale-95"
                                        disabled={isResolved}
                                    >
                                        {outcomes[1]}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-5 py-3 bg-neutral-950 border-t border-gray-700/30">
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs font-medium text-gray-400">
                            {formatVolume(event.volume)}
                        </span>
                    </div>
                    <span className="text-xs text-gray-500">
                        {event.markets?.length || 0} markets
                    </span>
                </div>
            </Card>
        </motion.div>
    );
}