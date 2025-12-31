"use client"

import { motion } from "framer-motion"


export function BlogHero() {
  return (
    <header className="bg-background text-foreground w-full  flex items-center justify-center py-5">
      <div className="">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="space-y-6"
        >
          <h1 className="text-pretty text-3xl font-semibold md:text-5xl">Markium Blogs</h1>
    
        </motion.div>
      </div>
    </header>
  )
}
