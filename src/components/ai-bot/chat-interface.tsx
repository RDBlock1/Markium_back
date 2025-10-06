"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Moon, Sun, Sparkles, ChevronDown, ChevronUp, History, Download, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { MarketDataForm } from "@/components/ai-bot/market-data"
import { Message } from "@/components/ai-bot/message"
import {toast} from 'sonner'

export interface MarketData {
    marketId: string
    question: string
    description: string
    endDate?: string
    startDate?: string
    outcomes: string[]
    volume?: number
    currentPrices?: number[]
    status: "active" | "closed"
}

export interface ChatMessage {
    id: string
    type: "user" | "ai"
    content: string
    timestamp: Date
    marketData?: MarketData
}

export function ChatInterface() {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: "1",
            type: "ai",
            content:
                "Welcome to Polymarket AI Analyzer! I can help you analyze prediction markets with AI-powered insights. Submit market data below to get started.",
            timestamp: new Date(),
        },
    ])
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [isDarkMode, setIsDarkMode] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [showHistory, setShowHistory] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)


    useEffect(() => {
        // Load theme preference
        const savedTheme = localStorage.getItem("theme")
        if (savedTheme === "dark") {
            setIsDarkMode(true)
            document.documentElement.classList.add("dark")
        }

        // Load chat history
        const savedMessages = localStorage.getItem("chatHistory")
        if (savedMessages) {
            try {
                const parsed = JSON.parse(savedMessages)
                setMessages(
                    parsed.map((msg: ChatMessage) => ({
                        ...msg,
                        timestamp: new Date(msg.timestamp),
                    })),
                )
            } catch (e) {
                console.error("[v0] Failed to load chat history:", e)
            }
        }
    }, [])

    useEffect(() => {
        // Save chat history
        localStorage.setItem("chatHistory", JSON.stringify(messages))
    }, [messages])

    useEffect(() => {
        // Auto-scroll to bottom
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode)
        document.documentElement.classList.toggle("dark")
        localStorage.setItem("theme", !isDarkMode ? "dark" : "light")
    }

    const handleAnalyzeMarket = async (marketData: MarketData, analysisType: "quick" | "deep") => {
        setIsLoading(true)
        setIsFormOpen(false)

        // Add user message
        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            type: "user",
            content: `Analyze this market: "${marketData.question}"`,
            timestamp: new Date(),
            marketData,
        }
        setMessages((prev) => [...prev, userMessage])

        try {
            const response = await fetch("/api/analyze-market-rule", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...marketData, analysisType }),
            })

            if (!response.ok) throw new Error("Analysis failed")

            const data = await response.json()

            // Add AI response
            const aiMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                type: "ai",
                content: data.analysis,
                timestamp: new Date(),
            }
            setMessages((prev) => [...prev, aiMessage])
        } catch (error) {
            console.error("[v0] Analysis error:", error)
            toast.error("Analysis Failed",
                {
                    description: "Failed to analyze market. Please try again.",
                }
            )

            // Add error message
            const errorMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                type: "ai",
                content:
                    "I apologize, but I encountered an error analyzing this market. Please try again or check your connection.",
                timestamp: new Date(),
            }
            setMessages((prev) => [...prev, errorMessage])
        } finally {
            setIsLoading(false)
        }
    }

    const clearChat = () => {
        setMessages([
            {
                id: "1",
                type: "ai",
                content:
                    "Welcome to Polymarket AI Analyzer! I can help you analyze prediction markets with AI-powered insights. Submit market data below to get started.",
                timestamp: new Date(),
            },
        ])
        localStorage.removeItem("chatHistory")
        toast( "Chat Cleared",{
            description: "Your conversation history has been cleared.",
        })
    }

    const exportChat = () => {
        const markdown = messages
            .map((msg) => {
                const time = msg.timestamp.toLocaleTimeString()
                const sender = msg.type === "user" ? "You" : "AI"
                return `**${sender}** (${time})\n${msg.content}\n`
            })
            .join("\n---\n\n")

        const blob = new Blob([markdown], { type: "text/markdown" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `polymarket-analysis-${Date.now()}.md`
        a.click()
        URL.revokeObjectURL(url)

        toast( "Chat Exported",{
            description: "Your conversation has been exported as Markdown.",
        })
    }

    return (
        <div className="flex h-screen flex-col bg-background">

            {/* Header */}
            <motion.header
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="glass sticky top-0 z-50 border-b border-border/50 bg-card/50"
            >
                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-6 w-6 text-primary" />
                        <h1 className="text-xl font-semibold text-foreground">Polymarket AI Analyzer</h1>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setShowHistory(!showHistory)} className="hidden md:flex">
                            <History className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={exportChat}>
                            <Download className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={clearChat}>
                            <Trash2 className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={toggleTheme}>
                            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                        </Button>
                    </div>
                </div>
            </motion.header>

            {/* Main Chat Area */}
            <div className="flex flex-1 overflow-hidden">
                {/* History Sidebar */}
                <AnimatePresence>
                    {showHistory && (
                        <motion.aside
                            initial={{ x: -300, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -300, opacity: 0 }}
                            className="glass hidden w-80 border-r border-border/50 bg-sidebar/50 p-4 md:block"
                        >
                            <h2 className="mb-4 text-lg font-semibold text-sidebar-foreground">History</h2>
                            <div className="space-y-2">
                                {messages
                                    .filter((msg) => msg.type === "user" && msg.marketData)
                                    .map((msg) => (
                                        <Card
                                            key={msg.id}
                                            className="glass cursor-pointer p-3 transition-colors hover:bg-sidebar-accent/20"
                                        >
                                            <p className="text-sm font-medium text-sidebar-foreground line-clamp-2">
                                                {msg.marketData?.question}
                                            </p>
                                            <p className="mt-1 text-xs text-sidebar-foreground/60">{msg.timestamp.toLocaleDateString()}</p>
                                        </Card>
                                    ))}
                            </div>
                        </motion.aside>
                    )}
                </AnimatePresence>

                {/* Messages */}
                <main className="flex flex-1 flex-col overflow-hidden">
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

                    {/* Input Area */}
                    <div className="glass border-t border-border/50 bg-card/50 p-4">
                        <div className="container mx-auto max-w-4xl">
                            <AnimatePresence>
                                {isFormOpen && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="mb-4 overflow-hidden"
                                    >
                                        <MarketDataForm onSubmit={handleAnalyzeMarket} isLoading={isLoading} />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <Button onClick={() => setIsFormOpen(!isFormOpen)} className="w-full" size="lg" disabled={isLoading}>
                                {isFormOpen ? (
                                    <>
                                        <ChevronDown className="mr-2 h-5 w-5" />
                                        Hide Form
                                    </>
                                ) : (
                                    <>
                                        <ChevronUp className="mr-2 h-5 w-5" />
                                        Analyze Market
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}
