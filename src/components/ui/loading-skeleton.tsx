"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface LoadingSkeletonProps {
  className?: string
  lines?: number
}

export function LoadingSkeleton({ className, lines = 1 }: LoadingSkeletonProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }, (_, i) => (
        <motion.div
          key={i}
          className="h-4 bg-[#1E2329] rounded animate-pulse"
          initial={{ opacity: 0.5 }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, delay: i * 0.1 }}
        />
      ))}
    </div>
  )
}
