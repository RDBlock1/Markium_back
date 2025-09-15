"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, MessageCircle, MoreHorizontal, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface Profile {
  name?: string
  pseudonym?: string
  displayUsernamePublic?: boolean
  bio?: string
  proxyWallet?: string
  baseAddress?: string
  profileImage?: string
  positions?: Array<{
    tokenId: string
    positionSize: string
  }>
}

interface Reaction {
  id: string
  commentID: number
  reactionType: string
  userAddress: string
  profile?: {
    proxyWallet?: string
  }
}

interface Comment {
  id: string
  body: string
  parentEntityType: string
  parentEntityID: number
  userAddress: string
  createdAt: string
  updatedAt: string
  profile?: Profile
  reactions?: Reaction[]
  reportCount: number
  reactionCount: number
  replies?: Comment[]
}

interface CommentsApiResponse {
  comments: Comment[]
  hasMore: boolean
  totalCount: number
}

interface CommentsSectionProps {
  parentEntityId: number
  type: 'Event' | 'Series' // Extendable for other types
}

export function CommentsSection({ parentEntityId ,type}: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)
  const [newComment, setNewComment] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState("")
  const [sortBy, setSortBy] = useState<"newest" | "popular">("newest")
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  const LIMIT = 20

  const fetchComments = useCallback(async (isLoadMore = false) => {
    if (isLoadMore) {
      setLoadingMore(true)
    } else {
      setLoading(true)
    }
    setError(null)

    try {
      const currentOffset = isLoadMore ? offset : 0
      console.log('parentEntityID:', parentEntityId, 'offset:', currentOffset, 'sortBy:', sortBy);
      const response = await fetch('/api/market/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parentEntityId,
          parent_entity_type: type,
          limit: LIMIT,
          offset: currentOffset,
          orderBy: sortBy === 'newest' ? 'createdAt' : 'reactionCount',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch comments')
      }

      const data: CommentsApiResponse = await response.json()
      
      if (isLoadMore) {
        setComments(prev => [...prev, ...data.comments])
        setOffset(currentOffset + LIMIT)
      } else {
        setComments(data.comments)
        setOffset(LIMIT)
      }
      
      setHasMore(data.hasMore)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error fetching comments:', err)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [parentEntityId, offset, sortBy])

  useEffect(() => {
    fetchComments()
  }, [parentEntityId, sortBy])

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const commentTime = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - commentTime.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  const formatPositionSize = (size: string) => {
    const num = parseInt(size)
    if (num > 1000000000) return `${(num / 1000000000).toFixed(2)}B`
    if (num > 1000000) return `${(num / 1000000).toFixed(2)}M`
    if (num > 1000) return `${(num / 1000).toFixed(2)}K`
    return size
  }

  const handleLike = async (commentId: string) => {
    // Toggle local state immediately for better UX
    setLikedComments((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(commentId)) {
        newSet.delete(commentId)
      } else {
        newSet.add(commentId)
      }
      return newSet
    })

    // Update local comment state
    setComments((prev) =>
      prev.map((comment) => {
        if (comment.id === commentId) {
          return {
            ...comment,
            reactionCount: likedComments.has(commentId) 
              ? comment.reactionCount - 1 
              : comment.reactionCount + 1,
          }
        }
        return comment
      })
    )

    // Here you would typically make an API call to persist the like
    // await fetch('/api/polymarket/react', { ... })
  }

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return

    // Here you would typically make an API call to post the comment
    // For now, we'll just show a message
    console.log('Posting comment:', newComment)
    setNewComment("")
    
    // Refresh comments after posting
    await fetchComments()
  }

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchComments(true)
    }
  }

  const CommentComponent = ({ comment }: { comment: Comment }) => {
    const hasReacted = comment.reactions?.some(r => r.reactionType === "HEART") || likedComments.has(comment.id)
    const displayName = comment.profile?.displayUsernamePublic && comment.profile?.name 
      ? comment.profile.name 
      : comment.profile?.pseudonym || 'Anonymous'
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3"
      >
        <div className="flex items-start gap-3">
          <Avatar className="h-8 w-8">
            {comment.profile?.profileImage && (
              <AvatarImage src={comment.profile.profileImage} />
            )}
            <AvatarFallback className="bg-[#6366F1] text-white text-xs">
              {displayName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Link href={`/user-profile/${comment.profile?.proxyWallet || comment.userAddress}`} className="hover:underline">
                            <span className="font-medium text-white text-sm">{displayName}</span>
</Link>
              {comment.profile?.positions && comment.profile.positions.length > 0 && (
                <span className="text-xs text-[#6366F1] bg-[#6366F1]/10 px-2 py-0.5 rounded">
                  💰 {formatPositionSize(comment.profile.positions[0].positionSize)}
                </span>
              )}
              <span className="text-xs text-[#94A3B8]">{formatTimeAgo(comment.createdAt)}</span>
            </div>

            <p className="text-sm text-[#94A3B8] leading-relaxed whitespace-pre-wrap">
              {comment.body}
            </p>

            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleLike(comment.id)}
                className={cn(
                  "h-8 px-2 text-xs",
                  hasReacted ? "text-[#FF3B69]" : "text-[#94A3B8] hover:text-[#FF3B69]",
                )}
              >
                <Heart className={cn("w-3 h-3 mr-1", hasReacted && "fill-current")} />
                {comment.reactionCount}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                className="h-8 px-2 text-xs text-[#94A3B8] hover:text-white"
              >
                <MessageCircle className="w-3 h-3 mr-1" />
                Reply
              </Button>

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
                    onClick={() => {
                      console.log('Reply to comment:', comment.id, replyText)
                      setReplyText("")
                      setReplyingTo(null)
                    }}
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
      </motion.div>
    )
  }

  return (
    <Card className="bg-black p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Market Comments</h3>
        <div className="flex items-center gap-2">
          <Button
            variant={sortBy === "newest" ? "default" : "ghost"}
            size="sm"
            onClick={() => {
              setSortBy("newest")
              setOffset(0)
            }}
            className={cn("h-8 px-3 text-xs", sortBy === "newest" ? "bg-[#6366F1] text-white" : "text-[#94A3B8]")}
          >
            Newest
          </Button>
          <Button
            variant={sortBy === "popular" ? "default" : "ghost"}
            size="sm"
            onClick={() => {
              setSortBy("popular")
              setOffset(0)
            }}
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
              <div className="text-xs text-[#94A3B8]">Connect wallet to comment</div>
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

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && !comments.length ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 text-[#6366F1] animate-spin" />
        </div>
      ) : (
        <>
          {/* Comments List */}
          <div className="space-y-6">
            <AnimatePresence>
              {comments.map((comment) => (
                <CommentComponent key={comment.id} comment={comment} />
              ))}
            </AnimatePresence>
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="flex justify-center mt-6">
              <Button 
                variant="outline" 
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="border-[#1E2329] text-[#94A3B8] hover:text-white bg-transparent"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load More Comments'
                )}
              </Button>
            </div>
          )}

          {!hasMore && comments.length > 0 && (
            <div className="text-center mt-6 text-[#94A3B8] text-sm">
              No more comments to load
            </div>
          )}
        </>
      )}
    </Card>
  )
}