"use client"

import { motion } from "framer-motion"
import { ChevronDown } from "lucide-react"
import { useState } from "react"

const sports = [
    "Football",
    "Basketball",
    "Hockey",
    "Soccer",
    "Tennis",
    "Golf",
    "Baseball",
    "Chess",
    "Esports",
    "Motorsport",
]

export default function Sidebar() {
    const [expandedSport, setExpandedSport] = useState<string | null>("Football")

    const containerVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: {
            opacity: 1,
            x: 0,
            transition: {
                staggerChildren: 0.05,
                delayChildren: 0.1,
            },
        },
    }

    const itemVariants = {
        hidden: { opacity: 0, x: -10 },
        visible: { opacity: 1, x: 0 },
    }

    return (
        <motion.div
            className="w-full md:w-48 lg:w-56  mt-20 border-r border-border p-4 md:p-6 md:overflow-y-auto"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <motion.h2 className="text-lg font-bold text-cyan-500 mb-6" variants={itemVariants}>
                All
            </motion.h2>

            <div className="space-y-2">
                {sports.map((sport, index) => (
                    <motion.div key={sport} variants={itemVariants} className="group">
                        <button
                            onClick={() => setExpandedSport(expandedSport === sport ? null : sport)}
                            className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-secondary transition-colors text-foreground"
                        >
                            <span className="text-sm font-medium">{sport}</span>
                            <ChevronDown className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                        </button>

                        {expandedSport === sport && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="pl-4 mt-1 text-xs text-muted-foreground space-y-1"
                            >
                                <div className="py-1 cursor-pointer hover:text-accent">Leagues</div>
                                <div className="py-1 cursor-pointer hover:text-accent">Teams</div>
                                <div className="py-1 cursor-pointer hover:text-accent">Players</div>
                            </motion.div>
                        )}
                    </motion.div>
                ))}
            </div>
        </motion.div>
    )
}
