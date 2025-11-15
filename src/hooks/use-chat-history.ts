/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useCallback, useEffect } from "react"
import type { ChatHistory, Message } from "@/types/chat"
import { toast } from "sonner"
import { useSession } from "@/lib/auth-client"

export function useChatHistory() {
  const session = useSession  ()
  const [chatHistories, setChatHistories] = useState<ChatHistory[]>([])
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Fetch conversations on mount
  useEffect(() => {
    if (session?.data?.user) {
      fetchConversations()
    }
  }, [session])

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
        isFavorite: conv.isFavorite || false,
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

  const saveMessage = async (message: Message, markets?: any[]) => {
    console.log('Saving message:', message);
    console.log('session:', session?.data?.user);
    if (!session?.data  ?.user?.email) {
      toast.error('Please sign in to save messages')
      return null
    }

    try {
      // Use the current conversationId from state
      const currentConversationId = conversationId
      console.log('Saving message with conversationId:', currentConversationId)
      
      const response = await fetch('/api/analyze-market/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: currentConversationId,
          message,
          markets
        })
      })

      if (!response.ok) throw new Error('Failed to save message')

      const data = await response.json()
      
      console.log('Message saved, conversationId:', data.conversationId)
      
      // Store conversation ID for subsequent messages
      if (!currentConversationId && data.conversationId) {
        console.log('Setting new conversationId:', data.conversationId)
        setConversationId(data.conversationId)
        setCurrentChatId(data.conversationId)
      }
      
      return data // Return the whole response including conversationId
    } catch (error) {
      console.error('Error saving message:', error)
      toast.error('Failed to save message')
      return null
    }
  }

  // Helper function to save message with explicit conversationId
  const saveMessageWithId = async (message: Message, forceConversationId: string | null, markets?: any[]) => {
    console.log('forceConversationId:', forceConversationId);
    if (!session?.data?.user) {
      toast.error('Please sign in to save messages')
      return null
    }

    try {
      console.log('Saving message to specific conversation:', forceConversationId)
      
      const response = await fetch('/api/analyze-market/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: forceConversationId,
          message,
          markets
        })
      })

      if (!response.ok) throw new Error('Failed to save message')

      const data = await response.json()
      console.log('Message saved successfully to conversation:', data.conversationId)
      
      return data
    } catch (error) {
      console.error('Error saving message:', error)
      toast.error('Failed to save message')
      return null
    }
  }

  const saveCurrentChat = useCallback(
    async (messages: Message[]) => {
      if (messages.length === 0) return null

      // If we already have a conversation ID, just return it
      if (conversationId) {
        return conversationId
      }

      // Otherwise, create a new conversation with the first message
      if (messages.length > 0 && session?.data?.user) {
        const result = await saveMessage(messages[0])
        return result?.conversationId || null
      }

      return null
    },
    [conversationId, session],
  )

  const startNewChat = useCallback(() => {
    setCurrentChatId(null)
    setConversationId(null)
  }, [])

  const loadChat = useCallback(
    async (chatId: string) => {
      try {
        setCurrentChatId(chatId)
        setConversationId(chatId)
        
        // Fetch the full conversation
        console.log('Loading chat with ID:', chatId);
        const response = await fetch(`/api/ai-conversations/${chatId}`)
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error('Failed to load conversation:', errorText)
          throw new Error('Failed to load conversation')
        }
        
        const conversation = await response.json()
        
        if (!conversation) {
          throw new Error('Conversation not found')
        }
        
        console.log('Loaded conversation:', conversation);
        
        // Transform messages - ensure we get ALL messages
        const messages: Message[] = (conversation.messages || []).map((msg: any) => ({
          id: msg.id,
          type: msg.type,
          content: msg.content,
          images: msg.images || [],
          completed: msg.completed !== undefined ? msg.completed : true,
        }))
        
        console.log('Transformed messages:', messages);
        
        return messages
      } catch (error) {
        console.error('Error loading chat:', error)
        toast.error('Failed to load conversation')
        return []
      }
    },
    [],
  )

  const deleteChat = useCallback(
    async (chatId: string) => {
      try {
        const response = await fetch(`/api/ai-conversations/${chatId}`, {
          method: 'DELETE',
        })
        
        if (!response.ok) throw new Error('Failed to delete chat')
        
        setChatHistories((prev) => prev.filter((chat) => chat.id !== chatId))
        
        if (currentChatId === chatId) {
          setCurrentChatId(null)
          setConversationId(null)
        }
        
        toast.success('Chat deleted')
      } catch (error) {
        console.error('Error deleting chat:', error)
        toast.error('Failed to delete chat')
      }
    },
    [currentChatId],
  )

  const renameChat = useCallback(async (chatId: string, newTitle: string) => {
    try {
      const response = await fetch(`/api/ai-conversations/${chatId}/rename`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle })
      })
      
      if (!response.ok) throw new Error('Failed to rename chat')
      
      setChatHistories((prev) =>
        prev.map((chat) => 
          chat.id === chatId 
            ? { ...chat, title: newTitle, updatedAt: new Date() } 
            : chat
        ),
      )
      
      toast.success('Chat renamed')
    } catch (error) {
      console.error('Error renaming chat:', error)
      toast.error('Failed to rename chat')
    }
  }, [])

  const favoriteChat = useCallback(async (chatId: string) => {
    try {
      const chat = chatHistories.find(c => c.id === chatId)
      const newFavoriteStatus = !chat?.isFavorite

      const response = await fetch(`/api/ai-conversations/${chatId}/favorite`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite: newFavoriteStatus })
      })
      
      if (!response.ok) throw new Error('Failed to update favorite')
      
      setChatHistories((prev) =>
        prev.map((chat) =>
          chat.id === chatId 
            ? { ...chat, isFavorite: newFavoriteStatus, updatedAt: new Date() } 
            : chat,
        ),
      )
      
      toast.success(newFavoriteStatus ? 'Added to favorites' : 'Removed from favorites')
    } catch (error) {
      console.error('Error updating favorite:', error)
      toast.error('Failed to update favorite')
    }
  }, [chatHistories])

  const updateChatTitle = useCallback(async (chatId: string, newTitle: string) => {
    try {
      const response = await fetch(`/api/ai-conversations/${chatId}/rename`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle })
      })
      
      if (!response.ok) throw new Error('Failed to update title')
      
      setChatHistories((prev) =>
        prev.map((chat) => 
          chat.id === chatId 
            ? { ...chat, title: newTitle, updatedAt: new Date() } 
            : chat
        ),
      )
    } catch (error) {
      console.error('Error updating title:', error)
      toast.error('Failed to update title')
    }
  }, [])

  const refreshConversations = useCallback(() => {
    if (session?.data?.user) {
      fetchConversations()
    }
  }, [session])

  return {
    chatHistories,
    currentChatId,
    conversationId,
    isLoading,
    saveCurrentChat,
    saveMessage,
    saveMessageWithId, // Export this
    startNewChat,
    loadChat,
    deleteChat,
    renameChat,
    favoriteChat,
    updateChatTitle,
    setCurrentChatId,
    refreshConversations,
  }
}