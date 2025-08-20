"use client"

import { motion, Variants } from "framer-motion"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, calculateTimeLeft } from "@/utils/format"
import type { Market } from "@/types/market"
import Link from "next/link"

interface MarketCardProps {
  market: Market
}

const cardVariants:Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
  hover: {
    scale: 1.02,
    transition: { duration: 0.2 },
  },
}

export function MarketCard({ market }: MarketCardProps) {
  const router = useRouter()

  let prices: number[] = [0, 0]
if (Array.isArray(market.outcomePrices)) {
  // Already an array
  prices = market.outcomePrices.map(p => parseFloat(p));
} else if (typeof market.outcomePrices === "string") {
  try {
    const parsed = JSON.parse(market.outcomePrices);
    if (Array.isArray(parsed)) {
      prices = parsed.map(p => parseFloat(p));
    }
  } catch (err) {
    console.error("Failed to parse outcomePrices:", market.outcomePrices, err);
  }
}

const yesPrice = prices[0] ?? 0;
const noPrice = prices[1] ?? 0;
const yesPercentage = (yesPrice * 100).toFixed(0);
const noPercentage = (noPrice * 100).toFixed(0);

  const handleClick = () => {
    router.push(`/market/${market.slug}`)
  }

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      onClick={handleClick}
      className="group relative overflow-hidden rounded-xl border border-border bg-card glass backdrop-blur-md cursor-pointer"
    >
   <Link href={`/market/${market.slug}`}>
      {/* Image Section */}
      <div className="relative h-48 overflow-hidden">
        <Image
          src={market.image || `/placeholder.svg?height=192&width=384&query=${encodeURIComponent(market.question)}`}
          alt={market.question}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <Badge variant={market.active ? "default" : "secondary"} className="absolute top-4 right-4">
          {market.active ? "Active" : "Closed"}
        </Badge>
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="font-semibold text-lg line-clamp-2 text-text-primary mb-4">{market.question}</h3>

        {/* Outcome Bars */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium w-12 text-text-secondary">YES</span>
            <div className="flex-1 h-8 bg-muted rounded-full overflow-hidden">
              <div
                style={{ width: `${yesPercentage}%` }}
                className="h-full bg-success flex items-center px-3 transition-all duration-300"
              >
                <span className="text-xs font-semibold text-white">{yesPercentage}%</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium w-12 text-text-secondary">NO</span>
            <div className="flex-1 h-8 bg-muted rounded-full overflow-hidden">
              <div
                style={{ width: `${noPercentage}%` }}
                className="h-full bg-danger flex items-center px-3 transition-all duration-300"
              >
                <span className="text-xs font-semibold text-white">{noPercentage}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-text-secondary mb-1">24h Volume</p>
            <p className="font-semibold text-sm">{formatCurrency(market.volume24hr)}</p>
          </div>
          <div>
            <p className="text-xs text-text-secondary mb-1">Liquidity</p>
            <p className="font-semibold text-sm">{formatCurrency(market.liquidity)}</p>
          </div>
        </div>

        {/* Price Change & End Date */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div>
            <p className="text-xs text-text-secondary">Ends</p>
            <p className="text-sm font-medium">{calculateTimeLeft(market.endDate)}</p>
          </div>
          {market.oneDayPriceChange !== undefined && (
            <Badge variant={market.oneDayPriceChange > 0 ? "secondary" : "destructive"}>
              {market.oneDayPriceChange > 0 ? "↑" : "↓"} {Math.abs(market.oneDayPriceChange).toFixed(1)}%
            </Badge>
          )}
        </div>
      </div>
   </Link>
    </motion.div>
  )
}
