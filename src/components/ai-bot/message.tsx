"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Bot, User, Copy, Check } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { ChatMessage } from "./chat-interface"
import { cn } from "@/lib/utils"

interface MessageProps {
    message: ChatMessage
}

export function Message({ message }: MessageProps) {
    const [displayedContent, setDisplayedContent] = useState("")
    const [isTyping, setIsTyping] = useState(message.type === "ai")
    const [copied, setCopied] = useState(false)
    const isUser = message.type === "user"

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
    }, [message.content, message.type])

    const copyToClipboard = () => {
        navigator.clipboard.writeText(message.content)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const formatContent = (content: string) => {
        // Simple markdown-like formatting
        return content.split("\n").map((line, i) => {
            // Headers
            if (line.startsWith("## ")) {
                return (
                    <h2 key={i} className="mt-4 text-xl font-bold text-card-foreground">
                        {line.replace("## ", "")}
                    </h2>
                )
            }
            if (line.startsWith("# ")) {
                return (
                    <h1 key={i} className="mt-4 text-2xl font-bold text-card-foreground">
                        {line.replace("# ", "")}
                    </h1>
                )
            }

            // Bold text
            const boldFormatted = line.split(/(\*\*.*?\*\*)/).map((part, j) => {
                if (part.startsWith("**") && part.endsWith("**")) {
                    return (
                        <strong key={j} className="font-semibold text-card-foreground">
                            {part.slice(2, -2)}
                        </strong>
                    )
                }
                return part
            })

            // Recommendations with color
            if (line.includes("Recommendation:")) {
                const hasYes = line.toUpperCase().includes("YES")
                const hasNo = line.toUpperCase().includes("NO")
                return (
                    <p key={i} className={cn("mt-2 font-semibold", hasYes && "text-secondary", hasNo && "text-destructive")}>
                        {boldFormatted}
                    </p>
                )
            }

            return line ? (
                <p key={i} className="mt-2 text-card-foreground">
                    {boldFormatted}
                </p>
            ) : (
                <br key={i} />
            )
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
                    isUser ? "bg-primary" : "bg-secondary",
                )}
            >
                {isUser ? (
                    <User className="h-5 w-5 text-primary-foreground" />
                ) : (
                    <Bot className="h-5 w-5 text-secondary-foreground" />
                )}
            </div>

            {/* Message Content */}
            <div className={cn("flex max-w-[80%] flex-col gap-2", isUser && "items-end")}>
                <Card className={cn("glass p-4", isUser ? "bg-primary/10 border-primary/20" : "bg-card border-border/50")}>
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                        {formatContent(displayedContent)}
                        {isTyping && <span className="typewriter-cursor ml-1 inline-block h-4 w-0.5 bg-foreground" />}
                    </div>

                    {!isTyping && !isUser && (
                        <Button variant="ghost" size="sm" className="mt-2" onClick={copyToClipboard}>
                            {copied ? (
                                <>
                                    <Check className="mr-2 h-3 w-3" />
                                    Copied
                                </>
                            ) : (
                                <>
                                    <Copy className="mr-2 h-3 w-3" />
                                    Copy
                                </>
                            )}
                        </Button>
                    )}
                </Card>

                <span className="text-xs text-muted-foreground">{message.timestamp.toLocaleTimeString()}</span>
            </div>
        </motion.div>
    )
}
