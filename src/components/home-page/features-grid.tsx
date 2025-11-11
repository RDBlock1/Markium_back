"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Play, TrendingUp, Zap, Bookmark, BarChart3, Users, MessageSquare, Search, BotIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { geist } from "@/lib/fonts"
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
            "AI-driven market analysis that highlights sentiment shifts, liquidity moves, and unusual activity. Includes short video explainers and a one-click link to the market view on Polymarket. Get real-time insights into market movements and identify opportunities before they become obvious.",
        video: "/videos/market-analyzer-demo.mp4",
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
            "Write rules in plain English and let AI convert them into monitorable rules that watch markets in real-time. Includes examples and presets. Set up complex market monitoring without writing a single line of code.",
        video: "/videos/rule-analyzer-demo.mp4",
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
            "Save markets to your watchlist, get push-style notifications inside the app, and see a compact timeline of key events. Never miss important market movements again.",
        video: "/videos/watchlist-demo.mp4",
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
            "Aggregate and explore trader-level metrics like conviction, trade frequency, and profit signals to help you spot informed actors. Learn from the best traders on the platform.",
        video: "/videos/user-analytics-demo.mp4",
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
            "Explore top traders on Polymarket, filter by accuracy, volume, and sectors, and follow them for quick insights. Build your network of successful traders.",
        video: "/videos/user-explorer-demo.mp4",
        ctaLabel: "Explore Users",
        icon: <Users className="w-5 h-5" />,
        isAvailable: true,
        href: "/user-explorer",
    },
    {
        id: "mentions-analyzer",
        title: "AI Mentions Analyzer",
        subtitle: "Historical insights and metrics of Polymarket mentions.",
        description:
            "Detect rising topics and mentions across social sources and see how they correlate with market moves. Stay ahead of social trends that impact markets.",
        video: "/videos/mentions-demo.mp4",
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
            "Powerful keyword search with sentiment filters and saved queries — find markets related to any phrase or topic quickly. Discover opportunities across the entire Polymarket ecosystem.",
        video: "/videos/keywords-demo.mp4",
        ctaLabel: "Search Markets",
        icon: <Search className="w-5 h-5" />,
        isAvailable: false,
        href: "/keywords-search",
    },
    {
        id:"copy-trading",
        title: "Copy Trading",
        subtitle: "Follow and replicate top traders' strategies.",
        description:
            "Identify successful traders on Polymarket and automatically replicate their trades in real-time. Benefit from the expertise of top performers and enhance your trading outcomes.",
        video: "/videos/copy-trading-demo.mp4",
        ctaLabel: "Start Copy Trading",
        icon: <Users className="w-5 h-5" />,
        isAvailable: false,
        href: "/copy-trading",
        isComingSoon: true,
    }
]


// Feature card component
const FeatureCard = ({
    feature,
    isSelected,
    onClick,
}: {
    feature: Feature
    isSelected: boolean
    onClick: () => void
}) => {
    const cardRef = useRef<HTMLDivElement>(null)

    return (
        <motion.div
            ref={cardRef}
            onClick={onClick}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    onClick()
                }
            }}
            role="button"
            tabIndex={0}
            aria-expanded={isSelected}
            aria-controls={`detail-${feature.id}`}
            aria-label={`${feature.title}: ${feature.subtitle}`}
            className="relative group cursor-pointer"
            whileHover={{ y: -6 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
            <div
                className={`relative h-full p-6 rounded-xl border transition-all duration-300 backdrop-blur-sm ${isSelected
                        ? "border-primary/60 bg-gradient-to-br from-primary/15 to-primary/5 shadow-xl shadow-primary/20"
                        : "border-border bg-card/50 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 hover:bg-card/80"
                    }`}
            >
               

                {/* Content */}
               <Link href={feature.isAvailable ? feature.href : "#"} onClick={(e) => {
                    if (!feature.isAvailable) {
                        e.preventDefault()
                    }
               }}>
                    <div className="relative z-10 flex flex-col h-full">
                        {/* Icon area */}
                        <motion.div
                            className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center mb-4 text-primary border border-primary/20"
                            whileHover={{ scale: 1.15, rotate: 8 }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        >
                            {feature.icon}
                        </motion.div>

                        {/* Title and subtitle */}
                        <h3 className="font-semibold text-foreground mb-2 text-base line-clamp-2">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-grow">{feature.subtitle}</p>

                        {/* Indicator */}
                        <motion.div
                            className="flex items-center gap-2 text-xs text-primary font-semibold uppercase tracking-wide"
                            animate={{ x: isSelected ? 4 : 0 }}
                        >
                            <span>Learn more</span>
                            {feature.isComingSoon && (
                                <p className="text-xs text-muted-foreground">Coming soon</p>
                            )}
                        </motion.div>
                       
                    </div>
               </Link>
            </div>
        </motion.div>
    )
}


// Main component
export function FeaturesGrid({ features = DEFAULT_FEATURES, onNavigate }: FeaturesGridProps) {
    const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null)
    const selectedFeature = features.find((f) => f.id === selectedFeatureId) || null

    return (
        <div className="w-full mt-10 relative">
            <div className="bg-primary absolute -top-10 left-1/2 h-16 w-44 -translate-x-1/2 rounded-full opacity-40 blur-3xl select-none"></div>
            <div className="via-primary/50 absolute top-0 left-1/2 h-px w-3/5 -translate-x-1/2 bg-gradient-to-r from-transparent to-transparent transition-all ease-in-out"></div>
            <h2
                className={cn(
                    "via-foreground mb-8 bg-gradient-to-b mt-6 from-zinc-800 to-zinc-700 bg-clip-text text-center text-4xl font-semibold tracking-tighter text-transparent md:text-[54px] md:leading-[60px]",
                    geist.className,
                )}
            >
                Features
            </h2>
            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {features.map((feature) => (
                    <FeatureCard
                        key={feature.id}
                        feature={feature}
                        isSelected={selectedFeatureId === feature.id}
                        onClick={() => setSelectedFeatureId(feature.id)}
                    />
                ))}
            </div>


        </div>
    )
}
