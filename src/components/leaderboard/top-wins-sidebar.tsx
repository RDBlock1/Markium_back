"use client"

import { motion } from "framer-motion"
import Image from "next/image"
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

const containerVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: {
        opacity: 1,
        x: 0,
        transition: {
            duration: 0.5,
            staggerChildren: 0.08,
        },
    },
}

const itemVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.3 },
    },
}

export default function TopWinsSidebar({ data }: TopWinsSidebarProps) {
    const formatValue = (value: number) => {
        if (value === 0) return "$0";
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value)
    }

    const formatPercentage = (value: number) => {
        if (value === 0) return "0%";
        return `+${value.toFixed(0)}%`
    }

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="lg:w-80 w-full"
        >
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-6">
                    <TrendingUp className="w-5 h-5 text-cyan-500" />
                    <h2 className="text-xl font-bold text-white">Top Wins</h2>
                </div>

                <div className="space-y-4">
                    {data.map((entry) => (
                        <motion.div
                            key={entry.id}
                            variants={itemVariants}
                            className="flex items-start gap-3 pb-4 border-b border-neutral-800 last:border-0 last:pb-0"
                        >
                            {/* Rank */}
                            <div className="text-cyan-500 font-bold text-lg w-6">
                                {entry.rank}
                            </div>

                            {/* Avatar */}
                            <div className="relative w-10 h-10 flex-shrink-0">
                                <img
                                    src={entry.avatar || "/placeholder.svg"}
                                    alt={entry.username}
                                    width={40}
                                    height={40}
                                    className="rounded-full object-cover"
                                />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <p className="text-white font-medium truncate">
                                    {entry.username}
                                </p>
                                <p className="text-neutral-500 text-sm truncate">
                                    {entry.match}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-green-400 font-semibold">
                                        {formatValue(entry.amount)}
                                    </span>
                                    {entry.change > 0 && (
                                        <span className="text-green-400 text-sm">
                                            {formatPercentage(entry.change)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </motion.div>
    )
}