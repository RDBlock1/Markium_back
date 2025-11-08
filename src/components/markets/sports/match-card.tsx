"use client"

import { motion } from "framer-motion"

interface MatchCardProps {
    match: {
        id: number
        tournament: string
        players: { name: string; flag: string; odds: number }[]
        stats: (string | number)[][]
        live: boolean
    }
}

export default function MatchCard({ match }: MatchCardProps) {
    const cardVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
        hover: { y: -2 },
    }

    return (
        <motion.div
            variants={cardVariants}
            whileHover="hover"
            className="bg-card border border-border rounded-lg p-4 md:p-6 group hover:border-accent/50 transition-colors"
        >
            {/* Tournament Header */}
            <motion.div className="flex items-center gap-2 mb-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs">🏟️</div>
                <span className="text-sm text-muted-foreground font-medium">{match.tournament}</span>
            </motion.div>

            {/* Players */}
            <div className="space-y-3">
                {match.players.map((player, idx) => (
                    <motion.div
                        key={idx}
                        className="flex items-center justify-between"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * idx }}
                    >
                        {/* Player Info */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <span className="text-lg">{player.flag}</span>
                            <span className="text-foreground font-medium truncate">{player.name}</span>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-2 md:gap-3 text-xs md:text-sm text-muted-foreground">
                            {match.stats[idx].map(
                                (stat, statIdx) =>
                                    stat && (
                                        <motion.span
                                            key={statIdx}
                                            className="px-2 py-1 bg-secondary rounded"
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ delay: 0.15 + statIdx * 0.05 }}
                                        >
                                            {stat}
                                        </motion.span>
                                    ),
                            )}
                        </div>

                        {/* Odds */}
                        <motion.div
                            className="ml-2 md:ml-4 px-3 py-1 md:px-4 md:py-2 rounded font-bold text-xs md:text-sm"
                            style={{
                                background: player.odds > 50 ? "#10b981" : "#1f2937",
                                color: player.odds > 50 ? "white" : "#9ca3af",
                            }}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            {player.odds}%
                        </motion.div>
                    </motion.div>
                ))}
            </div>

            {/* Live Indicator */}
            {match.live && (
                <motion.div
                    className="flex items-center gap-1 mt-4 text-red-500 text-xs font-semibold"
                    animate={{ opacity: [1, 0.6, 1] }}
                    transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
                >
                    <span className="w-2 h-2 bg-red-500 rounded-full" />
                    LIVE
                </motion.div>
            )}
        </motion.div>
    )
}
