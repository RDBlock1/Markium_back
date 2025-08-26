"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, MessageCircle, MoreHorizontal } from "lucide-react"
import type { Comment } from "@/types/market"
import { cn } from "@/lib/utils"

// Mock comments data
const generateMockComments = (): Comment[] => {
  const users = [
    { name: "CryptoTrader", avatar: "/diverse-group-avatars.png" },
    { name: "MarketMaker", avatar: "/diverse-group-avatars.png" },
    { name: "PredictionPro", avatar: "/diverse-group-avatars.png" },
    { name: "TokenHolder", avatar: "/diverse-group-avatars.png" },
    { name: "DeFiExpert", avatar: "/diverse-group-avatars.png" },
  ]

  const comments: Comment[] = [
    {
      id: "1",
      user: "CryptoTrader",
      avatar: users[0].avatar,
      content: "This market is looking bullish! The recent polls show strong momentum for YES.",
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      likes: 12,
      replies: [
        {
          id: "1-1",
          user: "MarketMaker",
          avatar: users[1].avatar,
          content: "I agree, but we should also consider the volatility factor.",
          timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
          likes: 5,
        },
      ],
    },
    {
      id: "2",
      user: "PredictionPro",
      avatar: users[2].avatar,
      content: "The liquidity on this market is impressive. Great for large trades without much slippage.",
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      likes: 8,
    },
    {
      id: "3",
      user: "TokenHolder",
      avatar: users[3].avatar,
      content: "Just bought 1000 YES tokens. This is going to be huge! 🚀",
      timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      likes: 15,
      replies: [
        {
          id: "3-1",
          user: "DeFiExpert",
          avatar: users[4].avatar,
          content: "Nice entry! What's your target exit price?",
          timestamp: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
          likes: 3,
        },
        {
          id: "3-2",
          user: "TokenHolder",
          avatar: users[3].avatar,
          content: "Looking for 0.8+ before the election date.",
          timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
          likes: 2,
        },
      ],
    },
  ]

  return comments
}

export function CommentsSection() {
  const [comments, setComments] = useState<Comment[]>(generateMockComments())
  const [newComment, setNewComment] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState("")
  const [sortBy, setSortBy] = useState<"newest" | "popular">("newest")
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set())

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const commentTime = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - commentTime.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  const handleLike = (commentId: string) => {
    setLikedComments((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(commentId)) {
        newSet.delete(commentId)
      } else {
        newSet.add(commentId)
      }
      return newSet
    })

    setComments((prev) =>
      prev.map((comment) => {
        if (comment.id === commentId) {
          return {
            ...comment,
            likes: likedComments.has(commentId) ? comment.likes - 1 : comment.likes + 1,
          }
        }
        if (comment.replies) {
          return {
            ...comment,
            replies: comment.replies.map((reply) =>
              reply.id === commentId
                ? {
                    ...reply,
                    likes: likedComments.has(commentId) ? reply.likes - 1 : reply.likes + 1,
                  }
                : reply,
            ),
          }
        }
        return comment
      }),
    )
  }

  const handleSubmitComment = () => {
    if (!newComment.trim()) return

    const comment: Comment = {
      id: Date.now().toString(),
      user: "You",
      avatar: "/abstract-geometric-shapes.png",
      content: newComment,
      timestamp: new Date().toISOString(),
      likes: 0,
    }

    setComments((prev) => [comment, ...prev])
    setNewComment("")
  }

  const handleSubmitReply = (parentId: string) => {
    if (!replyText.trim()) return

    const reply: Comment = {
      id: `${parentId}-${Date.now()}`,
      user: "You",
      avatar: "/abstract-geometric-shapes.png",
      content: replyText,
      timestamp: new Date().toISOString(),
      likes: 0,
    }

    setComments((prev) =>
      prev.map((comment) =>
        comment.id === parentId
          ? {
              ...comment,
              replies: [...(comment.replies || []), reply],
            }
          : comment,
      ),
    )

    setReplyText("")
    setReplyingTo(null)
  }

  const sortedComments = [...comments].sort((a, b) => {
    if (sortBy === "popular") {
      return b.likes - a.likes
    }
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  })

  const CommentComponent = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("space-y-3", isReply && "ml-12 border-l-2 border-[#1E2329] pl-4")}
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={comment.avatar || "/placeholder.svg"} />
          <AvatarFallback className="bg-[#6366F1] text-white text-xs">
            {comment.user.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-medium text-white text-sm">{comment.user}</span>
            <span className="text-xs text-[#94A3B8]">{formatTimeAgo(comment.timestamp)}</span>
          </div>

          <p className="text-sm text-[#94A3B8] leading-relaxed">{comment.content}</p>

          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleLike(comment.id)}
              className={cn(
                "h-8 px-2 text-xs",
                likedComments.has(comment.id) ? "text-[#FF3B69]" : "text-[#94A3B8] hover:text-[#FF3B69]",
              )}
            >
              <Heart className={cn("w-3 h-3 mr-1", likedComments.has(comment.id) && "fill-current")} />
              {comment.likes}
            </Button>

            {!isReply && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                className="h-8 px-2 text-xs text-[#94A3B8] hover:text-white"
              >
                <MessageCircle className="w-3 h-3 mr-1" />
                Reply
              </Button>
            )}

            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-[#94A3B8] hover:text-white">
              <MoreHorizontal className="w-3 h-3" />
            </Button>
          </div>

          {/* Reply Input */}
          {replyingTo === comment.id && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              <Textarea
                placeholder="Write a reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="min-h-[80px] bg-[#1E2329] border-[#2A2F36] text-white placeholder:text-[#94A3B8] resize-none"
              />
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => handleSubmitReply(comment.id)}
                  disabled={!replyText.trim()}
                  className="bg-[#6366F1] text-white hover:bg-[#6366F1]/90"
                >
                  Reply
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setReplyingTo(null)
                    setReplyText("")
                  }}
                  className="text-[#94A3B8] hover:text-white"
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-3">
          {comment.replies.map((reply) => (
            <CommentComponent key={reply.id} comment={reply} isReply />
          ))}
        </div>
      )}
    </motion.div>
  )

  return (
    <Card className="bg-black p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Comments</h3>
        <div className="flex items-center gap-2">
          <Button
            variant={sortBy === "newest" ? "default" : "ghost"}
            size="sm"
            onClick={() => setSortBy("newest")}
            className={cn("h-8 px-3 text-xs", sortBy === "newest" ? "bg-[#6366F1] text-white" : "text-[#94A3B8]")}
          >
            Newest
          </Button>
          <Button
            variant={sortBy === "popular" ? "default" : "ghost"}
            size="sm"
            onClick={() => setSortBy("popular")}
            className={cn("h-8 px-3 text-xs", sortBy === "popular" ? "bg-[#6366F1] text-white" : "text-[#94A3B8]")}
          >
            Popular
          </Button>
        </div>
      </div>

      {/* New Comment Input */}
      <div className="space-y-4 mb-6">
        <div className="flex items-start gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src="/abstract-geometric-shapes.png" />
            <AvatarFallback className="bg-[#6366F1] text-white text-xs">YU</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-3">
            <Textarea
              placeholder="Share your thoughts on this market..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[100px] bg-[#1E2329] border-[#2A2F36] text-white placeholder:text-[#94A3B8] resize-none"
            />
            <div className="flex items-center justify-between">
              <div className="text-xs text-[#94A3B8]">Markdown supported</div>
              <Button
                onClick={handleSubmitComment}
                disabled={!newComment.trim()}
                className="bg-[#6366F1] text-white hover:bg-[#6366F1]/90"
              >
                Post Comment
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-6">
        <AnimatePresence>
          {sortedComments.map((comment) => (
            <CommentComponent key={comment.id} comment={comment} />
          ))}
        </AnimatePresence>
      </div>

      {/* Load More */}
      <div className="flex justify-center mt-6">
        <Button variant="outline" className="border-[#1E2329] text-[#94A3B8] hover:text-white bg-transparent">
          Load More Comments
        </Button>
      </div>
    </Card>
  )
}
