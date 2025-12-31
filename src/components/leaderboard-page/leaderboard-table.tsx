"use client"

import { Button } from "../ui/button"
import Link from "next/link"
import { ExternalLink } from "lucide-react"

interface LeaderboardEntry {
    id: number
    rank: number
    proxyAddress: string
    username: string
    profitLoss: number
    volume: number | null
    profileImage: string
}

interface LeaderboardTableProps {
    data: LeaderboardEntry[]
    viewMode: "Profit/Loss" | "Volume"
}

export default function LeaderboardTable({ data, viewMode }: LeaderboardTableProps) {
    const formatValue = (value: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value)
    }

    const getRankBadgeColor = (rank: number) => {
        if (rank === 1) return "bg-yellow-600"
        if (rank === 2) return "bg-zinc-400"
        if (rank === 3) return "bg-amber-700"
        return "bg-zinc-700"
    }

    return (
        <div className="bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden">
            {data.map((entry, index) => (
                <div
                    key={entry.id}
                    className="flex items-center gap-3 sm:gap-4 px-3 sm:px-5 py-3 sm:py-3.5 border-b border-zinc-800 last:border-b-0 hover:bg-zinc-900/50 transition-colors"
                >
                    {/* Rank Badge */}
                    <div className={`flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full ${getRankBadgeColor(entry.rank)} flex items-center justify-center text-white text-xs sm:text-sm font-bold`}>
                        {entry.rank}
                    </div>

                    {/* Avatar & Name */}
                    <Link
                        href={`/user-profile/${entry.proxyAddress}`}
                        className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 group"
                    >
                        <img
                            src={entry.profileImage}
                            alt={entry.username}
                            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover flex-shrink-0"
                        />
                        <span className="text-xs sm:text-sm font-medium truncate group-hover:text-zinc-300 transition-colors">
                            {entry.username}
                        </span>
                    </Link>

                    {/* Value */}
                    <div className="flex-shrink-0 text-right">
                        {viewMode === "Profit/Loss" ? (
                            <span className={`text-xs sm:text-sm font-semibold ${entry.profitLoss >= 0 ? "text-emerald-400" : "text-red-400"
                                }`}>
                                {formatValue(entry.profitLoss)}
                            </span>
                        ) : (
                            <span className="text-xs sm:text-sm font-semibold text-white">
                                {entry.volume ? formatValue(entry.volume) : "—"}
                            </span>
                        )}
                    </div>

                    {/* Scan Link - Hidden on mobile, shown on hover on desktop */}
                    <Link
                        href={`https://polygonscan.com/address/${entry.proxyAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 hidden sm:block opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-zinc-400 hover:text-white hover:bg-zinc-800"
                        >
                            <ExternalLink className="w-4 h-4" />
                        </Button>
                    </Link>
                </div>
            ))}
        </div>
    )
}