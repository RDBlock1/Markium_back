"use client"

import { motion } from "framer-motion"
import { MarketCard } from "./market-card"
import type { Market } from "@/types/market"

interface MarketsGridProps {
  markets: Market[]
  loading?: boolean
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

const SkeletonCard = () => (
  <div className="rounded-xl border border-border bg-card glass backdrop-blur-md overflow-hidden">
    <div className="h-48 bg-muted animate-pulse" />
    <div className="p-6 space-y-4">
      <div className="h-4 bg-muted rounded animate-pulse" />
      <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
      <div className="space-y-2">
        <div className="h-8 bg-muted rounded animate-pulse" />
        <div className="h-8 bg-muted rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="h-12 bg-muted rounded animate-pulse" />
        <div className="h-12 bg-muted rounded animate-pulse" />
      </div>
    </div>
  </div>
)

const EmptyState = () => (
  <div className="col-span-full flex flex-col items-center justify-center py-16">
    <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
      <svg className="w-12 h-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    </div>
    <h3 className="text-lg font-semibold text-text-primary mb-2">No markets found</h3>
    <p className="text-text-secondary text-center max-w-md">
      Try adjusting your filters or check back later for new prediction markets.
    </p>
  </div>
)

export function MarketsGrid({ markets, loading = false }: MarketsGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )
  }

  if (markets.length === 0) {
    return (
      <div className="grid grid-cols-1">
        <EmptyState />
      </div>
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
    >
      {markets.map((market) => (
        <MarketCard key={market.id} market={market} />
      ))}
    </motion.div>
  )
}
