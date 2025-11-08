"use client"

import { motion } from "framer-motion"
import { ChevronDown } from "lucide-react"
import { useState } from "react"

export default function RightPanel() {
    const [limitType, setLimitType] = useState("Limit")

    const containerVariants = {
        hidden: { opacity: 0, x: 30 },
        visible: {
            opacity: 1,
            x: 0,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.3,
            },
        },
    }

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 },
    }

    return (
        <motion.div className="w-full lg:w-80 space-y-4" variants={containerVariants} initial="hidden" animate="visible">
            {/* Match Header */}
            <motion.div className="bg-card border border-border rounded-lg p-4 md:p-6" variants={itemVariants}>
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-xl">👤</div>
                    <div>
                        <h3 className="font-bold text-sm md:text-base">Kecmanovic vs Darderi</h3>
                        <p className="text-xs text-muted-foreground">Buy Yes · Miomir Kecmanovic</p>
                    </div>
                </div>
                <div className="text-xs text-muted-foreground">16</div>
            </motion.div>

            {/* Buy/Sell Buttons */}
            <motion.div className="flex gap-2 bg-card border border-border rounded-lg p-3" variants={itemVariants}>
                <button className="flex-1 px-3 py-2 rounded bg-accent text-accent-foreground text-sm font-semibold hover:bg-accent/90 transition-colors">
                    Buy
                </button>
                <button className="flex-1 px-3 py-2 rounded bg-secondary text-foreground text-sm font-semibold hover:bg-secondary/80 transition-colors">
                    Sell
                </button>
                <button className="px-3 py-2 rounded bg-secondary text-foreground text-sm font-semibold hover:bg-secondary/80 flex items-center gap-1">
                    Limit <ChevronDown className="w-3 h-3" />
                </button>
            </motion.div>

            {/* Price Buttons */}
            <motion.div className="grid grid-cols-2 gap-2" variants={itemVariants}>
                <motion.button
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-bold text-sm transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    Yes 90¢
                </motion.button>
                <motion.button
                    className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 px-4 py-3 rounded-lg font-bold text-sm transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    No 11¢
                </motion.button>
            </motion.div>

            {/* Contract Details */}
            <motion.div className="bg-card border border-border rounded-lg p-4 space-y-3" variants={itemVariants}>
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Contracts</span>
                    <span className="text-muted-foreground">0</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Limit price (¢)</span>
                    <span className="text-muted-foreground">0</span>
                </div>
            </motion.div>

            {/* Expiration */}
            <motion.div className="bg-card border border-border rounded-lg p-4" variants={itemVariants}>
                <div className="flex items-center justify-between text-sm mb-3">
                    <span className="text-muted-foreground">Expiration</span>
                    <button className="flex items-center gap-1 text-foreground hover:text-accent transition-colors">
                        Good 'til canceled <ChevronDown className="w-4 h-4" />
                    </button>
                </div>
            </motion.div>

            {/* Checkbox */}
            <motion.div
                className="flex items-center gap-2 text-sm p-4 bg-card border border-border rounded-lg"
                variants={itemVariants}
            >
                <input type="checkbox" id="resting" defaultChecked className="w-4 h-4 cursor-pointer accent-accent" />
                <label htmlFor="resting" className="cursor-pointer text-muted-foreground">
                    Submit as resting order only
                </label>
            </motion.div>

            {/* Buy Button */}
            <motion.button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-bold transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                variants={itemVariants}
            >
                Buy
            </motion.button>
        </motion.div>
    )
}
