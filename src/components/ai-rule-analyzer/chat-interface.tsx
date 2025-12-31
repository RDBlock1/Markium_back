/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useRef, useEffect } from "react"
import { ChatHeader } from "@/components/ai-rule-analyzer/chat-header"
import { ChatInput } from "@/components/ai-rule-analyzer/chat-input"
import * as ChatSidebarModule from "@/components/ai-rule-analyzer/chat-sidebar"
const ChatSidebar: any = (ChatSidebarModule as any)?.ChatSidebar || (ChatSidebarModule as any)?.default || ChatSidebarModule

import { toast } from "sonner"
import type { Message, MessageSection, StreamingWord, ActiveButton } from "@/types/chat"
import type { ImageFile } from "@/components/ai-market-analyzer/image-upload"
import { useRuleChatHistory } from "@/hooks/use-rule-chat-history"
import { MessageList } from "../ai-rule-analyzer/message-list"
import { useSession } from "@/lib/auth-client"

// Market types
export interface MarketSlug {
    id: string
    question: string
    slug?: string
    image?: string
    outcomePrices?: number[]
    volume?: number
    volume24hr?: number
}

export default function ChatInterface() {
    const [inputValue, setInputValue] = useState("")
    const [activeButton, setActiveButton] = useState<ActiveButton>("none")
    const [isMobile, setIsMobile] = useState(false)
    const [messages, setMessages] = useState<Message[]>([])
    const [messageSections, setMessageSections] = useState<MessageSection[]>([])
    const [isStreaming, setIsStreaming] = useState(false)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [streamingWords, setStreamingWords] = useState<StreamingWord[]>([])
    const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null)
    const [viewportHeight, setViewportHeight] = useState(0)
    const [completedMessages, setCompletedMessages] = useState<Set<string>>(new Set())
    const [activeSectionId, setActiveSectionId] = useState<string | null>(null)
    const [sidebarOpen, setSidebarOpen] = useState(false)

    // Market search related state
    const [searchResults, setSearchResults] = useState<MarketSlug[]>([])
    const [showSearchResults, setShowSearchResults] = useState(false)
    const [isSearching, setIsSearching] = useState(false)
    const [showSuggestions, setShowSuggestions] = useState(true)

    const mainContainerRef = useRef<HTMLDivElement>(null)
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const hasInitializedRef = useRef(false)

    // Chat history management
    const {
        chatHistories,
        currentChatId,
        conversationId,
        saveMessage,
        startNewChat,
        loadChat,
        deleteChat,
        renameChat,
        favoriteChat,
        setCurrentChatId,
        saveMessageWithId
    } = useRuleChatHistory()

    const session = useSession()

    const trendingMarkets = [
        "Fed decision in December?",
        "Super Bowl Champion 2026",
        "When will the Government shutdown end?",
        "Gemini 3.0 released by...?",
        "Democratic Presidential Nominee 2028",
    ]

    // Enhanced mobile detection and viewport management
    useEffect(() => {
        const checkMobileAndViewport = () => {
            const isMobileDevice = window.innerWidth < 768
            setIsMobile(isMobileDevice)

            const vh = window.visualViewport?.height || window.innerHeight
            setViewportHeight(vh)

            if (isMobileDevice && mainContainerRef.current) {
                mainContainerRef.current.style.height = `${vh}px`
            }
        }

        checkMobileAndViewport()
        window.addEventListener("resize", checkMobileAndViewport)
        window.visualViewport?.addEventListener("resize", checkMobileAndViewport)

        return () => {
            window.removeEventListener("resize", checkMobileAndViewport)
            window.visualViewport?.removeEventListener("resize", checkMobileAndViewport)
        }
    }, [])

    // Market search function
    const searchMarkets = async (query: string): Promise<MarketSlug[]> => {
        try {
            const response = await fetch(`/api/market?q=${encodeURIComponent(query)}&limit=6`)
            if (!response.ok) throw new Error("Search failed")

            const data = await response.json()
            const events = data.data || []
            const allMarkets: MarketSlug[] = []

            for (const event of events) {
                if (event.markets && event.markets.length > 0) {
                    allMarkets.push(...event.markets)
                }
            }

            return allMarkets
        } catch (error) {
            console.error("Search error:", error)
            return []
        }
    }

    // Handle market query from URL
    const handleMarketQueryFromURL = async (query: string) => {
        try {
            console.log('Handling market query from URL:', query)
            setIsStreaming(true)
            setIsAnalyzing(true)
            setShowSuggestions(false)

            const userMessage: Message = {
                id: `user-${Date.now()}`,
                content: query,
                type: "user",
                newSection: false,
                images: [],
                completed: true,
            }

            setMessages([userMessage])

            const markets = await searchMarkets(query)
            await analyzeMarket(query, markets, userMessage)
        } catch (error) {
            console.error("Error processing URL market query:", error)

            const errorMessage: Message = {
                id: Date.now().toString(),
                type: "system",
                content: "I encountered an error while processing the market query from the URL. Please try searching manually.",
                images: [],
                completed: true,
            }
            setMessages((prev) => [...prev, errorMessage])
            setIsStreaming(false)
            setIsAnalyzing(false)
        }
    }

    // Initialize from URL query parameter
    useEffect(() => {
        if (hasInitializedRef.current || session.isPending === true) return

        hasInitializedRef.current = true

        const tryDecode = (s: string | null) =>
            s ? decodeURIComponent(String(s).replace(/\+/g, " ")) : null

        let marketQuery = new URLSearchParams(window.location.search).get("market")

        const rawHash = window.location.hash || ""
        const hashFragment = rawHash ? rawHash.replace(/^#/, "") : ""

        if (marketQuery && hashFragment) {
            marketQuery = marketQuery.trimEnd() + hashFragment
        }

        if (!marketQuery && hashFragment) {
            marketQuery = hashFragment
        }

        if (!marketQuery) {
            const href = window.location.href
            const match = href.match(/[?&]market=([^&]*)/)
            if (match && match[1]) {
                marketQuery = match[1]
            }
        }

        if (marketQuery) {
            const decodedQuery = tryDecode(marketQuery)
            setShowSuggestions(false)
            console.log("Decoded market query:", decodedQuery)
            handleMarketQueryFromURL(decodedQuery ?? "")
        }
    }, [session.isPending,session.data?.user])

    // Auto-search when user types
    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current)
        }

        if (inputValue.trim().length > 2) {
            setIsSearching(true)
            searchTimeoutRef.current = setTimeout(async () => {
                const markets = await searchMarkets(inputValue.trim())
                console.log('found markets', markets)
                setSearchResults(markets)
                setShowSearchResults(markets.length > 0)
                setIsSearching(false)
            }, 500)
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
    }, [inputValue])

    // Organize messages into sections
    useEffect(() => {
        if (messages.length === 0) {
            setMessageSections([])
            setActiveSectionId(null)
            return
        }

        const sections: MessageSection[] = []
        let currentSection: MessageSection = {
            id: `section-${Date.now()}-0`,
            messages: [],
            isNewSection: false,
            sectionIndex: 0,
        }

        messages.forEach((message) => {
            if (message.newSection) {
                if (currentSection.messages.length > 0) {
                    sections.push({
                        ...currentSection,
                        isActive: false,
                    })
                }

                const newSectionId = `section-${Date.now()}-${sections.length}`
                currentSection = {
                    id: newSectionId,
                    messages: [message],
                    isNewSection: true,
                    isActive: true,
                    sectionIndex: sections.length,
                }

                setActiveSectionId(newSectionId)
            } else {
                currentSection.messages.push(message)
            }
        })

        if (currentSection.messages.length > 0) {
            sections.push(currentSection)
        }

        setMessageSections(sections)
    }, [messages])

    const analyzeMarket = async (question: string, markets: MarketSlug[], userMessage?: Message) => {
        try {
            setIsStreaming(true)
            setIsAnalyzing(true)
            console.log('session', session.data)

            if (session.isPending === true) {
                toast.loading('Loading session...')
                setIsStreaming(false)
                setIsAnalyzing(false)
                return
            }

            if (session.error || !session.data?.user) {
                toast.info('Please sign in to access markets')
                setIsStreaming(false)
                setIsAnalyzing(false)
                return
            }

            // Find the last user message from the messages array
            const lastUserMessage = userMessage ?? messages.filter(m => m.type === 'user').pop();

            console.log('messages', messages);
            console.log('lastUserMessage', lastUserMessage);

            if (!lastUserMessage) {
                console.error('No user message found')
                setIsStreaming(false)
                setIsAnalyzing(false)
                return
            }

            // Save user message and get conversationId
            const userSaveResult = await saveMessage(lastUserMessage, markets)
            const activeConversationId = userSaveResult?.conversationId

            console.log('User message saved to conversation:', activeConversationId)

            // Create loading message while analyzing
            const loadingMessageId = `loading-${Date.now()}`
            const loadingMessage: Message = {
                id: loadingMessageId,
                type: "system",
                content: "",
                images: [],
                completed: false,
                isLoading: true,
            }

            setMessages((prev) => [...prev, loadingMessage])

            // Call AI API for analysis
            const response = await fetch("/api/analyze-market-rule", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    question: question,
                    marketId: "user-query",
                    description: question,
                    outcomes: ["Yes", "No"],
                    status: "active",
                    analysisType: "quick"
                }),
            })

            if (!response.ok) throw new Error("Analysis failed")

            const data = await response.json()

            // Build AI response content
            const aiContent = data.analysis || `I found ${markets.length} market(s) related to your query:\n\n${markets.map(m => `• ${m.question}`).join('\n')}\n\nWould you like me to analyze any of these markets in detail?`

            // Remove loading message
            setMessages((prev) => prev.filter(msg => msg.id !== loadingMessageId))

            // Create AI message with proper ID
            const aiMessageId = `ai-${Date.now()}`
            const aiMessage: Message = {
                id: aiMessageId,
                type: "system",
                content: aiContent,
                images: [],
                completed: false,
            }

            setMessages((prev) => [...prev, aiMessage])
            setStreamingMessageId(aiMessageId)

            // Let the MessageItem component handle the typing animation
            // Just mark it as completed after a delay based on content length
            const words = aiContent.trim() ? aiContent.trim().split(/\s+/).length : 0
            const chars = aiContent.length
            const perWordMs = 45 // time per word in ms
            const perCharMs = 0.5 // small char-based adjustment
            const estimated = Math.round(words * perWordMs + Math.min(chars, 2000) * perCharMs)
            const typingDuration = Math.max(300, Math.min(estimated, 8000)) // min 300ms, max 8s

            setTimeout(() => {
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.id === aiMessageId
                            ? { ...msg, completed: true }
                            : msg
                    )
                )
                setCompletedMessages((prev) => new Set(prev).add(aiMessageId))
                setStreamingMessageId(null)
                setIsAnalyzing(false)

                // Save AI message to the same conversation
                const finalAiMessage: Message = {
                    id: aiMessageId,
                    type: "system",
                    content: aiContent,
                    images: [],
                    completed: true,
                }

                saveMessageWithId(finalAiMessage, activeConversationId, markets)
                    .then(result => console.log('AI message save result:', result))
                    .catch(error => console.error('Failed to save AI message:', error))
            }, typingDuration)

        } catch (error) {
            console.error("Analysis error:", error)

            // Remove any loading messages
            setMessages((prev) => prev.filter(msg => !msg.isLoading))

            const errorMessage: Message = {
                id: `error-${Date.now()}`,
                type: "system",
                content: "I apologize, but I encountered an error analyzing this market. Please try again.",
                images: [],
                completed: true,
            }

            setMessages((prev) => [...prev, errorMessage])
        } finally {
            setIsStreaming(false)
            setTimeout(() => setIsAnalyzing(false), 500) // Small delay to ensure smooth transition
        }
    }

    const handleSubmit = async (images?: ImageFile[]) => {
        if ((inputValue.trim() || images?.length) && !isStreaming) {
            const userMessage = inputValue.trim()
            const shouldAddNewSection = messages.length > 0

            const messageImages = images?.map((img) => ({
                url: img.url,
                alt: img.name,
            }))

            const newUserMessage: Message = {
                id: `user-${Date.now()}`,
                content: userMessage,
                type: "user",
                newSection: shouldAddNewSection,
                images: messageImages,
                completed: true,
            }

            setInputValue("")
            setActiveButton("none")
            setShowSearchResults(false)
            setShowSuggestions(false)

            setMessages((prev) => [...prev, newUserMessage])

            // Check if we have search results or need to search
            if (searchResults.length > 0) {
                await analyzeMarket(userMessage, searchResults)
                setSearchResults([])
            } else {
                const markets = await searchMarkets(userMessage)
                await analyzeMarket(userMessage, markets)
            }
        }
    }

    const handleEditMessage = (messageId: string, newContent: string) => {
        setMessages((prev) => prev.map((msg) => (msg.id === messageId ? { ...msg, content: newContent } : msg)))
        toast.success("Message updated")
    }

    const handleRegenerate = async (messageId: string) => {
        const messageIndex = messages.findIndex((msg) => msg.id === messageId)
        if (messageIndex > 0) {
            const previousUserMessage = messages[messageIndex - 1]
            if (previousUserMessage.type === "user") {
                setMessages((prev) => prev.filter((msg) => msg.id !== messageId))
                setCompletedMessages((prev) => {
                    const newSet = new Set(prev)
                    newSet.delete(messageId)
                    return newSet
                })

                const markets = await searchMarkets(previousUserMessage.content)
                await analyzeMarket(previousUserMessage.content, markets)
            }
        }
    }

    const handleNewChat = () => {
        // Reset all state for new chat
        setMessages([])
        setMessageSections([])
        setInputValue("")
        setActiveButton("none")
        setCompletedMessages(new Set())
        setActiveSectionId(null)
        setStreamingWords([])
        setStreamingMessageId(null)
        setIsStreaming(false)
        setIsAnalyzing(false)
        setSearchResults([])
        setShowSearchResults(false)
        setShowSuggestions(true)

        // Start new chat
        startNewChat()

        toast.success("New chat started")
    }

    const handleChatSelect = async (chatId: string) => {
        try {
            // Load selected chat
            const chatMessages = await loadChat(chatId)

            if (chatMessages && chatMessages.length > 0) {
                console.log('Setting loaded messages:', chatMessages)
                setMessages(chatMessages)
                setCompletedMessages(new Set(chatMessages.filter((m) => m.completed).map((m) => m.id)))
                setShowSuggestions(false)
                toast.success("Chat loaded")
            } else {
                console.warn('No messages loaded for chat:', chatId)
                toast.error("Failed to load chat messages")
            }

            // Reset streaming state
            setStreamingWords([])
            setStreamingMessageId(null)
            setIsStreaming(false)
            setIsAnalyzing(false)
        } catch (error) {
            console.error('Error loading chat:', error)
            toast.error("Failed to load chat")
        }
    }

    const handleChatDelete = (chatId: string) => {
        deleteChat(chatId)
        if (currentChatId === chatId) {
            handleNewChat()
        }
    }

    const handleChatRename = (chatId: string, newTitle: string) => {
        renameChat(chatId, newTitle)
    }

    const handleChatFavorite = (chatId: string) => {
        favoriteChat(chatId)
    }

    const handleMenuClick = () => {
        setSidebarOpen(true)
    }

    const handleButtonToggle = (button: ActiveButton) => {
        if (!isStreaming) {
            setActiveButton((prev) => (prev === button ? "none" : button))
        }
    }

    const handleSuggestionClick = (suggestion: string) => {
        setInputValue(suggestion)
        setShowSuggestions(false)
    }

    const handleMarketClick = async (market: MarketSlug) => {
        setIsStreaming(true)
        setShowSuggestions(false)
        setShowSearchResults(false)
        setSearchResults([])
        setInputValue("")

        const userMessage: Message = {
            id: `user-${Date.now()}`,
            type: "user",
            content: `Analyze: ${market.question}`,
            images: [],
            newSection: messages.length > 0,
            completed: true,
        }

        setMessages((prev) => [...prev, userMessage])

        await analyzeMarket(market.question, [market], userMessage)
    }

    const stopStreaming = () => {
        setStreamingWords([])
        setStreamingMessageId(null)
        setIsStreaming(false)
        setIsAnalyzing(false)
        toast.success("Analysis stopped")
    }

    return (
        <div
            ref={mainContainerRef}
            className="flex flex-col overflow-hidden relative font-poppins"
            style={{
                height: isMobile ? `${viewportHeight}px` : "100svh",
                maxHeight: isMobile ? `${viewportHeight}px` : "100svh",
            }}
        >
            <ChatSidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                chatHistories={chatHistories}
                currentChatId={currentChatId}
                onChatSelect={handleChatSelect}
                onChatDelete={handleChatDelete}
                onChatRename={handleChatRename}
                onChatFavorite={handleChatFavorite}
                onNewChat={handleNewChat}
            />

            <ChatHeader
                onNewChat={handleNewChat}
                onMenuClick={handleMenuClick}
                chatCount={chatHistories.length}
                isMobile={isMobile}
            />

            <MessageList
                messageSections={messageSections}
                streamingWords={streamingWords}
                streamingMessageId={streamingMessageId}
                completedMessages={completedMessages}
                viewportHeight={viewportHeight}
                isMobile={isMobile}
                onRegenerate={handleRegenerate}
                onEdit={handleEditMessage}
                searchResults={searchResults}
                showSearchResults={showSearchResults}
                isSearching={isSearching}
                onMarketClick={handleMarketClick}
                onCloseSearchResults={() => {
                    setShowSearchResults(false)
                    setInputValue("")
                }}
            />

            <ChatInput
                value={inputValue}
                onChange={setInputValue}
                onSubmit={handleSubmit}
                onStop={stopStreaming}
                isStreaming={isStreaming || isAnalyzing}
                isMobile={isMobile}
                activeButton={activeButton}
                onButtonToggle={handleButtonToggle}
                showTrendingMarkets={showSuggestions && messages.filter(m => m.type === 'user').length === 0}
                trendingMarkets={trendingMarkets}
                onSuggestionClick={handleSuggestionClick}
            />
        </div>
    )
}