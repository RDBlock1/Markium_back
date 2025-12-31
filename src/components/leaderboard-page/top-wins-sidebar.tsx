"use client"

import { TrendingUp } from "lucide-react"

interface TopWinEntry {
    id: number
    rank: number
    username: string
    match: string
    amount: number
    change: number
    avatar: string
}

interface TopWinsSidebarProps {
    data: TopWinEntry[]
}

export default function TopWinsSidebar({ data }: TopWinsSidebarProps) {
    const formatValue = (value: number) => {
        if (value === 0) return "$0"

        // Format in K for thousands
        if (value >= 1000) {
            return `$${(value / 1000).toFixed(1)}K`
        }

        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value)
    }

    const formatPercentage = (value: number) => {
        if (value === 0) return "0%"
        return `+${value.toFixed(0)}%`
    }

    return (
        <div className="bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden">
            {/* Header */}
            <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-zinc-800">
                <h2 className="text-sm sm:text-base font-semibold">Top Performers</h2>
            </div>

            {/* List */}
            <div className="divide-y divide-zinc-800">
                {data.slice(0, 10).map((entry) => (
                    <div
                        key={entry.id}
                        className="px-4 sm:px-5 py-2.5 sm:py-3 hover:bg-zinc-900/50 transition-colors"
                    >
                        <div className="flex items-center gap-2 sm:gap-3">
                            {/* Rank */}
                            <span className="text-xs font-medium text-zinc-500 w-5 sm:w-6 flex-shrink-0">
                                {entry.rank}
                            </span>

                            {/* Avatar */}
                            <img
                                src={entry.avatar}
                                alt={entry.username}
                                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover flex-shrink-0"
                            />

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="text-xs sm:text-sm font-medium truncate">
                                    {entry.username}
                                </div>
                                <div className="text-[10px] sm:text-xs text-zinc-500 truncate">
                                    {entry.match}
                                </div>
                            </div>

                            {/* Amount */}
                            <div className="text-right flex-shrink-0">
                                <div className="text-xs sm:text-sm font-semibold text-emerald-400">
                                    {formatValue(entry.amount)}
                                </div>
                                {entry.change > 0 && (
                                    <div className="text-[10px] sm:text-xs text-zinc-500">
                                        {formatPercentage(entry.change)}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer Stats */}
            <div className="px-4 sm:px-5 py-3 sm:py-4 border-t border-zinc-800 bg-zinc-900/30">
                <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500">Total Traders</span>
                    <span className="font-semibold">{data.length}</span>
                </div>
            </div>
        </div>
    )
}