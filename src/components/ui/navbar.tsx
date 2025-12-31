"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import {
    BotIcon,
    Zap,
    Bookmark,
    BarChart3,
    Users,
    MessageSquare,
    Search,
    ChevronDown
} from "lucide-react"
import { useRouter } from "next/navigation"
import LoginButton from "../login-button"

interface Feature {
    id: string
    title: string
    subtitle: string
    description: string
    video: string
    ctaLabel: string
    href: string
    isAvalible?: boolean
    icon: React.ReactNode
}

const DEFAULT_FEATURES: Feature[] = [
    {
        id: "market-analyzer",
        title: "AI Market Analyzer",
        subtitle: "Automated market signals & trend summarization",
        description:
            "AI-driven market analysis that highlights sentiment shifts, liquidity moves, and unusual activity.",
        video: "/videos/market-analyzer-demo.mp4",
        ctaLabel: "Open Market Analyzer",
        href: "/ai-market-analyzer",
        icon: <BotIcon className="w-5 h-5" />,
    },
    {
        id: "rule-analyzer",
        title: "AI Rules Analyzer",
        subtitle: "Turn natural language into automated filters",
        description:
            "Write rules in plain English and let AI convert them into monitorable rules that watch markets in real-time.",
        video: "/videos/rule-analyzer-demo.mp4",
        ctaLabel: "Build a Rule",
        href: "/ai-rules-analyzer",
        icon: <Zap className="w-5 h-5" />,
    },
    {
        id: "watchlist",
        title: "Watchlist",
        subtitle: "Personalize & follow markets you care about",
        description:
            "Save markets to your watchlist, get push-style notifications inside the app, and see a compact timeline of key events.",
        video: "/videos/watchlist-demo.mp4",
        ctaLabel: "Go to Watchlist",
        href: "/watchlist",
        icon: <Bookmark className="w-5 h-5" />,
    },
    {
        id: "user-analytics",
        title: "User Analytics",
        subtitle: "Analyze trader activity & behavior",
        description:
            "Aggregate and explore trader-level metrics like conviction, trade frequency, and profit signals.",
        video: "/videos/user-analytics-demo.mp4",
        ctaLabel: "View Analytics",
        href: "/leaderboard",
        icon: <BarChart3 className="w-5 h-5" />,
    },
    {
        id: "user-explorer",
        title: "User Explorer",
        subtitle: "Discover top traders and their history",
        description:
            "Explore top traders on Polymarket, filter by accuracy, volume, and sectors, and follow them for quick insights.",
        video: "/videos/user-explorer-demo.mp4",
        ctaLabel: "Explore Users",
        href: "/user-profile",
        icon: <Users className="w-5 h-5" />,
    },
    {
        id: "mentions-analyzer",
        title: "AI Mentions Analyzer",
        subtitle: "Track social mentions & topics",
        description:
            "Detect rising topics and mentions across social sources and see how they correlate with market moves.",
        video: "/videos/mentions-demo.mp4",
        ctaLabel: "Open Mentions",
        href: "/mentions-analyzer",
        isAvalible: false,

        icon: <MessageSquare className="w-5 h-5" />,
    },
    {
        id: "keywords-search",
        title: "Keywords Search",
        subtitle: "Search markets by keywords & sentiment",
        description:
            "Powerful keyword search with sentiment filters and saved queries — find markets related to any phrase or topic quickly.",
        video: "/videos/keywords-demo.mp4",
        ctaLabel: "Search Markets",
        href: "/keywords-search",
        isAvalible: false,
        icon: <Search className="w-5 h-5" />,
    },
    {
        id: "copy-trading",
        title: "Copy Trading",
        subtitle: "Follow and replicate top traders' strategies",
        description:
            "Identify successful traders on Polymarket and automatically replicate their trades in real-time.",
        video: "/videos/copy-trading-demo.mp4",
        ctaLabel: "Start Copy Trading",
        href: "/copy-trading",
        isAvalible: false,
        icon: <Users className="w-5 h-5" />,
    },
]

export default function Navbar() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [isDesktopFeaturesOpen, setIsDesktopFeaturesOpen] = useState(false)
    const [isMobileFeaturesOpen, setIsMobileFeaturesOpen] = useState(false)

    const router = useRouter()

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement
            if (!target.closest('.features-dropdown')) {
                setIsDesktopFeaturesOpen(false)
            }
        }

        if (isDesktopFeaturesOpen) {
            document.addEventListener("click", handleClickOutside)
        }

        return () => document.removeEventListener("click", handleClickOutside)
    }, [isDesktopFeaturesOpen])

    const handleMobileNavClick = (href: string) => {
        setIsMobileMenuOpen(false)
        setIsMobileFeaturesOpen(false)
        router.push(href)
    }

    return (
        <>
            {/* Desktop Header */}
            <header
                className="sticky top-4 z-[9999] mx-auto hidden w-full max-w-7xl flex-row items-center bg-transparent justify-between rounded-full backdrop-blur-sm border border-border/50 shadow-lg md:flex px-4 py-2"
            >
                <Link
                    className="z-50 flex items-center justify-center gap-2"
                    href="/"
                >
                    <Image
                        src="/markium-logo.jpg"
                        alt="Markium Logo"
                        width={10}
                        height={10}
                        className="w-full "
                    />
                    <span className="hidden md:block text-2xl font-bold">MARKIUM</span>
                </Link>

                <nav className="absolute inset-0 hidden flex-1 flex-row items-center justify-center space-x-2 text-sm font-medium md:flex">
                    {/* Features Dropdown */}
                    <div className="relative features-dropdown">
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                setIsDesktopFeaturesOpen(!isDesktopFeaturesOpen)
                            }}
                            className="relative px-4 py-2 flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        >
                            <span className="relative z-20">Features</span>
                            <ChevronDown
                                className={`w-4 h-4 transition-transform duration-200 ${isDesktopFeaturesOpen ? "rotate-180" : ""
                                    }`}
                            />
                        </button>

                        {/* Dropdown Menu */}
                        {isDesktopFeaturesOpen && (
                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[600px] bg-background/95 backdrop-blur-md border border-border/50 rounded-2xl shadow-2xl p-4 z-50">
                                <div className="grid grid-cols-2 gap-3 max-h-[500px] overflow-y-auto">
                                    {DEFAULT_FEATURES.map((feature) => (
                                        <Link
                                            key={feature.id}
                                            href={feature.href}
                                            onClick={() => setIsDesktopFeaturesOpen(false)}
                                            className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors group text-left"
                                        >
                                            <div className="mt-1 text-primary shrink-0">{feature.icon}</div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                                                    {feature.title}
                                                </h3>
                                                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                                    {feature.subtitle}
                                                </p>
                                                {feature.isAvalible === false && (
                                                    <span className="text-cyan-400 text-xs">
                                                        Coming Soon
                                                    </span>
                                                )}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <Link
                        href="/market"
                        className="relative px-4 py-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                        <span className="relative z-20">Market</span>
                    </Link>

                    <Link
                        href="/leaderboard"
                        className="relative px-4 py-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                        <span className="relative z-20">Leaderboard</span>
                    </Link>

                    <Link
                        href="/blog"
                        className="relative px-4 py-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                        <span className="relative z-20">Blog</span>
                    </Link>
                </nav>

                <div className="flex items-center gap-4 z-50">
                    {/* Add any right-side content here */}
                    <LoginButton />
                </div>
            </header>

            {/* Mobile Header */}
            <header className="sticky top-4 z-[9999] mx-4 flex w-auto flex-row items-center justify-between rounded-full  backdrop-blur-sm border border-border/50 shadow-lg md:hidden px-4 py-3">
                <Link className="flex items-center justify-center gap-2" href="/">
                    <Image
                        src="/markium-logo.jpg"
                        alt="Markium Logo"
                        width={10}
                        height={10}
                        className="w-full max-w-[100px]"
                    />
                    <span className="  text-2xl font-bold">
                        MARKIUM
                    </span>
                </Link>

                <button
                    onClick={() => {
                        setIsMobileMenuOpen(!isMobileMenuOpen)
                        if (isMobileMenuOpen) {
                            setIsMobileFeaturesOpen(false)
                        }
                    }}
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-background/50 border border-border/50 transition-colors hover:bg-background/80"
                    aria-label="Toggle menu"
                >
                    <div className="flex flex-col items-center justify-center w-5 h-5 space-y-1">
                        <span
                            className={`block w-4 h-0.5 bg-foreground transition-all duration-300 ${isMobileMenuOpen ? "rotate-45 translate-y-1.5" : ""
                                }`}
                        />
                        <span
                            className={`block w-4 h-0.5 bg-foreground transition-all duration-300 ${isMobileMenuOpen ? "opacity-0" : ""
                                }`}
                        />
                        <span
                            className={`block w-4 h-0.5 bg-foreground transition-all duration-300 ${isMobileMenuOpen ? "-rotate-45 -translate-y-1.5" : ""
                                }`}
                        />
                    </div>
                </button>
            </header>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm md:hidden"
                    onClick={() => {
                        setIsMobileMenuOpen(false)
                        setIsMobileFeaturesOpen(false)
                    }}
                >
                    <div
                        className="absolute top-20 left-4 right-4 bg-background/95 backdrop-blur-md border border-border/50 rounded-2xl shadow-2xl p-6 max-h-[80vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <nav className="flex flex-col space-y-4">
                            {/* Features Accordion */}
                            <div>
                                <button
                                    onClick={() => setIsMobileFeaturesOpen(!isMobileFeaturesOpen)}
                                    className="w-full text-left px-4 py-3 text-lg font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-background/50 flex items-center justify-between"
                                >
                                    Features
                                    <ChevronDown
                                        className={`w-4 h-4 transition-transform duration-200 ${isMobileFeaturesOpen ? "rotate-180" : ""
                                            }`}
                                    />
                                </button>

                                {/* Mobile Features Submenu */}
                                {isMobileFeaturesOpen && (
                                    <div className="mt-2 ml-4 space-y-2 border-l-2 border-border/50 pl-4">
                                        {DEFAULT_FEATURES.map((feature) => (
                                            <Link
                                                key={feature.id}
                                                href={feature.href}
                                                onClick={() => handleMobileNavClick(feature.href)}
                                                className="w-full text-left flex items-start gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors"
                                            >
                                                <div className="mt-0.5 text-primary shrink-0">{feature.icon}</div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-sm font-medium text-foreground">
                                                        {feature.title}
                                                    </h3>
                                                    <p className="text-xs text-muted-foreground line-clamp-1">
                                                        {feature.subtitle}
                                                    </p>
                                                    {feature.isAvalible === false && (
                                                        <span className="text-cyan-400 text-xs">
                                                            Coming Soon
                                                        </span>
                                                    )}
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <Link
                                href="/market"
                                onClick={() => handleMobileNavClick("/market")}
                                className="text-left px-4 py-3 text-lg font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-background/50"
                            >
                                Market
                            </Link>

                            <Link
                                href="/leaderboard"
                                onClick={() => handleMobileNavClick("/leaderboard")}
                                className="text-left px-4 py-3 text-lg font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-background/50"
                            >
                                Leaderboard
                            </Link>

                            <Link
                                href="/blog"
                                onClick={() => handleMobileNavClick("/blog")}
                                className="text-left px-4 py-3 text-lg font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-background/50"
                            >
                                Blog
                            </Link>

                            <LoginButton />
                        </nav>
                    </div>
                </div>
            )}
        </>
    )
}