"use client"
import { BotIcon, Menu, PenSquare, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ChatHeaderProps {
    onNewChat?: () => void
    onMenuClick?: () => void
    chatCount?: number
    isMobile?: boolean

}

export function ChatHeader({ onNewChat, onMenuClick, chatCount = 0, isMobile = false }: ChatHeaderProps) {
    return (
        <header className="fixed top-0 left-0 right-0 h-14 mt-8 flex items-center px-3 z-20   ">
            <div className="w-full flex items-center justify-between">
                <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 relative" onClick={onMenuClick}>
                    <Menu className="h-5 w-5 text-gray-200" />
                    {chatCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-4 w-4 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                            {chatCount > 9 ? "9+" : chatCount}
                        </span>
                    )}
                    <span className="sr-only">Chat History</span>
                </Button>



                <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full h-9 w-9 text-gray-200 hover:bg-blue-50"
                    onClick={onNewChat}
                >
                    <PenSquare className="h-4 w-4" />
                    <span className="sr-only">New Chat</span>
                </Button>
            </div>
        </header>
    )
}
