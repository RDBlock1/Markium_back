"use client"

import { useState, useEffect, JSX } from "react"
import { motion } from "framer-motion"
import {
    Bot, User, Copy, Check,
    CheckCircle2, XCircle, AlertTriangle,
    Clock, TrendingUp, Info, Zap,
    ChevronRight, Shield, Target
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ChatMessage {
    id: string
    type: "user" | "ai"
    content: string
    timestamp: Date
    marketData?: any
    searchResults?: any[]
}

interface MessageProps {
    message: ChatMessage
}

export function Message({ message }: MessageProps) {
    const [displayedContent, setDisplayedContent] = useState("")
    const [isTyping, setIsTyping] = useState(message.type === "ai")
    const [copied, setCopied] = useState(false)
    const isUser = message.type === "user"
    const isWelcomeMessage = message.id === "1" && message.type === "ai"

    useEffect(() => {
        if (message.type === "ai" && isTyping) {
            let currentIndex = 0
            const content = message.content

            const typeNextChar = () => {
                if (currentIndex < content.length) {
                    setDisplayedContent(content.slice(0, currentIndex + 1))
                    currentIndex++

                    // Variable speed based on character
                    const char = content[currentIndex - 1]
                    let delay = Math.random() * 20 + 15 // 15-35ms base

                    // Pause at punctuation
                    if ([".", "!", "?"].includes(char)) {
                        delay += 200
                    } else if ([",", ";", ":"].includes(char)) {
                        delay += 100
                    }

                    setTimeout(typeNextChar, delay)
                } else {
                    setIsTyping(false)
                }
            }

            typeNextChar()
        } else {
            setDisplayedContent(message.content)
            setIsTyping(false)
        }
    }, [message.content, message.type, isTyping])

    const copyToClipboard = () => {
        navigator.clipboard.writeText(message.content)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const getHeaderIcon = (text: string) => {
        const lowerText = text.toLowerCase()
        if (lowerText.includes("yes resolution") || lowerText.includes("🎯")) {
            return <Target className="w-5 h-5 text-green-500 inline-block mr-2" />
        }
        if (lowerText.includes("no resolution") || lowerText.includes("❌")) {
            return <XCircle className="w-5 h-5 text-red-500 inline-block mr-2" />
        }
        if (lowerText.includes("edge case") || lowerText.includes("⚡")) {
            return <Zap className="w-5 h-5 text-yellow-500 inline-block mr-2" />
        }
        if (lowerText.includes("timeline") || lowerText.includes("📅")) {
            return <Clock className="w-5 h-5 text-blue-500 inline-block mr-2" />
        }
        if (lowerText.includes("warning") || lowerText.includes("⚠️")) {
            return <AlertTriangle className="w-5 h-5 text-orange-500 inline-block mr-2" />
        }
        if (lowerText.includes("advice") || lowerText.includes("💡")) {
            return <TrendingUp className="w-5 h-5 text-purple-500 inline-block mr-2" />
        }
        if (lowerText.includes("probability") || lowerText.includes("📊")) {
            return <TrendingUp className="w-5 h-5 text-indigo-500 inline-block mr-2" />
        }
        if (lowerText.includes("example") || lowerText.includes("🔍")) {
            return <Info className="w-5 h-5 text-cyan-500 inline-block mr-2" />
        }
        return null
    }

    const formatContent = (content: string) => {
        const lines = content.split("\n")
        const elements: JSX.Element[] = []
        let codeBlockContent: string[] = []
        let inCodeBlock = false

        lines.forEach((line, i) => {
            // Code blocks
            if (line.trim().startsWith("```")) {
                if (inCodeBlock) {
                    // End code block
                    elements.push(
                        <div key={`code-${i}`} className="my-4 rounded-lg bg-muted/50 p-4 font-mono text-sm border border-border/50">
                            {codeBlockContent.map((codeLine, j) => (
                                <div key={j} className="text-muted-foreground">{codeLine}</div>
                            ))}
                        </div>
                    )
                    codeBlockContent = []
                    inCodeBlock = false
                } else {
                    // Start code block
                    inCodeBlock = true
                }
                return
            }

            if (inCodeBlock) {
                codeBlockContent.push(line)
                return
            }

            // H1 Headers
            if (line.startsWith("# ") && !line.startsWith("## ")) {
                const text = line.replace("# ", "").trim()
                const icon = getHeaderIcon(text)
                elements.push(
                    <h1 key={i} className="mt-6 mb-3 text-2xl font-bold flex items-center border-b border-border/30 pb-2">
                        {icon}
                        <span>{text.replace(/[🎯❌⚡📅⚠️💡📊🔍]/g, "").trim()}</span>
                    </h1>
                )
                return
            }

            // H2 Headers
            if (line.startsWith("## ")) {
                const text = line.replace("## ", "").trim()
                const icon = getHeaderIcon(text)
                elements.push(
                    <h2 key={i} className="mt-5 mb-2 text-lg font-semibold flex items-center">
                        {icon}
                        <span>{text.replace(/[🎯❌⚡📅⚠️💡📊🔍]/g, "").trim()}</span>
                    </h2>
                )
                return
            }

            // H3 Headers
            if (line.startsWith("### ")) {
                const text = line.replace("### ", "").trim()
                elements.push(
                    <h3 key={i} className="mt-4 mb-2 text-base font-semibold text-foreground/90">
                        {text}
                    </h3>
                )
                return
            }

            // Checkboxes
            if (line.includes("☐")) {
                const text = line.replace("☐", "").trim()
                elements.push(
                    <div key={i} className="flex items-start gap-2 my-2 pl-4">
                        <div className="mt-0.5 w-4 h-4 rounded border-2 border-primary/40 flex-shrink-0" />
                        <span className="text-sm">{formatInlineText(text)}</span>
                    </div>
                )
                return
            }

            // Warnings/Alerts
            if (line.includes("⚠️") || line.includes("🚨")) {
                const text = line.replace(/[⚠️🚨]/g, "").trim()
                elements.push(
                    <div key={i} className="flex items-start gap-2 my-2 pl-4 text-orange-600 dark:text-orange-400">
                        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span className="text-sm font-medium">{formatInlineText(text)}</span>
                    </div>
                )
                return
            }

            // Arrows (->)
            if (line.includes("→")) {
                const parts = line.split("→")
                elements.push(
                    <div key={i} className="flex items-center gap-2 my-2 pl-4">
                        <span className="text-sm text-muted-foreground">{formatInlineText(parts[0])}</span>
                        <ChevronRight className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="text-sm font-semibold">{formatInlineText(parts[1])}</span>
                    </div>
                )
                return
            }

            // Bullet points
            if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
                const text = line.replace(/^[\s]*[-*]\s/, "").trim()
                elements.push(
                    <div key={i} className="flex items-start gap-2 my-1.5 pl-4">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                        <span className="text-sm">{formatInlineText(text)}</span>
                    </div>
                )
                return
            }

            // Horizontal rules
            if (line.trim() === "---") {
                elements.push(
                    <hr key={i} className="my-4 border-border/30" />
                )
                return
            }

            // Regular paragraphs
            if (line.trim()) {
                // Check if it's a recommendation line
                const isRecommendation = line.toLowerCase().includes("recommendation:")
                const hasYes = line.toUpperCase().includes("YES")
                const hasNo = line.toUpperCase().includes("NO")

                elements.push(
                    <p
                        key={i}
                        className={cn(
                            "my-2 text-sm leading-relaxed",
                            isRecommendation && "font-semibold text-base",
                            isRecommendation && hasYes && "text-green-600 dark:text-green-400",
                            isRecommendation && hasNo && "text-red-600 dark:text-red-400"
                        )}
                    >
                        {formatInlineText(line)}
                    </p>
                )
            } else {
                elements.push(<br key={i} />)
            }
        })

        return elements
    }

    const formatInlineText = (text: string) => {
        const parts = text.split(/(\*\*.*?\*\*)/g)
        return parts.map((part, i) => {
            if (part.startsWith("**") && part.endsWith("**")) {
                return (
                    <strong key={i} className="font-semibold text-foreground">
                        {part.slice(2, -2)}
                    </strong>
                )
            }
            return <span key={i}>{part}</span>
        })
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={cn("flex gap-3", isUser && "flex-row-reverse")}
        >
            {/* Avatar */}
            <div
                className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                    isUser ? "bg-primary shadow-lg shadow-primary/20" : "bg-gradient-to-br from-purple-500 to-blue-500 shadow-lg shadow-purple-500/20",
                )}
            >
                {isUser ? (
                    <User className="h-5 w-5 text-primary-foreground" />
                ) : (
                    <Bot className="h-5 w-5 text-white" />
                )}
            </div>

            {/* Message Content */}
            <div className={cn("flex max-w-[85%] flex-col gap-2", isUser && "items-end")}>
                <Card className={cn(
                    "p-5 shadow-sm",
                    isUser
                        ? "bg-primary/10 border-primary/20"
                        : "bg-card border-border/50"
                )}>
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                        {formatContent(displayedContent)}
                        {isTyping && (
                            <span className="ml-1 inline-block h-4 w-[2px] bg-foreground animate-pulse" />
                        )}
                    </div>

                    {/* Copy Button - Only show for non-welcome AI messages */}
                    {!isTyping && !isUser && !isWelcomeMessage && (
                        <div className="mt-4 pt-3 border-t border-border/30">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-xs hover:bg-primary/10"
                                onClick={copyToClipboard}
                            >
                                {copied ? (
                                    <>
                                        <Check className="mr-2 h-3 w-3 text-green-500" />
                                        <span className="text-green-500">Copied!</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="mr-2 h-3 w-3" />
                                        Copy analysis
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </Card>

                <span className="text-xs text-muted-foreground px-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>
        </motion.div>
    )
}