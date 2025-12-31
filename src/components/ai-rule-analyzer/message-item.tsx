/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import { useEffect, useState, useRef } from "react"
import { Edit2, Check, X, Copy, Bot, User, Sparkles, Loader2 } from "lucide-react"
import { MessageActions } from "./message-actions"
import { ChatImage } from "../ai-market-analyzer/image-upload"
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
    isLoading?: boolean
}

interface MessageItemProps {
    message: Message
    isStreaming?: boolean
    isCompleted?: boolean
    onRegenerate?: (messageId: string) => void
    onEdit?: (messageId: string, newContent: string) => void
    isMobile?: boolean
}

// Enhanced Typing Indicator Component
function TypingIndicator() {
    return (
        <div className="flex items-center space-x-1.5 px-4 py-3">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
    )
}

// Loading State Component for Market Analysis
function AnalyzingLoader() {
    return (
        <div className="flex items-center gap-2 px-4 py-3">
            <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
            <span className="text-sm text-gray-300 animate-pulse">Analyzing market data...</span>
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
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const typingCompleteRef = useRef(false)

    // Improved typing animation effect
    useEffect(() => {
        // Clear any existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current)
            typingTimeoutRef.current = null
        }

        // For user messages, show content immediately
        if (isUser) {
            setDisplayedContent(message.content)
            setIsTyping(false)
            return
        }

        // For bot messages
        if (!message.content) {
            // If no content yet, reset displayed content
            setDisplayedContent("")
            setIsTyping(false)
            return
        }

        // If message is already completed and we've already typed it out, just display it
        if (isCompleted && typingCompleteRef.current) {
            setDisplayedContent(message.content)
            setIsTyping(false)
            return
        }

        // If this is a new message or content changed, start typing animation
        if (message.content && !typingCompleteRef.current) {
            setIsTyping(true)
            let currentIndex = 0
            const fullText = message.content
            const words = fullText.split(' ')

            const typeNextWord = () => {
                if (currentIndex < words.length) {
                    const nextContent = words.slice(0, currentIndex + 1).join(' ')
                    setDisplayedContent(nextContent)
                    currentIndex++

                    // Faster typing for better UX (30ms per word)
                    typingTimeoutRef.current = setTimeout(typeNextWord, 30)
                } else {
                    // Typing complete
                    setIsTyping(false)
                    setDisplayedContent(fullText)
                    typingCompleteRef.current = true
                }
            }

            // Start typing
            typeNextWord()
        }

        // Cleanup function
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current)
                typingTimeoutRef.current = null
            }
        }
    }, [message.content, isCompleted, isUser])

    // Reset typing complete flag when message changes
    useEffect(() => {
        typingCompleteRef.current = false
    }, [message.id])

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

    // Markdown components configuration
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
                <code className="px-1.5 py-0.5 rounded bg-gray-700 text-cyan-300 text-sm">{children}</code>
            ) : (
                <code className="block p-3 rounded-lg bg-gray-900 text-gray-100 overflow-x-auto my-2">{children}</code>
            ),
        pre: ({ children }: any) => <pre className="overflow-x-auto">{children}</pre>,
        blockquote: ({ children }: any) => (
            <blockquote className="border-l-4 border-cyan-500 pl-4 my-2 italic text-gray-300">{children}</blockquote>
        ),
        a: ({ href, children }: any) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline">
                {children}
            </a>
        ),
        strong: ({ children }: any) => <strong className="font-semibold text-white">{children}</strong>,
        em: ({ children }: any) => <em className="italic">{children}</em>,
    }

    return (
        <div className={cn("flex gap-3 w-full", isUser ? "flex-row-reverse" : "flex-row")}>
            {/* Avatar Icon - Always visible */}
            <div className="flex-shrink-0">
                {isUser ? (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg ring-2 ring-blue-400/20">
                        <User className="h-4 w-4 text-white" />
                    </div>
                ) : (
                    <div className="relative">
                        <div className={cn(
                            "w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-lg ring-2 ring-cyan-400/20",
                            (isStreaming || message.isLoading) && "animate-pulse"
                        )}>
                            <Bot className="h-4 w-4 text-white" />
                        </div>
                        {(isStreaming || isTyping || message.isLoading) && (
                            <div className="absolute -bottom-0.5 -right-0.5">
                                <Sparkles className="h-3 w-3 text-yellow-400 animate-pulse" />
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Message Content */}
            <div className="flex-1 min-w-0">
                {isUser ? (
                    // User Message
                    <div className="flex flex-col items-end">
                        <div
                            className={cn(
                                "rounded-2xl rounded-br-md px-4 py-3 max-w-[85%]",
                                "bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg",
                                isMobile && "max-w-[90%]"
                            )}
                            onMouseEnter={() => setIsHovered(true)}
                            onMouseLeave={() => setIsHovered(false)}
                        >
                            {message.images && message.images.length > 0 && (
                                <div className={cn("grid gap-2 mb-3", message.images.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
                                    {message.images.map((image, index) => (
                                        <ChatImage key={index} src={image.url} alt={image.alt} isMobile={isMobile} />
                                    ))}
                                </div>
                            )}

                            {isEditing ? (
                                <div className="space-y-2 min-w-[200px]">
                                    <Textarea
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        className="min-h-[60px] bg-white/10 border-white/20 text-white placeholder:text-white/50"
                                        autoFocus
                                    />
                                    <div className="flex gap-2">
                                        <Button size="sm" onClick={handleSaveEdit} className="bg-white/20 hover:bg-white/30">
                                            <Check className="h-3 w-3 mr-1" /> Save
                                        </Button>
                                        <Button size="sm" variant="ghost" onClick={handleCancelEdit} className="hover:bg-white/10">
                                            <X className="h-3 w-3 mr-1" /> Cancel
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className={cn("whitespace-pre-wrap break-words", isMobile ? "text-sm" : "text-sm")}>
                                    {message.content}
                                </div>
                            )}
                        </div>

                        {!isEditing && (isHovered || isMobile) && (
                            <div className="flex gap-1 mt-2">
                                <Button variant="ghost" size="sm" onClick={handleCopy} className="hover:bg-gray-700/50">
                                    <Copy className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={handleEdit} className="hover:bg-gray-700/50">
                                    <Edit2 className="h-3 w-3" />
                                </Button>
                            </div>
                        )}
                    </div>
                ) : (
                    // Bot Message
                    <div className="flex flex-col">
                        {/* Show appropriate loading state */}
                        {message.isLoading ? (
                            <div className="rounded-2xl rounded-bl-md shadow-lg bg-gray-800 inline-block max-w-fit">
                                <AnalyzingLoader />
                            </div>
                        ) : isStreaming && !displayedContent ? (
                            <div className="rounded-2xl rounded-bl-md shadow-lg bg-gray-800 inline-block max-w-fit">
                                <TypingIndicator />
                            </div>
                        ) : displayedContent ? (
                            <div className={cn(
                                "rounded-2xl rounded-bl-md px-4 py-3 max-w-[90%]",
                                "bg-gradient-to-br from-gray-800 to-gray-850 text-gray-100 shadow-lg inline-block",
                                isMobile && "max-w-[95%]"
                            )}>
                                <div className={cn("prose prose-invert prose-sm max-w-none", isMobile ? "text-sm" : "text-sm")}>
                                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                                        {displayedContent}
                                    </ReactMarkdown>
                                    {/* Typing cursor */}
                                    {isTyping && (
                                        <span className="inline-block w-0.5 h-4 bg-cyan-400 animate-pulse ml-0.5 -mb-0.5" />
                                    )}
                                </div>
                            </div>
                        ) : null}

                        {/* Message Actions */}
                        {isCompleted && displayedContent && (
                            <div className="mt-2">
                                <MessageActions
                                    messageId={message.id}
                                    content={message.content}
                                    onRegenerate={onRegenerate}
                                    isMobile={isMobile}
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}