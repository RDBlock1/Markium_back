"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { Search, ChevronDown, Loader2 } from "lucide-react"
import LeaderboardTable from "./leaderboard-table"
import TopWinsSidebar from "./top-wins-sidebar"
import { useLeaderboardData } from "@/hooks/useLeaderboardData"

type TimePeriod = "Today" | "Weekly" | "Monthly" | "All"
type ViewMode = "Profit/Loss" | "Volume"

export default function LeaderboardMain() {
    const [timePeriod, setTimePeriod] = useState<TimePeriod>("Monthly")
    const [viewMode, setViewMode] = useState<ViewMode>("Profit/Loss")
    const [searchQuery, setSearchQuery] = useState("")

    const timePeriods: TimePeriod[] = ["Today", "Weekly", "Monthly", "All"]

    // Fetch data from API
    const { data, loading, error } = useLeaderboardData(timePeriod)

    // Transform API data to match the component format
    const leaderboardData = useMemo(() => {
        const selectedData = viewMode === "Volume" ? data.volume : data.profit;

        return selectedData.map(entry => ({
            id: entry.rank,
            rank: entry.rank,
            username: entry.username,
            proxyAddress: entry.walletAddress,
            profitLoss: entry.profit || 0,
            volume: entry.volume || null,
            profileImage: entry.profileImage || `https://api.dicebear.com/6.x/initials/svg?seed=${encodeURIComponent(entry.username)}&backgroundColor=000000`
        })).filter(entry => {
            // Apply search filter
            if (!searchQuery) return true;
            return entry.username.toLowerCase().includes(searchQuery.toLowerCase());
        });
    }, [data, viewMode, searchQuery]);

    // Get top 3 for the podium
    const topHolders = useMemo(() => {
        const profitData = data.profit.slice(0, 3);
        return profitData.map(entry => ({
            id: entry.rank,
            rank: entry.rank,
            username: entry.username,
            profitLoss: entry.profit || 0,
            volume: entry.volume || null,
            avatar: entry.profileImage || `https://api.dicebear.com/6.x/initials/svg?seed=${encodeURIComponent(entry.username)}&backgroundColor=000000`,
            proxyAddress: entry.walletAddress
        }));
    }, [data.profit]);

    // Transform top wins data (using profit data for now)
    const topWins = useMemo(() => {
        return data.profit.slice(0, 8).map(entry => ({
            id: entry.rank,
            rank: entry.rank,
            username: entry.username,
            match: "Prediction Market", // This would need to come from a different API endpoint
            amount: entry.profit || 0,
            change: entry.change || 0,
            avatar: entry.profileImage || `https://api.dicebear.com/6.x/initials/svg?seed=${encodeURIComponent(entry.username)}&backgroundColor=000000`
        }));
    }, [data.profit]);

    return (
        <div className="min-h-screen bg-black">
            <div className="flex flex-col lg:flex-row gap-6 p-4 md:p-8 max-w-7xl mx-auto">
                {/* Main Content */}
                <div className="flex-1">

                    {/* Time Period Filters */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="flex flex-wrap gap-3 mb-8"
                    >
                        {timePeriods.map((period) => (
                            <motion.button
                                key={period}
                                onClick={() => setTimePeriod(period)}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${timePeriod === period
                                        ? "bg-cyan-500 text-black"
                                        : "bg-neutral-900 text-white hover:bg-neutral-800 border border-neutral-700"
                                    }`}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                {period}
                            </motion.button>
                        ))}
                    </motion.div>

                    {/* Search and Category Filter */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="flex flex-col sm:flex-row gap-4 mb-8"
                    >
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-600 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search by name"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500 transition-colors"
                            />
                        </div>
                        <motion.button
                            className="flex items-center gap-2 px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg text-white hover:bg-neutral-800 transition-colors sm:w-auto w-full justify-between"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            All Categories
                            <ChevronDown className="w-5 h-5" />
                        </motion.button>
                    </motion.div>

                    {/* View Mode Toggle */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="flex gap-0 mb-6 border-b border-neutral-700"
                    >
                        {(["Profit/Loss", "Volume"] as const).map((mode) => (
                            <motion.button
                                key={mode}
                                onClick={() => setViewMode(mode)}
                                className={`px-4 py-3 font-medium transition-colors relative ${viewMode === mode ? "text-cyan-500" : "text-neutral-500 hover:text-neutral-300"
                                    }`}
                                whileHover={{ y: -2 }}
                                whileTap={{ y: 0 }}
                            >
                                {mode}
                                {viewMode === mode && (
                                    <motion.div
                                        layoutId="underline"
                                        className="absolute bottom-0 left-0 right-0 h-1 bg-cyan-500"
                                        initial={{ scaleX: 0 }}
                                        animate={{ scaleX: 1 }}
                                        transition={{ duration: 0.3 }}
                                    />
                                )}
                            </motion.button>
                        ))}
                    </motion.div>

                    {/* Loading State */}
                    {loading && (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
                            <span className="ml-3 text-white">Loading leaderboard data...</span>
                        </div>
                    )}

                    {/* Error State */}
                    {error && (
                        <div className="bg-red-900/20 border border-red-900 rounded-lg p-4 mb-6">
                            <p className="text-red-400">Failed to load leaderboard data: {error}</p>
                        </div>
                    )}

                    {/* Leaderboard Table */}
                    {!loading && !error && (
                        <LeaderboardTable data={leaderboardData} viewMode={viewMode} />
                    )}
                </div>

                {/* Right Sidebar */}
                {!loading && <TopWinsSidebar data={topWins} />}
            </div>
        </div>
    )
}