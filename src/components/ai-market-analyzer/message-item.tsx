/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
"use client"
import { useEffect, useState, useRef } from "react"
import { Edit2, Check, X, Copy, Bot, BotIcon, Sparkles } from "lucide-react"
import { MessageActions } from "./message-actions"
import { ChatImage } from "./image-upload"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export interface Message {
    id: string
    content: string
    type: "user" | "system"
    completed?: boolean
    newSection?: boolean
    images?: Array<{ url: string; alt: string }>
}

interface MessageItemProps {
    message: Message
    isStreaming?: boolean
    isCompleted?: boolean
    onRegenerate?: (messageId: string) => void
    onEdit?: (messageId: string, newContent: string) => void
    isMobile?: boolean
}

// Typing Indicator Component
function TypingIndicator() {
    return (
        <div className="flex items-center space-x-1 px-4 py-3">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
        </div>
    )
}

export function MessageItem({
    message,
    isStreaming = false,
    isCompleted = false,
    onRegenerate,
    onEdit,
    isMobile = false,
}: MessageItemProps) {
    const isUser = message.type === "user"
    const [isEditing, setIsEditing] = useState(false)
    const [editContent, setEditContent] = useState(message.content)
    const [isHovered, setIsHovered] = useState(false)
    const [displayedContent, setDisplayedContent] = useState("")
    const [isTyping, setIsTyping] = useState(false)
    const [showThinking, setShowThinking] = useState(false)
    const typingIntervalRef = useRef<NodeJS.Timeout | null>(null)
    const currentIndexRef = useRef(0)
    const hasStartedTyping = useRef(false)

    // ----------------------------
    // Reset typing state when message.id changes
    // (Add this effect to ensure reused components animate each new message)
    // ----------------------------
    useEffect(() => {
        // Clear any running timers and reset refs/state for a fresh message
        if (typingIntervalRef.current) {
            clearTimeout(typingIntervalRef.current)
            typingIntervalRef.current = null
        }
        hasStartedTyping.current = false
        currentIndexRef.current = 0
        setDisplayedContent("")
        setIsTyping(false)
        setShowThinking(false)
        // We intentionally don't return anything here because we cleared timers above.
        // The main typing effect below has its own cleanup too.
    }, [message.id])

    // Typing animation effect for bot messages
    useEffect(() => {
        // Clean up helper to avoid duplication
        const cleanupTimer = () => {
            if (typingIntervalRef.current) {
                clearTimeout(typingIntervalRef.current)
                typingIntervalRef.current = null
            }
        }

        // Only animate system messages when streaming OR when not completed yet
        if (!isUser && (isStreaming || !message.completed) && message.content && !hasStartedTyping.current) {
            hasStartedTyping.current = true
            setShowThinking(true)
            setDisplayedContent("")

            // Show thinking indicator for a moment
            const thinkingTimer = setTimeout(() => {
                setShowThinking(false)
                setIsTyping(true)
                currentIndexRef.current = 0

                const chars = message.content.split("")
                const totalChars = chars.length

                // Dynamic speed based on content length
                const baseDelay = totalChars < 100 ? 30 : totalChars < 500 ? 20 : 10

                const typeNextChar = () => {
                    if (currentIndexRef.current < totalChars) {
                        // Type 1-3 characters at a time for smoother animation
                        const charsToAdd = Math.min(
                            Math.floor(Math.random() * 2) + 1,
                            totalChars - currentIndexRef.current
                        )

                        setDisplayedContent(prev => {
                            return prev + chars.slice(currentIndexRef.current, currentIndexRef.current + charsToAdd).join("")
                        })

                        currentIndexRef.current += charsToAdd

                        // Variable delay for more natural typing
                        const delay = baseDelay + Math.random() * 20
                        typingIntervalRef.current = setTimeout(typeNextChar, delay)
                    } else {
                        // Animation complete
                        setIsTyping(false)
                        setDisplayedContent(message.content)
                    }
                }

                typeNextChar()
            }, 500) // Show thinking for 500ms

            // cleanup when dependencies change or component unmounts
            return () => {
                clearTimeout(thinkingTimer)
                cleanupTimer()
            }
        } else if (!isUser && message.completed) {
            // For completed messages, show full content immediately
            // and ensure no timers remain
            if (typingIntervalRef.current) {
                clearTimeout(typingIntervalRef.current)
                typingIntervalRef.current = null
            }
            setDisplayedContent(message.content)
            setIsTyping(false)
            setShowThinking(false)
            hasStartedTyping.current = true
        } else if (isUser) {
            setDisplayedContent(message.content)
        }

        // general cleanup to ensure no dangling timers
        return () => {
            if (typingIntervalRef.current) {
                clearTimeout(typingIntervalRef.current)
                typingIntervalRef.current = null
            }
        }
    }, [message.content, message.completed, isUser, isStreaming])

    // Update displayed content when message is marked as completed (extra safeguard)
    useEffect(() => {
        if (message.completed && typingIntervalRef.current) {
            clearTimeout(typingIntervalRef.current)
            typingIntervalRef.current = null
            setDisplayedContent(message.content)
            setIsTyping(false)
            setShowThinking(false)
        }
    }, [message.completed, message.content])

    const handleEdit = () => {
        setIsEditing(true)
        setEditContent(message.content)
    }

    const handleSaveEdit = () => {
        if (onEdit && editContent.trim() !== message.content) {
            onEdit(message.id, editContent.trim())
        }
        setIsEditing(false)
    }

    const handleCancelEdit = () => {
        setIsEditing(false)
        setEditContent(message.content)
    }

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(message.content)
            toast.success("Message copied to clipboard")
        } catch (error) {
            toast.error("Failed to copy message")
        }
    }

    // Markdown components for better rendering
    const markdownComponents = {
        p: ({ children }: any) => <p className="mb-2 last:mb-0">{children}</p>,
        h1: ({ children }: any) => <h1 className="text-xl font-bold mb-3 mt-4 first:mt-0">{children}</h1>,
        h2: ({ children }: any) => <h2 className="text-lg font-semibold mb-2 mt-3 first:mt-0">{children}</h2>,
        h3: ({ children }: any) => <h3 className="text-base font-semibold mb-2 mt-3 first:mt-0">{children}</h3>,
        ul: ({ children }: any) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
        ol: ({ children }: any) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
        li: ({ children }: any) => <li className="ml-2">{children}</li>,
        code: ({ inline, children }: any) =>
            inline ? (
                <code className="px-1.5 py-0.5 rounded bg-gray-700 text-blue-300 text-sm">{children}</code>
            ) : (
                <code className="block p-3 rounded-lg bg-gray-900 text-gray-100 overflow-x-auto my-2">{children}</code>
            ),
        pre: ({ children }: any) => <pre className="overflow-x-auto">{children}</pre>,
        blockquote: ({ children }: any) => (
            <blockquote className="border-l-4 border-blue-500 pl-4 my-2 italic text-gray-300">{children}</blockquote>
        ),
        a: ({ href, children }: any) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">
                {children}
            </a>
        ),
        strong: ({ children }: any) => <strong className="font-semibold text-white">{children}</strong>,
        em: ({ children }: any) => <em className="italic">{children}</em>,
    }

    return (
        <div className={cn(
            "flex flex-col w-full animate-in fade-in-0 slide-in-from-bottom-2 duration-300",
            isUser ? "items-end" : "items-start"
        )}>
            <div
                className={cn(
                    "group relative break-words transition-all duration-200",
                    isUser ? "max-w-[85%]" : "max-w-[90%]",
                    isMobile && isUser ? "max-w-[90%]" : "",
                    isMobile && !isUser ? "max-w-[95%]" : "",
                )}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* User messages */}
                {isUser && (
                    <div className="animate-in slide-in-from-right-2 duration-300">
                        <div
                            className={cn(
                                "rounded-2xl rounded-br-md px-4 py-3",
                                "bg-gradient-to-br from-blue-600 to-blue-700",
                                "text-white shadow-lg",
                                "inline-block max-w-fit",
                                "transform transition-all duration-200 hover:scale-[1.02]"
                            )}
                        >
                            <div className="space-y-3">
                                {/* Images */}
                                {message.images && message.images.length > 0 && (
                                    <div className={cn("grid gap-2", message.images.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
                                        {message.images.map((image, index) => (
                                            <ChatImage key={index} src={image.url} alt={image.alt} isMobile={isMobile} />
                                        ))}
                                    </div>
                                )}

                                {/* Text content - editable for user messages */}
                                {isEditing ? (
                                    <div className="space-y-2 min-w-[200px]">
                                        <Textarea
                                            value={editContent}
                                            onChange={(e) => setEditContent(e.target.value)}
                                            className="min-h-[60px] bg-white/10 border-white/20 text-white placeholder:text-white/70 focus:border-white/40 resize-none"
                                            autoFocus
                                        />
                                        <div className="flex gap-2">
                                            <Button size="sm" variant="secondary" onClick={handleSaveEdit} className="h-7 px-2 text-xs">
                                                <Check className="h-3 w-3 mr-1" />
                                                Save
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={handleCancelEdit}
                                                className="h-7 px-2 text-xs text-white/70 hover:text-white hover:bg-white/10"
                                            >
                                                <X className="h-3 w-3 mr-1" />
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    message.content && (
                                        <div className={cn("leading-relaxed whitespace-pre-wrap", isMobile ? "text-base" : "text-sm")}>
                                            {message.content}
                                        </div>
                                    )
                                )}
                            </div>

                            {/* Action buttons - show on hover/touch */}
                            {!isEditing && (isHovered || isMobile) && (
                                <div className="absolute -left-20 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={handleCopy}
                                        className="h-8 w-8 p-0 rounded-full shadow-md bg-white/90 hover:bg-white"
                                        title="Copy message"
                                    >
                                        <Copy className="h-3.5 w-3.5 text-gray-700" />
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={handleEdit}
                                        className="h-8 w-8 p-0 rounded-full shadow-md bg-white/90 hover:bg-white"
                                        title="Edit message"
                                    >
                                        <Edit2 className="h-3.5 w-3.5 text-gray-700" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* System messages with typing animation */}
                {!isUser && (
                    <div className="flex items-start gap-3 w-full animate-in slide-in-from-left-2 duration-300">
                        {/* Bot logo with gradient and animation */}
                        <div className="flex-shrink-0 mt-1">
                            <div className="relative">
                                <div className={cn(
                                    "w-8 h-8 rounded-full",
                                    "bg-gradient-to-br from-cyan-400 to-blue-500",
                                    "flex items-center justify-center",
                                    "shadow-lg",
                                    isTyping && "animate-pulse "
                                )}>
                                    <Bot className="h-4 w-4 text-white" />
                                </div>
                                {isTyping && (
                                    <div className="absolute -bottom-0.5 -right-0.5">
                                        <Sparkles className="h-3 w-3 text-yellow-400 animate-pulse" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 space-y-2">
                            {/* Show thinking indicator */}
                            {showThinking && !displayedContent && (
                                <div className="rounded-2xl rounded-bl-md shadow-sm bg-gray-800 inline-block">
                                    <TypingIndicator />
                                </div>
                            )}

                            {/* Content with typing animation */}
                            {displayedContent && (
                                <div className={cn(
                                    "rounded-2xl rounded-bl-md px-4 py-3",
                                    "bg-gradient-to-br from-gray-800 to-gray-850",
                                    "text-gray-100 shadow-lg",
                                    "inline-block max-w-fit min-w-[60px]",
                                    "transform transition-all duration-200",
                                    !isTyping && "hover:scale-[1.01]"
                                )}>
                                    <div className={cn("leading-relaxed", isMobile ? "text-base" : "text-sm")}>
                                        {/* Use markdown rendering for better formatting */}
                                        <div className="prose prose-invert prose-sm max-w-none">
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                components={markdownComponents}
                                            >
                                                {displayedContent}
                                            </ReactMarkdown>
                                        </div>

                                        {/* Typing cursor with better animation */}
                                        {isTyping && (
                                            <span className="inline-block ml-0.5 -mb-0.5">
                                                <span className="inline-block w-[2px] h-4 bg-gradient-to-b from-blue-400 to-cyan-400 animate-pulse rounded-full" />
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Message actions for completed system messages */}
            {!isUser && message.completed && (
                <div className={cn(
                    "mt-2 ml-11 animate-in fade-in-0 slide-in-from-bottom-1 duration-500",
                    "[animation-delay:200ms]"
                )}>
                    <MessageActions
                        messageId={message.id}
                        content={message.content}
                        onRegenerate={onRegenerate}
                        isMobile={isMobile}
                    />
                </div>
            )}
        </div>
    )
}
