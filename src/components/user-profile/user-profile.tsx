"use client"

import { useState } from "react"
import { TrendingUp, Zap } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"



const chartData = [
    { date: "Oct 20", value: 450000 },
    { date: "Oct 21", value: 480000 },
    { date: "Oct 22", value: 520000 },
    { date: "Oct 23", value: 490000 },
    { date: "Oct 24", value: 550000 },
    { date: "Oct 25", value: 580000 },
    { date: "Oct 26", value: 512399 },
    { date: "Oct 27", value: 512399 },
]


export default function UserProfile() {
    const [showBalance, setShowBalance] = useState(true)
    const [activeTab, setActiveTab] = useState("positions")
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    return (
        <div className="min-h-screen bg-black">
            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
                <div className="mb-6 sm:mb-8">
                    <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                            <img src="https://polymarket-upload.s3.us-east-2.amazonaws.com/profile-image-3654579-3df27b95-8f24-4e13-b8d8-4883d0a6c9b0.png" alt="" className="rounded-full w-16 h-16" />
                        <div className="min-w-0">
                            <h2 className="text-2xl sm:text-3xl font-bold text-white truncate">teslaholder</h2>
                            <p className="text-gray-500 text-xs sm:text-sm font-light truncate">
                                0xb744f56635b537e859152d14b022af5afe485210 • Joined Oct 2025
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
                    {/* Position Value */}
                    <div className="gradient-dark-card rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-[#1a1a1a] hover:border-cyan-500/50 transition group">
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <span className="text-gray-400 text-xs sm:text-sm font-medium">Position Value</span>
                            <div className="flex items-center gap-1 bg-cyan-500/10 text-cyan-400 px-2 py-1 rounded text-xs font-semibold">
                                <TrendingUp className="w-3 h-3" />
                                +12.5%
                            </div>
                        </div>
                        <p className="text-2xl sm:text-3xl font-bold text-white">$731.63K</p>
                        <div className="h-1 bg-gradient-to-r from-cyan-500 to-transparent rounded-full mt-3 sm:mt-4 opacity-0 group-hover:opacity-100 transition"></div>
                    </div>

                    {/* Total Profit/Loss */}
                    <div className="gradient-dark-card rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-[#1a1a1a] hover:border-cyan-500/50 transition group">
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <span className="text-gray-400 text-xs sm:text-sm font-medium">Total Profit/Loss</span>
                            <div className="flex items-center gap-1 bg-cyan-500/10 text-cyan-400 px-2 py-1 rounded text-xs font-semibold">
                                <TrendingUp className="w-3 h-3" />
                                +514%
                            </div>
                        </div>
                        <p className="text-2xl sm:text-3xl font-bold text-white">$513.50K</p>
                        <div className="h-1 bg-gradient-to-r from-cyan-500 to-transparent rounded-full mt-3 sm:mt-4 opacity-0 group-hover:opacity-100 transition"></div>
                    </div>

                    {/* Volume Traded */}
                    <div className="gradient-dark-card rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-[#1a1a1a] hover:border-cyan-500/50 transition group">
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <span className="text-gray-400 text-xs sm:text-sm font-medium">Volume Traded</span>
                            <div className="flex items-center gap-1 bg-cyan-500/10 text-cyan-400 px-2 py-1 rounded text-xs font-semibold">
                                <TrendingUp className="w-3 h-3" />
                                +15.7%
                            </div>
                        </div>
                        <p className="text-2xl sm:text-3xl font-bold text-white">$28.41M</p>
                        <div className="h-1 bg-gradient-to-r from-cyan-500 to-transparent rounded-full mt-3 sm:mt-4 opacity-0 group-hover:opacity-100 transition"></div>
                    </div>

                    {/* Active Positions */}
                    <div className="gradient-dark-card rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-[#1a1a1a] hover:border-cyan-500/50 transition group">
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <span className="text-gray-400 text-xs sm:text-sm font-medium">Active Positions</span>
                            <span className="bg-cyan-500/10 text-cyan-400 px-2 py-1 rounded text-xs font-semibold">40 markets</span>
                        </div>
                        <p className="text-2xl sm:text-3xl font-bold text-white">40</p>
                        <div className="h-1 bg-gradient-to-r from-cyan-500 to-transparent rounded-full mt-3 sm:mt-4 opacity-0 group-hover:opacity-100 transition"></div>
                    </div>
                </div>

                <div className="gradient-dark-card rounded-xl sm:rounded-2xl p-4 sm:p-8 border border-[#1a1a1a] mb-6 sm:mb-8">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-4">
                        <div>
                            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                                <Zap className="w-4 sm:w-5 h-4 sm:h-5 text-cyan-400" /> Profit/Loss
                            </h3>
                            <p className="text-gray-500 text-xs sm:text-sm mt-1 font-light">All Time</p>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                            <button className="px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium text-gray-400 hover:text-cyan-400 hover:bg-[#1a1a1a] rounded transition">
                                1D
                            </button>
                            <button className="px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium text-gray-400 hover:text-cyan-400 hover:bg-[#1a1a1a] rounded transition">
                                1W
                            </button>
                            <button className="px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium text-gray-400 hover:text-cyan-400 hover:bg-[#1a1a1a] rounded transition">
                                1M
                            </button>
                            <button className="px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium bg-cyan-500 text-black rounded transition font-semibold">
                                ALL
                            </button>
                        </div>
                    </div>

                    <div className="mb-4 sm:mb-6">
                        <p className="text-2xl sm:text-4xl font-bold text-white">$512,399.78</p>
                        <p className="text-cyan-400 text-base sm:text-lg font-semibold mt-2">+285.67%</p>
                    </div>

                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                            <XAxis dataKey="date" stroke="#666666" tick={{ fontSize: 12 }} />
                            <YAxis stroke="#666666" tick={{ fontSize: 12 }} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "#0a0a0a",
                                    border: "1px solid #1a1a1a",
                                    borderRadius: "8px",
                                }}
                                labelStyle={{ color: "#ffffff" }}
                            />
                            <Line
                                type="monotone"
                                dataKey="value"
                                stroke="#00d9ff"
                                strokeWidth={3}
                                dot={false}
                                isAnimationActive={true}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="gradient-dark-card rounded-xl sm:rounded-2xl p-4 sm:p-8 border border-[#1a1a1a]">
                    <div className="flex items-center gap-2 sm:gap-4 mb-4 sm:mb-6 border-b border-[#1a1a1a] pb-3 sm:pb-4 overflow-x-auto">
                        <button
                            onClick={() => setActiveTab("positions")}
                            className={`px-3 sm:px-4 py-2 font-medium transition text-xs sm:text-sm whitespace-nowrap ${activeTab === "positions" ? "text-cyan-400 border-b-2 border-cyan-400" : "text-gray-400 hover:text-cyan-400"}`}
                        >
                            Positions
                        </button>
                        <button
                            onClick={() => setActiveTab("activity")}
                            className={`px-3 sm:px-4 py-2 font-medium transition text-xs sm:text-sm whitespace-nowrap ${activeTab === "activity" ? "text-cyan-400 border-b-2 border-cyan-400" : "text-gray-400 hover:text-cyan-400"}`}
                        >
                            Activity (25)
                        </button>
                        <button
                            onClick={() => setActiveTab("analytics")}
                            className={`px-3 sm:px-4 py-2 font-medium transition text-xs sm:text-sm whitespace-nowrap ${activeTab === "analytics" ? "text-cyan-400 border-b-2 border-cyan-400" : "text-gray-400 hover:text-cyan-400"}`}
                        >
                            Analytics
                        </button>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                        <button className="px-3 sm:px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-black rounded-lg font-semibold transition flex items-center justify-center gap-2 text-xs sm:text-sm">
                            <span>●</span> Open <span className="ml-1 font-bold">40</span>
                        </button>
                        <button className="px-3 sm:px-4 py-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white rounded-lg font-semibold transition flex items-center justify-center gap-2 text-xs sm:text-sm">
                            <span>●</span> Closed <span className="ml-1 font-bold">25</span>
                        </button>
                    </div>
                </div>
            </main>

            <footer className="border-t border-[#1a1a1a] bg-black mt-8 sm:mt-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 text-center text-gray-600 text-xs sm:text-sm font-light">
                    © 2025 NEXUS. ALL RIGHTS RESERVED.
                </div>
            </footer>
        </div>
    )
}
