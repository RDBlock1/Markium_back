"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Settings } from "lucide-react"
import MainContent from "@/components/markets/sports/main"
import RightPanel from "@/components/markets/sports/right-panel"
import Sidebar from "@/components/markets/sports/sidebar"


export default function MarketPage() {
    const [selectedTab, setSelectedTab] = useState("Games")

    return (
        <div className="min-h-screen bg-background text-foreground font-sans">
            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center justify-between p-4 border-b border-border">
                <motion.h1 className="text-2xl font-bold text-cyan-500" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    Sports
                </motion.h1>
                <Settings className="w-5 h-5" />
            </div>

            <div className="flex flex-col md:flex-row h-screen gap-0 md:gap-4">
                {/* Sidebar - Hidden on mobile, visible on md+ */}
                <div className="hidden md:block">
                    <Sidebar />
                </div>

                {/* Main Content */}
                <MainContent selectedTab={selectedTab} setSelectedTab={setSelectedTab} />

                {/* Right Panel - Hidden on mobile, visible on lg+ */}
                <div className="hidden lg:block">
                    {/* <RightPanel /> */}
                </div>
            </div>

            {/* Mobile Right Panel */}
            <motion.div
                className="md:hidden border-t border-border bg-card p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                <RightPanel />
            </motion.div>
        </div>
    )
}
