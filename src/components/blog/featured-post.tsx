"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import type { Post } from "@/lib/posts"

export function FeaturedPost({ post }: { post: Post }) {
  return (
    <section className="bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 pb-10 md:pb-12">
        <motion.article
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="grid grid-cols-1 gap-6 rounded-xl border border-border bg-card p-4 md:grid-cols-2 md:p-6"
        >
          <div className="flex flex-col justify-between gap-4">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {post.tags.map((t) => (
                  <Badge key={t} className="bg-background/40 text-foreground hover:bg-background/50">
                    {t}
                  </Badge>
                ))}
              </div>
              <h2 className="text-pretty text-2xl font-semibold md:text-3xl">
                <Link
                  href={`/blog/${post.slug}`}
                  className="text-foreground hover:text-primary focus:outline-none focus:ring-2 focus:ring-ring/50"
                >
                  {post.title}
                </Link>
              </h2>
              <p className="text-foreground/80">{post.excerpt}</p>
            </div>
            <div className="flex items-center gap-3 text-sm text-foreground/60">
              <span aria-label="Author">{post.author}</span>
              <span className="text-foreground/30">•</span>
              <time dateTime={post.date}>{new Date(post.date).toLocaleDateString()}</time>
            </div>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.45, ease: "easeOut", delay: 0.05 }}
            className="overflow-hidden rounded-lg border border-border"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.cover || "/placeholder.svg?height=400&width=800&query=blog%20cover"}
              alt={`Cover image for ${post.title}`}
              className="h-full w-full object-cover"
            />
          </motion.div>
        </motion.article>
      </div>
    </section>
  )
}
