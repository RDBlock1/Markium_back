"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Send, Users, Minimize2, Smile } from "lucide-react"

interface ChatMessage {
  id: string
  user: string
  avatar: string
  message: string
  timestamp: string
  reactions?: { emoji: string; count: number; users: string[] }[]
}

// Mock chat messages
const generateMockMessage = (): ChatMessage => {
  const users = [
    { name: "CryptoTrader", avatar: "/diverse-group-avatars.png" },
    { name: "MarketMaker", avatar: "/diverse-group-avatars.png" },
    { name: "PredictionPro", avatar: "/diverse-group-avatars.png" },
    { name: "TokenHolder", avatar: "/diverse-group-avatars.png" },
    { name: "DeFiExpert", avatar: "/diverse-group-avatars.png" },
  ]

  const messages = [
    "This market is heating up! 🔥",
    "Just bought more YES tokens",
    "Anyone else seeing this volume spike?",
    "The odds are shifting fast",
    "Great liquidity on this market",
    "What's everyone's prediction?",
    "This is going to be close",
    "Volume is through the roof!",
    "Smart money is moving in",
    "Perfect entry point right now",
  ]

  const user = users[Math.floor(Math.random() * users.length)]
  const message = messages[Math.floor(Math.random() * messages.length)]

  return {
    id: Math.random().toString(36).substr(2, 9),
    user: user.name,
    avatar: user.avatar,
    message,
    timestamp: new Date().toISOString(),
    reactions: Math.random() > 0.7 ? [{ emoji: "🚀", count: Math.floor(Math.random() * 5) + 1, users: [] }] : undefined,
  }
}

const initialMessages: ChatMessage[] = Array.from({ length: 10 }, generateMockMessage)

export function LiveChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [newMessage, setNewMessage] = useState("")
  const [isMinimized, setIsMinimized] = useState(false)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [onlineCount] = useState(247)
  const messagesEndRef = useRef<HTMLDivElement>(null)



  // Simulate new messages
  useEffect(() => {
    const interval = setInterval(() => {
      const newMsg = generateMockMessage()
      setMessages((prev) => [...prev.slice(-20), newMsg]) // Keep last 20 messages
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  // Simulate typing indicators
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.8) {
        const users = ["CryptoTrader", "MarketMaker", "PredictionPro"]
        const randomUser = users[Math.floor(Math.random() * users.length)]
        setTypingUsers([randomUser])
        setTimeout(() => setTypingUsers([]), 2000)
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const handleSendMessage = () => {
    if (!newMessage.trim()) return

    const message: ChatMessage = {
      id: Date.now().toString(),
      user: "You",
      avatar: "/abstract-geometric-shapes.png",
      message: newMessage,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, message])
    setNewMessage("")
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const addReaction = (messageId: string, emoji: string) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === messageId) {
          const existingReaction = msg.reactions?.find((r) => r.emoji === emoji)
          if (existingReaction) {
            return {
              ...msg,
              reactions: msg.reactions?.map((r) => (r.emoji === emoji ? { ...r, count: r.count + 1 } : r)),
            }
          } else {
            return {
              ...msg,
              reactions: [...(msg.reactions || []), { emoji, count: 1, users: [] }],
            }
          }
        }
        return msg
      }),
    )
  }

  if (isMinimized) {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="fixed bottom-4 right-4 z-50"
      >
        <Button
          onClick={() => setIsMinimized(false)}
          className="bg-[#6366F1] text-white hover:bg-[#6366F1]/90 rounded-full h-12 w-12 p-0"
        >
          <Users className="w-5 h-5" />
        </Button>
      </motion.div>
    )
  }

  return (
    <Card className="bg-[#12161C] border-[#1E2329] h-[600px] flex flex-col">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#1E2329]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[#00D395] rounded-full animate-pulse" />
            <span className="text-sm font-medium text-white">Live Chat</span>
          </div>
          <Badge variant="outline" className="text-xs text-[#94A3B8] border-[#1E2329]">
            <Users className="w-3 h-3 mr-1" />
            {onlineCount}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsMinimized(true)}
          className="h-8 w-8 p-0 text-[#94A3B8] hover:text-white"
        >
          <Minimize2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="flex items-start gap-2 group"
            >
              <Avatar className="h-6 w-6 flex-shrink-0">
                <AvatarImage src={message.avatar || "/placeholder.svg"} />
                <AvatarFallback className="bg-[#6366F1] text-white text-xs">
                  {message.user.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-white truncate">{message.user}</span>
                  <span className="text-xs text-[#94A3B8] flex-shrink-0">{formatTime(message.timestamp)}</span>
                </div>
                <p className="text-sm text-[#94A3B8] leading-relaxed break-words">{message.message}</p>

                {/* Reactions */}
                {message.reactions && message.reactions.length > 0 && (
                  <div className="flex items-center gap-1 mt-2">
                    {message.reactions.map((reaction, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        size="sm"
                        onClick={() => addReaction(message.id, reaction.emoji)}
                        className="h-6 px-2 text-xs bg-[#1E2329] hover:bg-[#2A2F36] border border-[#2A2F36]"
                      >
                        {reaction.emoji} {reaction.count}
                      </Button>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Reactions */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => addReaction(message.id, "🚀")}
                  className="h-6 w-6 p-0 text-[#94A3B8] hover:text-white"
                >
                  <Smile className="w-3 h-3" />
                </Button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 text-xs text-[#94A3B8]"
          >
            <div className="flex space-x-1">
              <div className="w-1 h-1 bg-[#94A3B8] rounded-full animate-bounce" />
              <div className="w-1 h-1 bg-[#94A3B8] rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
              <div className="w-1 h-1 bg-[#94A3B8] rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
            </div>
            <span>{typingUsers[0]} is typing...</span>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-[#1E2329]">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 bg-[#1E2329] border-[#2A2F36] text-white placeholder:text-[#94A3B8] text-sm"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            size="sm"
            className="bg-[#6366F1] text-white hover:bg-[#6366F1]/90 px-3"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
