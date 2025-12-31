"use client"

import { useState, useMemo } from "react"
import { Search, Loader2 } from "lucide-react"
import LeaderboardTable from "./leaderboard-table"
import TopWinsSidebar from "./top-wins-sidebar"
import { useLeaderboardData } from "@/hooks/useLeaderboardData"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectItem } from "../ui/select"

type TimePeriod = "Today" | "Weekly" | "Monthly" | "All"
type ViewMode = "Profit/Loss" | "Volume"

export default function LeaderboardMain() {
    const [timePeriod, setTimePeriod] = useState<TimePeriod>("Monthly")
    const [viewMode, setViewMode] = useState<ViewMode>("Profit/Loss")
    const [searchQuery, setSearchQuery] = useState("")
    const [category, setCategory] = useState("overall")

    const timePeriods: TimePeriod[] = ["Today", "Weekly", "Monthly", "All"]

    const { data, loading, error } = useLeaderboardData(timePeriod, 20, category)

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
            if (!searchQuery) return true;
            return entry.username.toLowerCase().includes(searchQuery.toLowerCase());
        });
    }, [data, category, viewMode, searchQuery]);

    const topWins = useMemo(() => {
        return data.profit.slice(0, 8).map(entry => ({
            id: entry.rank,
            rank: entry.rank,
            username: entry.username,
            match: "Prediction Market",
            amount: entry.profit || 0,
            change: entry.change || 0,
            avatar: entry.profileImage || `https://api.dicebear.com/6.x/initials/svg?seed=${encodeURIComponent(entry.username)}&backgroundColor=000000`
        }));
    }, [data.profit]);

    return (
        <div className="min-h-screen bg-black text-white">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
                {/* Header */}
                <div className="mb-6 sm:mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold mb-2">Leaderboard</h1>
                </div>

                {/* Controls Row */}
                <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                    {/* Time Period Dropdown */}
                    <Select onValueChange={(value) => setTimePeriod(value as TimePeriod)} value={timePeriod}>
                        <SelectTrigger className="w-full sm:w-[140px] bg-zinc-900 border-zinc-800 rounded-lg">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800">
                            <SelectGroup>
                                {timePeriods.map(period => (
                                    <SelectItem key={period} value={period}>{period}</SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>

                    {/* Category Dropdown */}
                    <Select onValueChange={(value) => setCategory(value)} value={category}>
                        <SelectTrigger className="w-full sm:w-[180px] bg-zinc-900 border-zinc-800 rounded-lg">
                            <SelectValue placeholder="All categories" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800">
                            <SelectGroup>
                                <SelectItem value="overall">All categories</SelectItem>
                                <SelectItem value="politics">Politics</SelectItem>
                                <SelectItem value="sports">Sports</SelectItem>
                                <SelectItem value="crypto">Crypto</SelectItem>
                                <SelectItem value="finance">Finance</SelectItem>
                                <SelectItem value="culture">Culture</SelectItem>
                                <SelectItem value="mentions">Mentions</SelectItem>
                                <SelectItem value="weather">Weather</SelectItem>
                                <SelectItem value="economics">Economics</SelectItem>
                                <SelectItem value="tech">Tech</SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>

                    {/* Search */}
                    <div className="flex-1 w-full sm:max-w-md relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Search traders..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700"
                        />
                    </div>
                </div>

                {/* View Mode Tabs */}
                <div className="flex items-center gap-4 sm:gap-6 border-b border-zinc-800 mb-6 overflow-x-auto scrollbar-hide">
                    {(["Profit/Loss", "Volume"] as const).map((mode) => (
                        <button
                            key={mode}
                            onClick={() => setViewMode(mode)}
                            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${viewMode === mode
                                    ? "border-white text-white"
                                    : "border-transparent text-zinc-500 hover:text-zinc-300"
                                }`}
                        >
                            {mode === "Profit/Loss" ? "💰 Profit" : "📊 Volume"}
                        </button>
                    ))}
                    <button
                        className="pb-3 px-1 text-sm font-medium border-b-2 border-transparent text-zinc-500 hover:text-zinc-300 whitespace-nowrap"
                    >
                        🎯 Predictions
                    </button>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="bg-red-950/20 border border-red-900/50 rounded-lg p-4 mb-6">
                        <p className="text-red-400 text-sm">Failed to load data: {error}</p>
                    </div>
                )}

                {/* Content Grid */}
                {!loading && !error && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 order-2 lg:order-1">
                            <LeaderboardTable data={leaderboardData} viewMode={viewMode} />
                        </div>
                        <div className="order-1 lg:order-2">
                            <TopWinsSidebar data={topWins} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}