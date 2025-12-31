"use client"

import { useRef, useEffect } from "react"
import { Bot, Zap, TrendingUp, X, ExternalLink } from "lucide-react"
import { MessageItem, type Message } from "./message-item"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

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
}: MessageListProps) {
    const chatContainerRef = useRef<HTMLDivElement>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Mobile-optimized constants with better spacing
    const TOP_PADDING = 56 // Header height
    const BOTTOM_PADDING = isMobile ? 160 : 140 // Input area height with more space
    const ADDITIONAL_OFFSET = 20

    const getContentHeight = () => {
        return Math.max(300, viewportHeight - TOP_PADDING - BOTTOM_PADDING - ADDITIONAL_OFFSET)
    }

    const shouldApplyHeight = (sectionIndex: number) => {
        return sectionIndex > 0
    }

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (messageSections.length > 0) {
            setTimeout(() => {
                const scrollContainer = chatContainerRef.current
                if (scrollContainer) {
                    scrollContainer.scrollTo({
                        top: scrollContainer.scrollHeight,
                        behavior: "smooth",
                    })
                }
            }, 100)
        }
    }, [messageSections.length, streamingWords])

    // Scroll to bottom when streaming starts
    useEffect(() => {
        if (streamingMessageId) {
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
            }, 200)
        }
    }, [streamingMessageId])


    const hasMessages = messageSections.length > 0 &&
        messageSections.some(section =>
            section.messages.some(msg => msg.type === 'user')
        )

    return (
        <div
            ref={chatContainerRef}
            className={cn(
                "flex-grow overflow-y-auto overflow-x-hidden mobile-scroll hide-scrollbar",
                "pt-16 pb-44", // Increased padding to prevent overlaps
            )}
            style={{
                WebkitOverflowScrolling: "touch",
                scrollBehavior: "smooth",
            }}
        >
            <div className={cn("mx-auto space-y-6", isMobile ? "max-w-full px-4" : "max-w-7xl px-8")}>
                {/* Welcome message when no user messages */}
                {!hasMessages && (
                    <div className="flex flex-col items-center justify-center h-full min-h-[50vh] text-center px-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                            <Bot className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-200 mb-2">Welcome to Markium AI  Rules Analyzer</h2>
                        <p className="text-gray-300 max-w-md">
                            Welcome to Polymarket AI Rules Analyzer! I can help you to understand rules in prediction markets with AI-powered insights. Enter a market question or select from trending markets below.
                        </p>
                    </div>
                )}

                {/* Search Results - Keep this but remove trending markets from here */}
                <AnimatePresence>
                    {((showSearchResults && searchResults.length > 0) || isSearching) && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mb-6 rounded-xl border border-gray-700 bg-gray-800/50 backdrop-blur p-4"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-cyan-500" />
                                    <h3 className="font-semibold text-sm text-gray-200">
                                        {isSearching ? "Searching..." : `Search Results (${searchResults.length})`}
                                    </h3>
                                </div>

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={onCloseSearchResults}
                                    className="text-gray-400 hover:text-gray-200"
                                >
                                    <X className="w-4 h-4" />
                                </Button>

                            </div>
                            {isSearching ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-cyan-50-500 animate-bounce" />
                                        <div className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: "0.1s" }} />
                                        <div className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: "0.2s" }} />
                                    </div>
                                </div>
                            ) : searchResults.length === 0 ? (
                                <div className="text-center py-8 text-gray-400 text-sm">
                                    No markets found. Try a different search term.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto">
                                    {searchResults.map((market) => (
                                        <Card
                                            key={market.id}
                                            className="p-4 cursor-pointer border-gray-700 bg-gray-800/50 hover:border-cyan-500 transition-all group"
                                            onClick={() => onMarketClick?.(market)}
                                        >
                                            <div className="space-y-3">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className="text-sm font-medium line-clamp-2 text-gray-200 group-hover:text-cyan-400 transition-colors flex-1">
                                                        {market.question}
                                                    </p>
                                                    {market.image && (
                                                        <img
                                                            src={market.image}
                                                            alt=""
                                                            className="w-10 h-10 rounded object-cover flex-shrink-0"
                                                        />
                                                    )}
                                                </div>

                                                <div className="flex items-center justify-between text-xs">
                                                    <div className="flex gap-2">
                                                        {market.volume24hr && (
                                                            <Badge variant="secondary" className="bg-gray-700 text-gray-300">
                                                                24h Vol: ${market.volume24hr?.toLocaleString() || 0}
                                                            </Badge>
                                                        )}
                                                        {market.volume && (
                                                            <Badge variant="secondary" className="bg-gray-700 text-gray-300">
                                                                Total: ${market.volume?.toLocaleString() || 0}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    {market.outcomePrices && market.outcomePrices[0] && (
                                                        <span className="text-blue-400 font-semibold">
                                                            {(market.outcomePrices[0] * 100).toFixed(0)}%
                                                        </span>
                                                    )}
                                                </div>

                                                {market.slug && (
                                                    <a
                                                        href={`https://polymarket.com/event/${market.slug}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="text-xs text-gray-400 hover:text-cyan-400 flex items-center gap-1"
                                                    >
                                                        View on Polymarket <ExternalLink className="w-3 h-3" />
                                                    </a>
                                                )}
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Messages */}
                {messageSections.map((section, sectionIndex) => (
                    <div key={section.id}>
                        {section.isNewSection && (
                            <div
                                style={
                                    section.isActive && shouldApplyHeight(section.sectionIndex)
                                        ? { minHeight: `${getContentHeight()}px` }
                                        : {}
                                }
                                className={cn("flex flex-col justify-start", isMobile ? "space-y-4 pt-2" : "space-y-6 pt-4")}
                            >
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
                    </div>
                ))}
                <div ref={messagesEndRef} className="h-8" />
            </div>
        </div>
    )
}