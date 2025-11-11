"use client"

import { useRef, useEffect } from "react"
import { Bot, Zap, TrendingUp, X, ExternalLink, Loader2 } from "lucide-react"
import { MessageItem, type Message } from "./message-item"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"

interface StreamingWord {
    id: number
    text: string
}

interface MessageSection {
    id: string
    messages: Message[]
    isNewSection: boolean
    isActive?: boolean
    sectionIndex: number
}

interface MarketSlug {
    id: string
    question: string
    slug?: string
    image?: string
    outcomePrices?: number[]
    volume?: number
    volume24hr?: number
}

interface MessageListProps {
    messageSections: MessageSection[]
    streamingWords: StreamingWord[]
    streamingMessageId: string | null
    completedMessages: Set<string>
    viewportHeight: number
    isMobile?: boolean
    onRegenerate?: (messageId: string) => void
    onEdit?: (messageId: string, newContent: string) => void
    // Market search results props
    searchResults?: MarketSlug[]
    showSearchResults?: boolean
    isSearching?: boolean
    onMarketClick?: (market: MarketSlug) => void
    onCloseSearchResults?: () => void
    isAnalyzing?: boolean
}

// Separate component for the welcome screen
function WelcomeScreen({ isAnalyzing }: { isAnalyzing?: boolean }) {
    return (
        <div className="flex flex-col items-center justify-center h-full min-h-[50vh] text-center px-4">
            <div className="relative">
                <div className={cn(
                    "w-16 h-16 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg",
                    isAnalyzing && "animate-pulse"
                )}>
                    <Bot className="w-8 h-8 text-white" />
                </div>
                {isAnalyzing && (
                    <div className="absolute -bottom-1 -right-1">
                        <div className="w-3 h-3 bg-yellow-400 rounded-full animate-ping" />
                    </div>
                )}
            </div>

            <h2 className="text-xl font-semibold text-gray-200 mb-2">
                Welcome to Markium AI Market Analyzer
            </h2>
            <p className="text-gray-400 max-w-md mb-4">
                I can help you analyze prediction markets with AI-powered insights.
                Enter a market question or select from trending markets below.
            </p>

            {isAnalyzing && (
                <div className="flex items-center gap-2 text-cyan-400 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="animate-pulse">Initializing market analysis...</span>
                </div>
            )}
        </div>
    )
}

// Market search results component
function MarketSearchResults({
    searchResults,
    isSearching,
    onMarketClick,
    onCloseSearchResults
}: {
    searchResults: MarketSlug[]
    isSearching: boolean
    onMarketClick?: (market: MarketSlug) => void
    onCloseSearchResults?: () => void
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 rounded-xl border border-gray-700 bg-gray-800/50 backdrop-blur-sm p-4"
        >
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-cyan-500" />
                    <h3 className="font-semibold text-sm text-gray-200">
                        {isSearching ? "Searching markets..." : `Found ${searchResults.length} market${searchResults.length !== 1 ? 's' : ''}`}
                    </h3>
                </div>

                {onCloseSearchResults && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onCloseSearchResults}
                        className="text-gray-400 hover:text-gray-200 -mr-2"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                )}
            </div>

            {isSearching ? (
                <div className="flex items-center justify-center py-8">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                </div>
            ) : searchResults.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                    No markets found. Try a different search term.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto custom-scrollbar">
                    {searchResults.map((market) => (
                        <Card
                            key={market.id}
                            className="p-4 cursor-pointer border-gray-700 bg-gray-800/50 hover:bg-gray-800/70 hover:border-cyan-500/50 transition-all duration-200 group"
                            onClick={() => onMarketClick?.(market)}
                        >
                            <div className="space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                    <p className="text-sm font-medium line-clamp-2 text-gray-200 group-hover:text-cyan-400 transition-colors flex-1">
                                        {market.question}
                                    </p>
                                    {market.image && (
                                        <Image
                                            src={market.image}
                                            alt=""
                                            height={40}
                                            width={40}
                                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0 ring-1 ring-gray-700"
                                            loading="lazy"
                                        />
                                    )}
                                </div>

                                <div className="flex items-center justify-between text-xs">
                                    <div className="flex gap-2">
                                        {market.volume24hr !== undefined && (
                                            <Badge variant="secondary" className="bg-gray-700/50 text-gray-300">
                                                24h: ${(market.volume24hr / 1000).toFixed(1)}k
                                            </Badge>
                                        )}
                                        {market.volume !== undefined && (
                                            <Badge variant="secondary" className="bg-gray-700/50 text-gray-300">
                                                Vol: ${(market.volume / 1000).toFixed(1)}k
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                {market.slug && (
                                    <a
                                        href={`${process.env.NEXT_PUBLIC_BASE_URL}/market/${market.slug}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-cyan-400 transition-colors"
                                    >
                                        View market <ExternalLink className="w-3 h-3" />
                                    </a>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </motion.div>
    )
}

export function MessageList({
    messageSections,
    streamingWords,
    streamingMessageId,
    completedMessages,
    viewportHeight,
    isMobile = false,
    onRegenerate,
    onEdit,
    searchResults = [],
    showSearchResults = false,
    isSearching = false,
    onMarketClick,
    onCloseSearchResults,
    isAnalyzing = false,
}: MessageListProps) {
    const chatContainerRef = useRef<HTMLDivElement>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const lastMessageCountRef = useRef(0)

    // Mobile-optimized constants
    const TOP_PADDING = 56 // Header height
    const BOTTOM_PADDING = isMobile ? 160 : 140 // Input area height
    const ADDITIONAL_OFFSET = 20

    const getContentHeight = () => {
        return Math.max(300, viewportHeight - TOP_PADDING - BOTTOM_PADDING - ADDITIONAL_OFFSET)
    }

    const shouldApplyHeight = (sectionIndex: number) => {
        return sectionIndex > 0
    }

    // Calculate total message count
    const totalMessageCount = messageSections.reduce(
        (count, section) => count + section.messages.length,
        0
    )

    // Auto-scroll to bottom when new messages arrive or when analyzing
    useEffect(() => {
        // Only scroll if new messages were added (not on initial load)
        if (totalMessageCount > lastMessageCountRef.current || isAnalyzing) {
            const scrollContainer = chatContainerRef.current
            if (scrollContainer) {
                // Use requestAnimationFrame for smoother scrolling
                requestAnimationFrame(() => {
                    scrollContainer.scrollTo({
                        top: scrollContainer.scrollHeight,
                        behavior: "smooth",
                    })
                })
            }
        }
        lastMessageCountRef.current = totalMessageCount
    }, [totalMessageCount, isAnalyzing])

    // Scroll to bottom when streaming starts
    useEffect(() => {
        if (streamingMessageId) {
            // Small delay to ensure DOM is updated
            const timeoutId = setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "end"
                })
            }, 100)

            return () => clearTimeout(timeoutId)
        }
    }, [streamingMessageId])

    // Check if there are any user messages
    const hasUserMessages = messageSections.some(section =>
        section.messages.some(msg => msg.type === 'user')
    )

    return (
        <div
            ref={chatContainerRef}
            className={cn(
                "flex-grow overflow-y-auto overflow-x-hidden",
                "scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent",
                "pt-16 pb-44", // Adequate padding
                isMobile && "mobile-scroll"
            )}
            style={{
                WebkitOverflowScrolling: "touch",
                scrollBehavior: "smooth",
            }}
        >
            <div className={cn(
                "mx-auto space-y-6",
                isMobile ? "max-w-full px-3" : "max-w-4xl px-8"
            )}>
                {/* Welcome message when no user messages */}
                {!hasUserMessages && <WelcomeScreen isAnalyzing={isAnalyzing} />}

                {/* Search Results Overlay */}
                <AnimatePresence mode="wait">
                    {showSearchResults && searchResults.length > 0 && (
                        <MarketSearchResults
                            searchResults={searchResults}
                            isSearching={isSearching}
                            onMarketClick={onMarketClick}
                            onCloseSearchResults={onCloseSearchResults}
                        />
                    )}
                </AnimatePresence>

                {/* Message Sections */}
                <AnimatePresence mode="sync">
                    {messageSections.map((section, sectionIndex) => (
                        <motion.div
                            key={section.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                        >
                            {section.isNewSection && (
                                <div
                                    style={
                                        section.isActive && shouldApplyHeight(section.sectionIndex)
                                            ? { minHeight: `${getContentHeight()}px` }
                                            : {}
                                    }
                                    className={cn(
                                        "flex flex-col justify-start",
                                        isMobile ? "space-y-4 pt-2" : "space-y-6 pt-4"
                                    )}
                                >
                                    {/* Section divider for new sections */}
                                    {sectionIndex > 0 && (
                                        <div className="flex items-center gap-4 my-4">
                                            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <Zap className="w-3 h-3" />
                                                <span>New conversation</span>
                                            </div>
                                            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
                                        </div>
                                    )}

                                    {section.messages.map((message) => (
                                        <MessageItem
                                            key={message.id}
                                            message={message}
                                            isStreaming={message.id === streamingMessageId}
                                            isCompleted={completedMessages.has(message.id)}
                                            onRegenerate={onRegenerate}
                                            onEdit={onEdit}
                                            isMobile={isMobile}
                                        />
                                    ))}
                                </div>
                            )}

                            {!section.isNewSection && (
                                <div className={cn(isMobile ? "space-y-4" : "space-y-6")}>
                                    {section.messages.map((message) => (
                                        <MessageItem
                                            key={message.id}
                                            message={message}
                                            isStreaming={message.id === streamingMessageId}
                                            isCompleted={completedMessages.has(message.id)}
                                            onRegenerate={onRegenerate}
                                            onEdit={onEdit}
                                            isMobile={isMobile}
                                        />
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Scroll anchor with loading indicator */}
                <div ref={messagesEndRef} className="h-8 flex items-center justify-center">
                    {isAnalyzing && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Analyzing...</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}