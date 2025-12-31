/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { Clock, Flame } from "lucide-react"
import { Card } from "@/components/ui/card"
import Link from 'next/link'

export function MarketCard({ market }: { market: any }) {

    // Parse volume to determine if it's hot
    const volumeNum = parseFloat(market.volume || 0)
    const isHot = volumeNum > 10000000 // $10M+
    // Get top 3 teams by probability (lowest outcomePrices[0] = highest probability)
    const insideMarkets = market.markets
        ?.map((m: any) => ({
            name: m.groupItemTitle,
            percentage: Math.round((1 - parseFloat(m.outcomePrices[0] || 1)) * 100),
            price: m.outcomePrices[0],
            image: m.image,
            outcomePrices: m.outcomePrices,
            volume: m.volume
        }))
        ?.sort((a: any, b: any) => b.percentage - a.percentage)

    const dominantYes = insideMarkets[0]?.percentage > 50

    // Format volume
    const formatVolume = (vol: number) => {
        if (vol >= 1000000) return `$${(vol / 1000000).toFixed(1)}M`
        if (vol >= 1000) return `$${(vol / 1000).toFixed(0)}K`
        return `$${vol.toFixed(0)}`
    }

    // Format end date
    const formatEndDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }



    return (
        <div className="group relative" >


            {/* Main card */}
           <Link href={`/market/${market.slug}`}>
                <Card className="relative bg-transparent h-80 rounded-xl p-5 border border-gray-800/50 backdrop-blur-xl overflow-hidden transition-all duration-300  group-hover:shadow-2xl group-hover:shadow-cyan-500/5">

                    {/* Hot badge */}
                    {isHot && (
                        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30">
                            <Flame className="w-3 h-3 text-orange-400" />
                        </div>
                    )}

                    {/* Header */}
                    <div className="flex items-start gap-4 ">
                        <div className="relative">
                            <div
                                className={`absolute inset-0 rounded-xl blur-md transition-opacity duration-300 ${dominantYes ? "bg-cyan-500/30" : "bg-pink-500/30"
                                    } opacity-0 group-hover:opacity-100`}
                            />
                            <img
                                src={market.image || "/placeholder.svg"}
                                alt={market.title}
                                className="relative w-12 h-12 rounded-xl object-cover ring-2 ring-white/10 group-hover:ring-white/20 transition-all duration-300"
                            />
                        </div>
                        <div className="flex-1 min-w-0 ">
                            <h3 className="text-[15px]  font-semibold text-white leading-snug group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-300 transition-all duration-300 ">
                                {market.title}
                            </h3>
                        </div>
                    </div>

                    {/* Top Teams List */}
                    <div className="space-y-2.5 overflow-y-scroll h-56 scrollbar-hide">
                        {insideMarkets.map((team: any, index: number) => {
                            const prices = team.outcomePrices;
                            // Calculate percentages (probability)
                            let noPrice = parseFloat(prices[0]) || 0
                            let yesPrice = parseFloat(prices[1]) || 0

                            // If a price is exactly 1.5, treat it as full 2
                            const EPS = 1e-9
                            if (Math.abs(noPrice - 1.5) < EPS) noPrice = 2
                            if (Math.abs(yesPrice - 1.5) < EPS) yesPrice = 2

                            const noPercentage = Math.round((1 - yesPrice) * 100)



                            return (
                                <div
                                    key={index}
                                    className="group/option flex items-center gap-3 p-2.5 rounded-xl bg-transparent border hover:border-gray-600/50 transition-all duration-300 hover:bg-gray-800/50"
                                >

                                    {/* Team logo */}
                                    <img
                                        src={team.image}
                                        alt={team.name}
                                        className="w-6 h-6 rounded object-cover"
                                    />

                                    <span className="flex-1 text-sm text-gray-200 font-medium truncate group-hover/option:text-white transition-colors">
                                        {team.name}
                                    </span>


                                    {/* Action buttons */}
                                    <div className="flex gap-1.5 opacity-70 group-hover/option:opacity-100 transition-opacity">
                                        <span>
                                            {noPercentage}%
                                        </span>
                                        <button className="px-3 py-1.5 text-xs font-semibold dark:bg-emerald-400/20  dark:text-white border border-cyan-500/30 rounded-lg hover:bg-cyan-500/20 hover:border-cyan-500/50 transition-all duration-200 hover:scale-105 active:scale-95">
                                            Yes
                                        </button>
                                        <button className="px-3 py-1.5 text-xs font-semibold dark:bg-red-500/40 border border-pink-500/30 rounded-lg hover:bg-pink-500/20 hover:border-pink-500/50 transition-all duration-200 hover:scale-105 active:scale-95">
                                            No
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Footer with glassmorphism */}
                    <div className="flex items-center justify-between px-3 py-2.5 -mx-1 rounded-xl bg-gradient-to-r from-gray-800/30 to-transparent border-t border-gray-700/30">
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-xs font-medium text-gray-400">{formatVolume(market.totalVolume)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Clock className="w-3.5 h-3.5" />
                            <span className="font-medium">{formatEndDate(market.endDate)}</span>
                        </div>
                    </div>
                </Card>
           </Link>

            <style jsx>{`
                @keyframes gradientShift {
                    0% { background-position: 0% 50%; }
                    100% { background-position: 200% 50%; }
                }
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                .animate-shimmer {
                    animation: shimmer 2s infinite;
                }
            `}</style>
        </div>
    )
}