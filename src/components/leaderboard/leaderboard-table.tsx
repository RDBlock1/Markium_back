"use client"

import { motion, Variants } from "framer-motion"
import { Button } from "../ui/button"
import Link from "next/link"

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

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
            delayChildren: 0.2,
        },
    },
}

const rowVariants: Variants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.4, ease: "easeOut" },
    },
    hover: {
        x: 8,
        backgroundColor: "rgba(6, 182, 212, 0.05)",
    },
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

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-2 w-full max-w-5xl mx-auto">
            {data.map((entry) => (
                <motion.div
                    key={entry.id}
                    variants={rowVariants}
                    whileHover="hover"
                    className="flex items-center gap-4 px-4 py-4 rounded-lg border border-neutral-800 transition-all cursor-pointer"
                >
                <Link href={`/user-profile/${entry.proxyAddress}`} className="flex items-center gap-3 flex-1 min-w-0">

                        {/* Rank */}
                        <div className="text-xl font-bold text-cyan-500 w-8">{entry.rank}</div>

                        {/* Avatar and Username */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="relative w-10 h-10 flex-shrink-0">
                                <img
                                    src={entry.profileImage || "/placeholder.svg"}
                                    alt={entry.username}
                                    width={40}
                                    height={40}
                                    className="rounded-full object-cover"
                                />
                            </div>
                            <span className="text-white font-medium truncate">{entry.username}</span>
                        </div>
                </Link>


<div>
  <Link href={`https://polygonscan.com/address/${entry.id}`} target="_blank" rel="noopener noreferrer">
                            <Button variant={"outline"}>
                                View on polygonscan

                            </Button>
  </Link>
</div>
                    {/* Profit/Loss or Volume */}
                    <div className="text-right flex-shrink-0">
                        {viewMode === "Profit/Loss" ? (
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3 }}
                                className="text-green-400 font-semibold"
                            >
                                {entry.profitLoss >= 0 ? '+' : ''}{formatValue(entry.profitLoss)}
                            </motion.span>
                        ) : (
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3 }}
                                className="text-cyan-400 font-semibold"
                            >
                                {entry.volume ? formatValue(entry.volume) : "—"}
                            </motion.span>
                        )}
                    </div>
                </motion.div>
            ))}
        </motion.div>
    )
}