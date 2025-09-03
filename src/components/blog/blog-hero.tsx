"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"

export function BlogHero() {
  return (
    <header className="bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-14 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="space-y-6"
        >
          <p className="text-sm uppercase tracking-widest ">Journal</p>
          <h1 className="text-pretty text-3xl font-semibold md:text-5xl">Insights, stories, and practical patterns</h1>
          <p className="max-w-2xl text-balance leading-relaxed text-foreground/80 md:text-lg">
            Modern, accessible UI built with solid color, clear hierarchy, and motion that serves. Weekly notes on
            design and development.
          </p>
    
        </motion.div>
      </div>
    </header>
  )
}
