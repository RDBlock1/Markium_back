"use client"

import type React from "react"
import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    BotIcon,
    Zap,
    Bookmark,
    BarChart3,
    Users,
    MessageSquare,
    Search,
    ArrowUpRight,
    Circle
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface Feature {
    id: string
    title: string
    subtitle: string
    description: string
    video?: string
    ctaLabel: string
    href: string
    icon?: React.ReactNode
    isAvailable?: boolean
    isComingSoon?: boolean
}

interface FeaturesGridProps {
    features?: Feature[]
    onNavigate?: (featureId: string) => void
}

const DEFAULT_FEATURES: Feature[] = [
    {
        id: "market-analyzer",
        title: "AI Market Analyzer",
        subtitle: "Market analysis and trend summarization.",
        description:
            "AI-driven market analysis that highlights sentiment shifts, liquidity moves, and unusual activity.",
        ctaLabel: "Open Market Analyzer",
        href: "/ai-market-analyzer",
        icon: <BotIcon className="w-5 h-5" />,
        isAvailable: true,
    },
    {
        id: "rule-analyzer",
        title: "AI Rules Analyzer",
        subtitle: "Comprehensive breakdown of the Polymarket Resolution Rules.",
        description:
            "Write rules in plain English and let AI convert them into monitorable rules that watch markets in real-time.",
        ctaLabel: "Build a Rule",
        href: "/ai-rules-analyzer",
        icon: <Zap className="w-5 h-5" />,
        isAvailable: true,
    },
    {
        id: "watchlist",
        title: "Watchlist",
        subtitle: "Personalize & follow markets you care about.",
        description:
            "Save markets to your watchlist, get push-style notifications inside the app, and see a compact timeline of key events.",
        ctaLabel: "Go to Watchlist",
        href: "/watchlist",
        icon: <Bookmark className="w-5 h-5" />,
        isAvailable: true,
    },
    {
        id: "user-analytics",
        title: "User Analytics",
        subtitle: "Analyze trader activity & behavior.",
        description:
            "Aggregate and explore trader-level metrics like conviction, trade frequency, and profit signals.",
        ctaLabel: "View Analytics",
        href: "/leaderboard",
        icon: <BarChart3 className="w-5 h-5" />,
        isAvailable: true,
    },
    {
        id: "user-explorer",
        title: "User Explorer",
        subtitle: "Discover top traders and their history.",
        description:
            "Explore top traders on Polymarket, filter by accuracy, volume, and sectors, and follow them for quick insights.",
        ctaLabel: "Explore Users",
        icon: <Users className="w-5 h-5" />,
        isAvailable: true,
        href: "/user-profile",
    },
    {
        id: "mentions-analyzer",
        title: "AI Mentions Analyzer",
        subtitle: "Historical insights and metrics of Polymarket mentions.",
        description:
            "Detect rising topics and mentions across social sources and see how they correlate with market moves.",
        ctaLabel: "Open Mentions",
        href: "/mentions-analyzer",
        icon: <MessageSquare className="w-5 h-5" />,
        isAvailable: false,
        isComingSoon: true,
    },
    {
        id: "keywords-search",
        title: "Keywords Search",
        subtitle: "Search markets by keywords to spot insider wallets.",
        description:
            "Powerful keyword search with sentiment filters and saved queries — find markets related to any phrase or topic quickly.",
        ctaLabel: "Search Markets",
        icon: <Search className="w-5 h-5" />,
        isAvailable: false,
        href: "/keywords-search",
        isComingSoon: true,
    },
    {
        id: "copy-trading",
        title: "Copy Trading",
        subtitle: "Follow and replicate top traders' strategies.",
        description:
            "Identify successful traders on Polymarket and automatically replicate their trades in real-time.",
        ctaLabel: "Start Copy Trading",
        icon: <Users className="w-5 h-5" />,
        isAvailable: false,
        href: "/copy-trading",
        isComingSoon: true,
    },
]

// Feature card component
const FeatureCard = ({
    feature,
    index,
}: {
    feature: Feature
    index: number
}) => {
    const [isHovered, setIsHovered] = useState(false)

    return (
        <Link
            href={feature.isAvailable ? feature.href : "#"}
            onClick={(e) => {
                if (!feature.isAvailable) {
                    e.preventDefault()
                }
            }}
            className="block group"
        >
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.4 }}
                onHoverStart={() => setIsHovered(true)}
                onHoverEnd={() => setIsHovered(false)}
                className={cn(
                    "relative h-full p-8",
                    "transition-all duration-300",
                    "hover:border-zinc-900 dark:hover:border-zinc-200",
                    !feature.isAvailable && "opacity-60 cursor-not-allowed"
                )}
            >
                {/* Top section */}
                <div className="flex items-start justify-between mb-6">
                    <div className="p-3 border border-zinc-200 dark:border-zinc-800">
                        <div className="text-zinc-900 dark:text-zinc-100">
                            {feature.icon}
                        </div>
                    </div>

                    <motion.div
                        animate={{
                            x: isHovered ? 4 : 0,
                            y: isHovered ? -4 : 0
                        }}
                        transition={{ duration: 0.2 }}
                    >
                        <ArrowUpRight className="w-5 h-5 text-zinc-400" />
                    </motion.div>
                </div>

                {/* Content */}
                <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                        <h3 className="text-xl font-medium text-zinc-900 dark:text-zinc-100">
                            {feature.title}
                        </h3>
                    </div>

                    <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                        {feature.subtitle}
                    </p>
                </div>

                {/* Status indicator */}
                <div className="mt-8 flex items-center gap-2">
                    <Circle
                        className={cn(
                            "w-2 h-2",
                            feature.isAvailable
                                ? "fill-emerald-500 text-emerald-500"
                                : "fill-amber-500 text-amber-500"
                        )}
                    />
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                        {feature.isComingSoon ? "Coming Soon" : "Available"}
                    </span>
                </div>

                {/* Hover line */}
                <motion.div
                    className="absolute bottom-0 left-0 h-[2px] bg-zinc-900 dark:bg-zinc-100"
                    initial={{ width: 0 }}
                    animate={{ width: isHovered ? "100%" : "0%" }}
                    transition={{ duration: 0.3 }}
                />
            </motion.div>
        </Link>
    )
}

// Main component
export function FeaturesGrid({ features = DEFAULT_FEATURES }: FeaturesGridProps) {
    return (
        <section className="w-full py-24 px-4">
            {/* Header */}
            <div className="container mx-auto mb-16">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-4 flex flex-col items-center justify-center"
                >
                    <h2 className="text-5xl md:text-7xl text-center font-medium tracking-tight text-zinc-900 dark:text-zinc-100">
                        Features
                    </h2>
                    <div className="h-[1px]  w-24 bg-zinc-900 dark:bg-zinc-100" />
                </motion.div>
            </div>

            {/* Grid */}
            <div className="container mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-zinc-200 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800">
                    {features.map((feature, index) => (
                        <div
                            key={feature.id}
                            className="bg-white dark:bg-black"
                        >
                            <FeatureCard feature={feature} index={index} />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}