"use client"
import { motion } from "framer-motion"
import { Settings } from "lucide-react"
import MatchCard from "./match-card"
import TabsComponent from "./tabs"

const matches = [
    {
        id: 1,
        tournament: "ATP Athens",
        players: [
            { name: "Miomir Kecmanovic", flag: "🇷🇸", odds: 91 },
            { name: "Luciano Darderi", flag: "🇮🇹", odds: 9 },
        ],
        stats: [
            [4, 6, 3, 15],
            [6, 2, 1, 15],
        ],
        live: true,
    },
    {
        id: 2,
        tournament: "ATP Metz",
        players: [
            { name: "Clement Tabur", flag: "🇫🇷", odds: 24 },
            { name: "Alexander Blockx", flag: "🇧🇪", odds: 76 },
        ],
        stats: [
            [6, 4, "", 40],
            [7, 4, "", 15],
        ],
        live: true,
    },
    {
        id: 3,
        tournament: "ATP Metz",
        players: [
            { name: "Learner Tien", flag: "🇺🇸", odds: 96 },
            { name: "Moez Echargui", flag: "🌍", odds: 4 },
        ],
        stats: [
            [4, "", "", 30],
            [3, "", "", 15],
        ],
        live: true,
    },
]

const tabs = ["Games", "Futures", "Awards", "Conference", "Division", "Wins", "Events"]

interface MainContentProps {
    selectedTab: string
    setSelectedTab: (tab: string) => void
}

export default function MainContent({ selectedTab, setSelectedTab }: MainContentProps) {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2,
            },
        },
    }

    return (
        <motion.div
            className="flex-1 bg-background p-4 md:p-8 overflow-y-auto"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Header */}
            <motion.div
                className="flex items-center justify-between mb-8 md:hidden"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <h1 className="text-3xl font-bold text-cyan-500">Sports</h1>
                <Settings className="w-6 h-6" />
            </motion.div>

            <motion.h1
                className="hidden md:block text-4xl font-bold mb-8 text-cyan-500"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                Sports
            </motion.h1>

            {/* Tabs */}
            <TabsComponent tabs={tabs} selectedTab={selectedTab} setSelectedTab={setSelectedTab} />

            {/* Match Cards */}
            <motion.div className="space-y-4">
                {matches.map((match, index) => (
                    <motion.div
                        key={match.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + index * 0.1 }}
                    >
                        <MatchCard match={match} />
                    </motion.div>
                ))}
            </motion.div>
        </motion.div>
    )
}
