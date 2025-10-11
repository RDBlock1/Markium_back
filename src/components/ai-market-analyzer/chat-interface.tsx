"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, Sparkles, TrendingUp, X, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { MarketSlug } from "@/types/market"
import { Message } from "./message"

export interface MarketData {
    id: string
    marketId?: string
    question: string
    description?: string
    slug?: string
    image?: string
    endDate?: string
    startDate?: string
    outcomes?: string[]
    volume?: number
    volume24hr?: number
    liquidity?: number
    currentPrices?: number[]
    outcomePrices?: number[]
    status?: "active" | "closed"
}

export interface ChatMessage {
    id: string
    type: "user" | "ai"
    content: string
    timestamp: Date
    marketData?: MarketData
    searchResults?: MarketSlug[]
}

export function ChatInterface() {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: "1",
            type: "ai",
            content: "Welcome to Polymarket AI Analyzer! I can help you analyze prediction markets with AI-powered insights. Enter a market question or select from trending markets below.",
            timestamp: new Date(),
        },
    ])
    const [inputMessage, setInputMessage] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [showSuggestions, setShowSuggestions] = useState(true)
    const [searchResults, setSearchResults] = useState<any[]>([])
    const [showSearchResults, setShowSearchResults] = useState(false)
    const [isSearching, setIsSearching] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    const trendingMarkets = [
        "New York City Mayoral Election",
        "Will Hamas release all Israeli hostages by October 31?",
        "Fed decision in October?",
        "100% tariff on China in effect by November 1?",
        "When will the Government shutdown end?",
    ]

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    // Auto-search when user types
    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current)
        }

        if (inputMessage.trim().length > 2) {
            setIsSearching(true)
            searchTimeoutRef.current = setTimeout(async () => {
                const markets = await searchMarkets(inputMessage.trim())
                console.log('found markets', markets)
                setSearchResults(markets)
                setShowSearchResults(markets.length > 0)
                setIsSearching(false)
            }, 500) // 500ms debounce
        } else {
            setSearchResults([])
            setShowSearchResults(false)
            setIsSearching(false)
        }

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current)
            }
        }
    }, [inputMessage])

    const searchMarkets = async (query: string): Promise<MarketSlug[]> => {
        try {
            const response = await fetch(`/api/market?q=${encodeURIComponent(query)}&limit=6`)
            if (!response.ok) throw new Error("Search failed")

            const data = await response.json()

            // Extract markets from PolymarketEvent[] and flatten them
            const events = data.data || []
            const allMarkets: MarketSlug[] = []

            for (const event of events) {
                if (event.markets && event.markets.length > 0) {
                    // Add all markets from this event
                    allMarkets.push(...event.markets)
                }
            }

            return allMarkets
        } catch (error) {
            console.error("Search error:", error)
            return []
        }
    }

    const handleSendMessage = async () => {
        if (!inputMessage.trim() || isLoading) return

        setIsLoading(true)
        setShowSuggestions(false)
        setShowSearchResults(false)

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            type: "user",
            content: inputMessage,
            timestamp: new Date(),
        }

        setMessages((prev) => [...prev, userMessage])
        const queryText = inputMessage
        setInputMessage("")
        setSearchResults([])

        try {
            // Use existing search results if available, otherwise search again
            let markets = searchResults.length > 0 ? searchResults : await searchMarkets(queryText)

            // Then get AI analysis using the correct API route
            const response = await fetch("/api/analyze-market", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    question: queryText,
                    marketId: "user-query",
                    description: queryText,
                    outcomes: ["Yes", "No"],
                    status: "active",
                    analysisType: "deep"
                }),
            })

            if (!response.ok) throw new Error("Analysis failed")

            const data = await response.json()

            const aiMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                type: "ai",
                content: data.analysis || `I found ${markets.length} market(s) related to your query. Here are my insights...`,
                timestamp: new Date(),
                searchResults: markets,
            }
            setMessages((prev) => [...prev, aiMessage])
        } catch (error) {
            console.error("Analysis error:", error)

            const errorMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                type: "ai",
                content: "I apologize, but I encountered an error analyzing this market. Please try again or check your connection.",
                timestamp: new Date(),
            }
            setMessages((prev) => [...prev, errorMessage])
        } finally {
            setIsLoading(false)
        }
    }

    const handleSuggestionClick = (suggestion: string) => {
        setInputMessage(suggestion)
        setShowSuggestions(false)
        inputRef.current?.focus()
    }

    const handleMarketClick = async (market: MarketData) => {
        setIsLoading(true)
        setShowSuggestions(false)
        setShowSearchResults(false)
        setSearchResults([])
        setInputMessage("")

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            type: "user",
            content: `Analyze: ${market.question}`,
            timestamp: new Date(),
            marketData: market,
        }

        setMessages((prev) => [...prev, userMessage])

        try {
            const response = await fetch("/api/analyze-market", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    question: market.question,
                    marketId: market.id || market.marketId,
                    description: market.description || market.question,
                    outcomes: market.outcomes || ["Yes", "No"],
                    status: market.status || "active",
                    volume: market.volume,
                    analysisType: "deep"
                }),
            })

            if (!response.ok) throw new Error("Analysis failed")

            const data = await response.json()

            const aiMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                type: "ai",
                content: data.analysis || "Here's my detailed analysis of this market...",
                timestamp: new Date(),
            }
            setMessages((prev) => [...prev, aiMessage])
        } catch (error) {
            console.error("Analysis error:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage()
        }
    }

    const formatVolume = (volume?: number) => {
        if (!volume) return "$0"
        if (volume >= 1000000) return `$${(volume / 1000000).toFixed(1)}M`
        if (volume >= 1000) return `$${(volume / 1000).toFixed(0)}K`
        return `$${volume.toFixed(0)}`
    }

    return (
        <div className="flex h-[90vh] flex-col bg-gradient-to-b from-background to-muted/20">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-6">
                <div className="container mx-auto max-w-4xl space-y-6">
                    <AnimatePresence mode="popLayout">
                        {messages.map((message) => (
                            <Message key={message.id} message={message} />
                        ))}
                    </AnimatePresence>

                    {isLoading && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-2 text-muted-foreground"
                        >
                            <div className="h-2 w-2 animate-bounce rounded-full bg-primary" />
                            <div className="h-2 w-2 animate-bounce rounded-full bg-primary delay-100" />
                            <div className="h-2 w-2 animate-bounce rounded-full bg-primary delay-200" />
                            <span className="ml-2 text-sm">Analyzing market...</span>
                        </motion.div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input Area - ChatGPT Style */}
            <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto max-w-3xl px-4 py-6">
                    {/* Trending Markets - Show only when no messages and no input */}
                    <AnimatePresence>
                        {showSuggestions && messages.length === 1 && !inputMessage.trim() && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="mb-6 space-y-3"
                            >
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <TrendingUp className="w-4 h-4" />
                                    <span className="text-sm font-medium">Trending Markets</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto">
                                    {trendingMarkets.map((market, index) => (
                                        <motion.button
                                            key={index}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            onClick={() => handleSuggestionClick(market)}
                                            className="group relative overflow-hidden rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary hover:shadow-lg hover:shadow-primary/10"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                                            <p className="relative text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                                                {market}
                                            </p>
                                        </motion.button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Search Results - Show when typing (removed messages.length === 1 condition) */}
                        {((showSearchResults && searchResults.length > 0) || isSearching) && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="mb-6 rounded-xl border bg-card/50 backdrop-blur p-4"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4 text-primary" />
                                        <h3 className="font-semibold text-sm">
                                            {isSearching ? "Searching..." : `Search Results (${searchResults.length})`}
                                        </h3>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setShowSearchResults(false)
                                            setInputMessage("")
                                        }}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                                {isSearching ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
                                            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0.1s" }} />
                                            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0.2s" }} />
                                        </div>
                                    </div>
                                ) : searchResults.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground text-sm">
                                        No markets found. Try a different search term.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto">
                                        {searchResults.map((market) => (
                                            <Card
                                                key={market.id}
                                                className="p-4 cursor-pointer hover:border-primary transition-all group"
                                                onClick={() => handleMarketClick(market)}
                                            >
                                                <div className="space-y-3">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <p className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors flex-1">
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
                                                            {/* {market.volume24hr && (
                                                                <Badge variant="secondary" className="text-xs">
                                                                    24h: {formatVolume(market.volume24hr)}
                                                                </Badge>
                                                            )}
                                                            {market.volume && (
                                                                <Badge variant="outline" className="text-xs">
                                                                    Vol: {formatVolume(market.volume)}
                                                                </Badge>
                                                            )} */}
                                                        </div>
                                                        {market.outcomePrices && market.outcomePrices[0] && (
                                                            <span className="text-primary font-semibold">
                                                                {/* {(market.outcomePrices[0] * 100).toFixed(0)}% */}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {market.slug && (
                                                        <a
                                                            href={`https://polymarket.com/event/${market.slug}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
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

                    <div className="relative flex items-end gap-3">
                        <div className="flex-1 relative">
                            <Input
                                ref={inputRef}
                                type="text"
                                placeholder="paste any prediction market title or question..."
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                onKeyPress={handleKeyPress}
                                disabled={isLoading}
                                className="w-full rounded-2xl border-2 pr-12 py-6 text-base resize-none focus:border-primary transition-all"
                            />
                        </div>
                        <Button
                            onClick={handleSendMessage}
                            disabled={!inputMessage.trim() || isLoading}
                            size="lg"
                            className="rounded-xl h-12 w-12 p-0 flex-shrink-0"
                        >
                            <Send className="w-5 h-5" />
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground text-center mt-3">
                        AI can make mistakes. Verify important market information.
                    </p>
                </div>
            </div>
        </div>
    )
}