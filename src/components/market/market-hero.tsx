"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Calendar, TrendingUp, Users, DollarSign } from "lucide-react"
import type { Market, MarketSlug } from "@/types/market"
import Image from "next/image"

interface MarketHeroProps {
  market: MarketSlug
}

export function MarketHero({ market }: MarketHeroProps) {
  const [animatedPrices, setAnimatedPrices] = useState(['0', '0'])
  const [priceChanges] = useState([2.5, -1.8]) // Mock 24h changes

let prices: number[] = [0, 0];

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

  // Animate price values on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedPrices([yesPercentage, noPercentage])
    }, 500)
    return () => clearTimeout(timer)
  }, [yesPercentage, noPercentage])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return `$${(volume / 1000000).toFixed(1)}M`
    }
    if (volume >= 1000) {
      return `$${(volume / 1000).toFixed(1)}K`
    }
    return `$${Number(volume).toFixed(0)}`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-6"
    >
      {/* Market Title and Image */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <div className="flex items-start gap-4 mb-4">
            <Badge
              variant={market.active ? "default" : "secondary"}
              className={`${market.active ? "bg-[#00D395] text-black" : "bg-[#94A3B8] text-white"} text-sm font-medium`}
            >
              {market.active ? "Active" : "Closed"}
            </Badge>
            <Badge variant="outline" className="text-[#94A3B8] border-[#1E2329]">
              {market.category}
            </Badge>
          </div>
          <h1 className="text-2xl lg:text-4xl font-bold text-white mb-4 leading-tight">{market.question}</h1>
          <p className="text-[#94A3B8] text-lg leading-relaxed max-w-3xl">{market.description}</p>
        </div>
        <div className="lg:w-80 flex-shrink-0">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="relative aspect-video rounded-xl overflow-hidden bg-[#12161C] border border-[#1E2329]"
          >
            <Image
              src={market.image || "/placeholder.svg"}
              alt={market.question}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 320px"
            />
          </motion.div>
        </div>
      </div>

      {/* Outcome Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* YES Card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <Card className="bg-[#12161C] border-[#1E2329] p-6 hover:border-[#00D395]/30 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-[#00D395] rounded-full"></div>
                <span className="text-xl font-semibold text-white">YES</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#00D395]" />
                <span className="text-sm text-[#00D395] font-medium">+{priceChanges[0]}%</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
                  className="text-4xl font-bold text-white mb-1"
                >
                  {animatedPrices[0]}¢
                </motion.div>
                <div className="text-[#94A3B8] text-sm">${yesPrice.toFixed(2)} per share</div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Probability</span>
                  <span className="text-white font-medium">{yesPercentage}%</span>
                </div>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ delay: 0.8, duration: 0.8 }}
                >
                  <Progress
                    value={Number(yesPercentage)}
                    className="h-2 bg-[#1E2329]"
                    style={{
                      background: "#1E2329",
                    }}
                  />
                </motion.div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* NO Card */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <Card className="bg-[#12161C] border-[#1E2329] p-6 hover:border-[#FF3B69]/30 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-[#FF3B69] rounded-full"></div>
                <span className="text-xl font-semibold text-white">NO</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#FF3B69] rotate-180" />
                <span className="text-sm text-[#FF3B69] font-medium">{priceChanges[1]}%</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
                  className="text-4xl font-bold text-white mb-1"
                >
                  {animatedPrices[1]}¢
                </motion.div>
                <div className="text-[#94A3B8] text-sm">${noPrice.toFixed(2)} per share</div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Probability</span>
                  <span className="text-white font-medium">{noPercentage}%</span>
                </div>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ delay: 0.8, duration: 0.8 }}
                >
                  <Progress
                    value={Number(noPercentage)}
                    className="h-2 bg-[#1E2329]"
                    style={{
                      background: "#1E2329",
                    }}
                  />
                </motion.div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Key Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <Card className="bg-[#12161C] border-[#1E2329] p-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#6366F1]/10 rounded-lg">
                <DollarSign className="w-5 h-5 text-[#6366F1]" />
              </div>
              <div>
                <div className="text-sm text-[#94A3B8]">Volume 24h</div>
                <div className="text-lg font-semibold text-white">{formatVolume(market.volume24hr)}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#6366F1]/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-[#6366F1]" />
              </div>
              <div>
                <div className="text-sm text-[#94A3B8]">Liquidity</div>
                <div className="text-lg font-semibold text-white">{formatVolume(Number(market.liquidity))}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#6366F1]/10 rounded-lg">
                <Users className="w-5 h-5 text-[#6366F1]" />
              </div>
              <div>
                <div className="text-sm text-[#94A3B8]">Traders</div>
                <div className="text-lg font-semibold text-white">1,247</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#6366F1]/10 rounded-lg">
                <Calendar className="w-5 h-5 text-[#6366F1]" />
              </div>
              <div>
                <div className="text-sm text-[#94A3B8]">End Date</div>
                <div className="text-lg font-semibold text-white">{formatDate(market.endDate)}</div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  )
}
