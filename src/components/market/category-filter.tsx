"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import type { Category } from "@/types/market"

interface CategoryFilterProps {
  categories: Category[]
  activeCategory: Category
  onCategoryChange: (category: Category) => void
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3 },
  },
}

export function CategoryFilter({ categories, activeCategory, onCategoryChange }: CategoryFilterProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
      style={{
        maskImage: "linear-gradient(to right, transparent, black 20px, black calc(100% - 20px), transparent)",
        WebkitMaskImage: "linear-gradient(to right, transparent, black 20px, black calc(100% - 20px), transparent)",
      }}
    >
      {categories.map((category) => (
        <motion.button
          key={category}
          variants={itemVariants}
          onClick={() => onCategoryChange(category)}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200",
            "hover:scale-105 active:scale-95",
            activeCategory === category
              ? "bg-success text-white shadow-lg"
              : "bg-card text-text-secondary hover:bg-accent hover:text-accent-foreground border border-border",
          )}
        >
          {category}
        </motion.button>
      ))}
    </motion.div>
  )
}
