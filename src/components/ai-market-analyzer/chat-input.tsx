"use client"

import type React from "react"
import { useRef, useEffect, useState } from "react"
import { Globe, Plus, Lightbulb, ArrowUp, Square, TrendingUp, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ImageUpload, type ImageFile } from "./image-upload"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { redirect, useRouter } from "next/navigation"
import { signIn, useSession } from "@/lib/auth-client"

type ActiveButton = "none" | "add" | "deepSearch" | "think"

interface ChatInputProps {
    value: string
    onChange: (value: string) => void
    onSubmit: (images?: ImageFile[]) => void
    onStop?: () => void
    isStreaming?: boolean
    isMobile?: boolean
    activeButton: ActiveButton
    onButtonToggle: (button: ActiveButton) => void
    // New props for trending markets
    showTrendingMarkets?: boolean
    trendingMarkets?: string[]
    onSuggestionClick?: (suggestion: string) => void
}

const defaultTrendingMarkets = [
    "Will Trump acquire Greenland before 2027?",
    "Super Bowl Champion 2026",
    "2026 FIFA World Cup Winner?",
    "Russian x Ukraine ceasefire by January 31, 2026?",
    "Democratic Presidential Nominee 2028",
]

export function ChatInput({
    value,
    onChange,
    onSubmit,
    onStop,
    isStreaming = false,
    isMobile = false,
    activeButton,
    onButtonToggle,
    showTrendingMarkets = true,
    trendingMarkets = defaultTrendingMarkets,
    onSuggestionClick,
}: ChatInputProps) {
    const { data: session, isPending: isSessionPending } = useSession()
    const router = useRouter()
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const inputContainerRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [images, setImages] = useState<ImageFile[]>([])
    const [showImageUpload, setShowImageUpload] = useState(false)
    const hasTyped = value.trim() !== "" || images.length > 0

    const isLoading = isSessionPending
    const isAuthenticated = !!session?.user

    // Auto-resize textarea
    useEffect(() => {
        const textarea = textareaRef.current
        if (textarea) {
            textarea.style.height = "auto"
            const newHeight = Math.max(20, Math.min(textarea.scrollHeight, isMobile ? 120 : 160))
            textarea.style.height = `${newHeight}px`
        }
    }, [value, isMobile])

    // Focus textarea on desktop
    useEffect(() => {
        if (textareaRef.current && !isMobile && !isStreaming && isAuthenticated) {
            textareaRef.current.focus()
        }
    }, [isMobile, isStreaming, isAuthenticated])

    const handleAuthRequired = () => {
        const callback = `${window.location.origin}/ai-market-analyzer`;

         signIn.social({
            provider: 'google',
            callbackURL: callback,         // server will redirect user to this URL after OAuth
        });
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (!isAuthenticated) {
            handleAuthRequired()
            return
        }
        if (!isStreaming) {
            onChange(e.target.value)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (!isAuthenticated) {
            e.preventDefault()
            handleAuthRequired()
            return
        }

        if (!isStreaming && e.key === "Enter" && e.metaKey) {
            e.preventDefault()
            handleSubmit()
            return
        }

        if (!isStreaming && !isMobile && e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSubmit()
        }
    }

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault()

        if (!isAuthenticated) {
            handleAuthRequired()
            return
        }

        if (hasTyped && !isStreaming) {
            onSubmit(images.length > 0 ? images : undefined)
            // Clear images after submit
            images.forEach((img) => URL.revokeObjectURL(img.url))
            setImages([])
            setShowImageUpload(false)
        }
    }

    const handleStop = () => {
        if (onStop && isStreaming) {
            onStop()
        }
    }

    const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isAuthenticated) {
            handleAuthRequired()
            return
        }

        if (
            e.target === e.currentTarget ||
            (e.currentTarget === inputContainerRef.current && !(e.target as HTMLElement).closest("button"))
        ) {
            if (textareaRef.current) {
                textareaRef.current.focus()
            }
        }
    }

    const handlePlusClick = () => {
        if (!isAuthenticated) {
            handleAuthRequired()
            return
        }
        // Directly trigger file input instead of showing upload UI
        fileInputRef.current?.click()
    }

    const handleFileSelect = (files: FileList | null) => {
        if (!isAuthenticated) {
            handleAuthRequired()
            return
        }

        if (!files) return

        const newImages: ImageFile[] = []
        const maxImages = 5
        const remainingSlots = maxImages - images.length

        for (let i = 0; i < Math.min(files.length, remainingSlots); i++) {
            const file = files[i]

            // Validate file type
            if (!file.type.startsWith("image/")) {
                continue
            }

            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                continue
            }

            const imageFile: ImageFile = {
                id: `${Date.now()}-${i}`,
                file,
                url: URL.createObjectURL(file),
                name: file.name,
                size: file.size,
            }

            newImages.push(imageFile)
        }

        if (newImages.length > 0) {
            const updatedImages = [...images, ...newImages]
            setImages(updatedImages)
            setShowImageUpload(true) // Show preview after files are selected
        }

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    const handleButtonToggle = (button: ActiveButton) => {
        if (!isAuthenticated) {
            handleAuthRequired()
            return
        }
        onButtonToggle(button)
    }

    const handleTrendingClick = (market: string) => {
        if (!isAuthenticated) {
            handleAuthRequired()
            return
        }
        onChange(market)
        onSuggestionClick?.(market)
        textareaRef.current?.focus()
    }

    const shouldShowTrending = showTrendingMarkets &&
        trendingMarkets.length > 0 &&
        !value.trim() &&
        !isStreaming

    // Get placeholder text based on auth status
    const getPlaceholder = () => {
        if (isLoading) return "Loading..."
        if (!isAuthenticated) return "Sign in to chat with AI Market Analyzer..."
        if (isStreaming) return "AI Analyzing market..."
        return "Message to AI Market Analyzer..."
    }

    return (
        <div className="fixed bottom-10 left-0 right-0  backdrop-blur-sm border-t border-gray-800">
            <div className={cn("safe-area-bottom", isMobile ? "p-3 pb-4" : "p-4")}>
                {/* Auth Required Banner */}
                {!isAuthenticated && !isLoading && (
                    <div className="max-w-4xl mx-auto mb-3">
                        <div className="bg-zinc-900 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Lock className="w-4 h-4 text-white" />
                                <span className="text-sm text-white font-medium">
                                    Sign in to start analyzing markets
                                </span>
                            </div>
                            <Button
                                size="sm"
                                onClick={handleAuthRequired}
                                className="bg-cyan-500 hover:bg-cyan-600 text-white"
                            >
                                Sign In
                            </Button>
                        </div>
                    </div>
                )}

                {/* Trending Markets - Above Input */}
                <AnimatePresence>
                    {shouldShowTrending && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="mb-3"
                        >
                            <div className="max-w-4xl mx-auto">
                                <div className="flex items-center gap-2 text-gray-300 mb-2">
                                    <TrendingUp className="w-4 h-4" />
                                    <span className="text-sm font-medium">Trending Markets</span>
                                </div>
                                <div className={cn(
                                    "flex gap-2 overflow-x-auto pb-2",
                                    "scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent",
                                    isMobile ? "snap-x snap-mandatory" : ""
                                )}>
                                    {trendingMarkets.map((market, index) => (
                                        <motion.button
                                            key={index}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: index * 0.05 }}
                                            onClick={() => handleTrendingClick(market)}
                                            disabled={!isAuthenticated}
                                            className={cn(
                                                "group flex-shrink-0 snap-start",
                                                "rounded-xl border border-gray-800 bg-neutral-900",
                                                "px-4 py-2 text-sm font-medium",
                                                "transition-all",
                                                isAuthenticated && "hover:border-blue-300 hover:bg-blue-50 hover:shadow-md",
                                                !isAuthenticated && "opacity-50 cursor-not-allowed"
                                            )}
                                        >
                                            <span className={cn(
                                                "text-gray-300 transition-colors whitespace-nowrap",
                                                isAuthenticated && "group-hover:text-blue-600"
                                            )}>
                                                {market}
                                            </span>
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>


                {/* Hidden File Input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleFileSelect(e.target.files)}
                    className="hidden"
                    disabled={!isAuthenticated}
                />

                <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
                    <div
                        ref={inputContainerRef}
                        className={cn(
                            "relative w-full rounded-2xl border shadow-sm cursor-text transition-all duration-200",
                            !isAuthenticated && "border-gray-700  cursor-not-allowed",
                            isAuthenticated && "border-gray-800",
                            isStreaming && "opacity-80",
                            hasTyped && isAuthenticated && "border-blue-300 shadow-md",
                        )}
                        onClick={handleContainerClick}
                    >
                        <div className={cn("px-3 pt-3", isMobile ? "pb-12" : "pb-11")}>
                            <Textarea
                                ref={textareaRef}
                                placeholder={getPlaceholder()}
                                className={cn(
                                    "min-h-[20px] w-full border-0 focus-visible:ring-0 focus-visible:ring-offset-0 resize-none overflow-y-auto leading-relaxed p-0",
                                    isMobile ? "text-base max-h-[120px]" : "text-sm max-h-[160px]",
                                    !isAuthenticated ? "text-gray-500 bg-gray-50 cursor-not-allowed" : "text-gray-200"
                                )}
                                value={value}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                disabled={isStreaming || !isAuthenticated || isLoading}
                            />
                        </div>

                        <div className="absolute bottom-2 left-2 right-2">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 rounded-full transition-colors hover:bg-gray-100"
                                        onClick={handlePlusClick}
                                        disabled={isStreaming || !isAuthenticated || isLoading}
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>

                                    {/* Desktop buttons */}
                                    {!isMobile && (
                                        <>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className={cn(
                                                    "h-8 px-2 rounded-full text-xs transition-all duration-200",
                                                    activeButton === "deepSearch" && "bg-blue-100 text-blue-600",
                                                )}
                                                onClick={() => handleButtonToggle("deepSearch")}
                                                disabled={isStreaming || !isAuthenticated || isLoading}
                                            >
                                                <Globe className={cn("h-3 w-3 mr-1", activeButton === "deepSearch" && "animate-spin")} />
                                                Search
                                            </Button>

                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className={cn(
                                                    "h-8 px-2 rounded-full text-xs transition-all duration-200",
                                                    activeButton === "think" && "bg-blue-100 text-blue-600",
                                                )}
                                                onClick={() => handleButtonToggle("think")}
                                                disabled={isStreaming || !isAuthenticated || isLoading}
                                            >
                                                <Lightbulb className={cn("h-3 w-3 mr-1", activeButton === "think" && "animate-pulse")} />
                                                Think
                                            </Button>
                                        </>
                                    )}

                                    {/* Mobile buttons - icon only initially, show text when active */}
                                    {isMobile && (
                                        <>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className={cn(
                                                    "h-8 rounded-full text-xs transition-all duration-200",
                                                    activeButton === "deepSearch" ? "bg-blue-100 text-blue-600 px-2" : "w-8 p-0",
                                                )}
                                                onClick={() => handleButtonToggle("deepSearch")}
                                                disabled={isStreaming || !isAuthenticated || isLoading}
                                            >
                                                <Globe className={cn("h-3 w-3", activeButton === "deepSearch" && "animate-spin")} />
                                                {activeButton === "deepSearch" && <span className="ml-1">Search</span>}
                                            </Button>

                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className={cn(
                                                    "h-8 rounded-full text-xs transition-all duration-200",
                                                    activeButton === "think" ? "bg-blue-100 text-blue-600 px-2" : "w-8 p-0",
                                                )}
                                                onClick={() => handleButtonToggle("think")}
                                                disabled={isStreaming || !isAuthenticated || isLoading}
                                            >
                                                <Lightbulb className={cn("h-3 w-3", activeButton === "think" && "animate-pulse")} />
                                                {activeButton === "think" && <span className="ml-1">Think</span>}
                                            </Button>
                                        </>
                                    )}
                                </div>

                                {/* Send/Stop Button */}
                                {isStreaming ? (
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={handleStop}
                                        className="h-8 w-8 p-0 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-md"
                                    >
                                        <Square className="h-4 w-4" />
                                    </Button>
                                ) : (
                                    <Button
                                        type="submit"
                                        size="sm"
                                        className={cn(
                                            "h-8 w-8 p-0 rounded-full transition-all duration-200 border-0",
                                            hasTyped && isAuthenticated
                                                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md scale-105"
                                                : "bg-gray-200 text-gray-500 hover:bg-gray-300",
                                        )}
                                        disabled={!hasTyped || !isAuthenticated || isLoading}
                                    >
                                        <ArrowUp className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}