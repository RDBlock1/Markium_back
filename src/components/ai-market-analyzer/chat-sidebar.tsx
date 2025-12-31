/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import type React from "react"

import { useState, useMemo, useEffect } from "react"
import { Search, MessageSquare, MoreHorizontal, Edit2, Star, Trash2, Upload, Clock, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { ChatHistory } from "@/types/chat"
import { NavUser } from "./nav-user"
import { useSession } from "@/lib/auth-client"


interface ChatSidebarProps {
    isOpen: boolean
    onClose: () => void
    currentChatId: string | null
    onChatSelect: (chatId: string) => void
    onNewChat: () => void
}

export function ChatSidebar({
    isOpen,
    onClose,
    currentChatId,
    onChatSelect,
    onNewChat,
}: ChatSidebarProps) {
    const { data: session } = useSession()
    const [searchQuery, setSearchQuery] = useState("")
    const [hoveredChatId, setHoveredChatId] = useState<string | null>(null)
    const [editingChatId, setEditingChatId] = useState<string | null>(null)
    const [editingTitle, setEditingTitle] = useState("")
    const [chatHistories, setChatHistories] = useState<ChatHistory[]>([])
    const [isLoading, setIsLoading] = useState(false)

    // Fetch conversations when sidebar opens
    useEffect(() => {
        if (isOpen && session?.user) {
            fetchConversations()
        }
    }, [isOpen, session])

    const fetchConversations = async () => {
        try {
            setIsLoading(true)
            const response = await fetch('/api/ai-conversations')

            if (!response.ok) throw new Error('Failed to fetch conversations')

            const data = await response.json()

            // Transform the data to match ChatHistory format
            const transformedChats: ChatHistory[] = data.conversations.map((conv: any) => ({
                id: conv.id,
                title: conv.title || 'Untitled Chat',
                messages: conv.messages.map((msg: any) => ({
                    id: msg.id,
                    type: msg.type,
                    content: msg.content,
                    images: msg.images || [],
                    completed: msg.completed,
                })),
                createdAt: new Date(conv.createdAt),
                updatedAt: new Date(conv.updatedAt),
                isFavorite: false, // Add this to your schema if you want favorites
            }))

            // Sort by updatedAt descending
            transformedChats.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())

            setChatHistories(transformedChats)
        } catch (error) {
            console.error('Error fetching conversations:', error)
            toast.error('Failed to load chat history')
        } finally {
            setIsLoading(false)
        }
    }

    const filteredChats = useMemo(() => {
        if (!searchQuery.trim()) return chatHistories

        return chatHistories.filter(
            (chat) =>
                chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                chat.messages.some((msg) => msg.content.toLowerCase().includes(searchQuery.toLowerCase())),
        )
    }, [chatHistories, searchQuery])

    const handleChatSelect = (chatId: string) => {
        if (editingChatId === chatId) return
        onChatSelect(chatId)
        onClose()
    }

    const handleNewChat = () => {
        onNewChat()
        onClose()
    }

    const handleShareChat = async (chat: ChatHistory, e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        try {
            const chatContent = chat.messages
                .map((msg) => `${msg.type === "user" ? "You" : "AI"}: ${msg.content}`)
                .join("\n\n")

            if (navigator.share) {
                await navigator.share({
                    title: chat.title,
                    text: chatContent,
                })
                toast.success("Chat shared successfully")
            } else {
                await navigator.clipboard.writeText(chatContent)
                toast.success("Chat copied to clipboard")
            }
        } catch (error) {
            toast.error("Failed to share chat")
        }
    }

    const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        try {
            const response = await fetch(`/api/ai-conversations/${chatId}`, {
                method: 'DELETE',
            })

            if (!response.ok) throw new Error('Failed to delete chat')

            setChatHistories(prev => prev.filter(chat => chat.id !== chatId))
            toast.success("Chat deleted")
        } catch (error) {
            toast.error("Failed to delete chat")
        }
    }

    const handleFavoriteChat = async (chatId: string, e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        try {
            const chat = chatHistories.find(c => c.id === chatId)
            const newFavoriteStatus = !chat?.isFavorite

            const response = await fetch(`/api/ai-conversations/${chatId}/favorite`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isFavorite: newFavoriteStatus })
            })

            if (!response.ok) throw new Error('Failed to update favorite')

            setChatHistories(prev =>
                prev.map(c => c.id === chatId ? { ...c, isFavorite: newFavoriteStatus } : c)
            )

            toast.success(newFavoriteStatus ? "Added to favorites" : "Removed from favorites")
        } catch (error) {
            toast.error("Failed to update favorite")
        }
    }

    const handleStartRename = (chat: ChatHistory, e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setEditingChatId(chat.id)
        setEditingTitle(chat.title)
    }

    const handleSaveRename = async (chatId: string) => {
        const chat = chatHistories.find(c => c.id === chatId)

        if (editingTitle.trim() && editingTitle.trim() !== chat?.title) {
            try {
                const response = await fetch(`/api/ai-conversations/${chatId}/rename`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title: editingTitle.trim() })
                })

                if (!response.ok) throw new Error('Failed to rename chat')

                setChatHistories(prev =>
                    prev.map(c => c.id === chatId ? { ...c, title: editingTitle.trim() } : c)
                )

                toast.success("Chat renamed")
            } catch (error) {
                toast.error("Failed to rename chat")
            }
        }

        setEditingChatId(null)
        setEditingTitle("")
    }

    const handleCancelRename = () => {
        setEditingChatId(null)
        setEditingTitle("")
    }

    const handleRenameKeyDown = (e: React.KeyboardEvent, chatId: string) => {
        if (e.key === "Enter") {
            e.preventDefault()
            handleSaveRename(chatId)
        } else if (e.key === "Escape") {
            e.preventDefault()
            handleCancelRename()
        }
    }

    const formatDate = (date: Date) => {
        const now = new Date()
        const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

        if (diffInHours < 24) {
            return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        } else if (diffInHours < 24 * 7) {
            return date.toLocaleDateString([], { weekday: "short" })
        } else {
            return date.toLocaleDateString([], { month: "short", day: "numeric" })
        }
    }

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent side="left" className="w-full sm:w-80 p-0 flex flex-col h-full">
                <SheetHeader className="p-4 pb-2 border-b">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-md flex items-center justify-center">
                                <Clock className="h-4 w-4 text-white" />
                            </div>
                            <SheetTitle className="text-lg font-semibold">History</SheetTitle>
                        </div>
                        
                    </div>
                </SheetHeader>

                <div className="p-4 pb-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search chats..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-9 text-sm"
                        />
                    </div>
                </div>

                <ScrollArea className="flex-1 px-2">
                    <div className="space-y-1 pb-4">
                        {isLoading ? (
                            <div className="text-center py-8 text-gray-500">
                                <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin" />
                                <p className="text-sm">Loading chats...</p>
                            </div>
                        ) : filteredChats.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">{searchQuery ? "No chats found" : "No chat history yet"}</p>
                                <p className="text-xs mt-1">
                                    {searchQuery ? "Try a different search term" : "Start a conversation to see it here"}
                                </p>
                            </div>
                        ) : (
                            filteredChats.map((chat) => (
                                <div
                                    key={chat.id}
                                    className={cn(
                                        "group relative rounded-lg p-3 border cursor-pointer transition-all duration-200 mx-2",
                                        "hover:bg-neutral-900 active:bg-gray-100",
                                        currentChatId === chat.id && "bg-neutral-900 border border-zinc-800",
                                        editingChatId === chat.id && "bg-gray-50",
                                    )}
                                    onClick={() => handleChatSelect(chat.id)}
                                    onMouseEnter={() => setHoveredChatId(chat.id)}
                                    onMouseLeave={() => setHoveredChatId(null)}
                                >
                                    <div className="flex items-start justify-between gap-2 ">
                                        <div className="flex-1 min-w-0">
                                            {editingChatId === chat.id ? (
                                                <div className="space-y-2">
                                                    <Input
                                                        value={editingTitle}
                                                        onChange={(e) => setEditingTitle(e.target.value)}
                                                        onKeyDown={(e) => handleRenameKeyDown(e, chat.id)}
                                                        onBlur={() => handleSaveRename(chat.id)}
                                                        className="h-7 text-sm font-medium"
                                                        autoFocus
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                </div>
                                            ) : (
                                                <>
                                                    <h3 className="font-medium text-sm text-gray-100 truncate leading-tight">
                                                        {chat.title.trim().split(/\s+/).slice(0, 4).join(" ")}
                                                        {chat.title.trim().split(/\s+/).length > 4 ? "..." : ""}
                                                    </h3>
                                                    <div className="flex items-center justify-between mt-2">
                                                        <span className="text-xs text-gray-400">{formatDate(chat.updatedAt)}</span>
                                                        <span className="text-xs text-gray-400">{chat.messages.length} messages</span>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        {!editingChatId && (hoveredChatId === chat.id || currentChatId === chat.id) && (
                                            <div className="flex items-center">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 w-6 p-0 hover:bg-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            onClick={(e) => {
                                                                e.preventDefault()
                                                                e.stopPropagation()
                                                            }}
                                                        >
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent
                                                        align="end"
                                                        className="w-48"
                                                        side="bottom"
                                                        sideOffset={4}
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <DropdownMenuItem
                                                            onClick={(e) => {
                                                                e.preventDefault()
                                                                e.stopPropagation()
                                                                handleShareChat(chat, e)
                                                            }}
                                                            className="gap-2 cursor-pointer"
                                                        >
                                                            <Upload className="h-4 w-4" />
                                                            Share
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={(e) => {
                                                                e.preventDefault()
                                                                e.stopPropagation()
                                                                handleStartRename(chat, e)
                                                            }}
                                                            className="gap-2 cursor-pointer"
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                            Rename
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={(e) => {
                                                                e.preventDefault()
                                                                e.stopPropagation()
                                                                handleFavoriteChat(chat.id, e)
                                                            }}
                                                            className="gap-2 cursor-pointer"
                                                        >
                                                            <Star className={cn("h-4 w-4", chat.isFavorite && "fill-yellow-400 text-yellow-400")} />
                                                            {chat.isFavorite ? "Unfavorite" : "Favorite"}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={(e) => {
                                                                e.preventDefault()
                                                                e.stopPropagation()
                                                                handleDeleteChat(chat.id, e)
                                                            }}
                                                            className="gap-2 text-red-600 focus:text-red-600 cursor-pointer"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>

                {/* Fixed bottom section for NavUser */}
                <div className="mt-auto border-t p-4">
                    <NavUser
                        user={{
                            name: session?.user?.name || "User",
                            email: session?.user?.email || "",
                            avatar: session?.user?.image ||
                                "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face&auto=format",
                        }}
                    />
                </div>
            </SheetContent>
        </Sheet>
    )
}