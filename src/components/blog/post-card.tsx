"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import type { Post } from "@/lib/posts"

export function PostCard({ post, index }: { post: Post; index: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{
        duration: 0.35,
        ease: "easeOut",
        delay: Math.min(index * 0.04, 0.2),
      }}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={post.cover || "/placeholder.svg?height=220&width=800&query=post%20cover"}
        alt=""
        className="h-44 w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
      />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-wrap gap-2">
          {post.tags.map((t) => (
            <Badge key={t} className="bg-background/40 text-foreground hover:bg-background/50">
              {t}
            </Badge>
          ))}
        </div>
        <h3 className="text-pretty text-lg font-semibold">
          <Link
            href={`/blog/${post.slug}`}
            className="text-foreground hover:text-primary focus:outline-none focus:ring-2 focus:ring-ring/50"
          >
            {post.title}
          </Link>
        </h3>
        <p className="line-clamp-2 text-foreground/80">{post.excerpt}</p>
        <div className="mt-auto flex items-center gap-2 text-sm text-foreground/60">
          <span>{post.author}</span>
          <span className="text-foreground/30">•</span>
          <time dateTime={post.date}>{new Date(post.date).toLocaleDateString()}</time>
        </div>
      </div>
    </motion.article>
  )
}
