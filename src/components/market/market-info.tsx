"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Calendar, User, FileText, Scale, Share2, Copy, ChevronLeft, ChevronRight } from "lucide-react"
import type { Market, MarketSlug } from "@/types/market"

interface MarketInfoProps {
  market: MarketSlug
}

// Mock related markets
const relatedMarkets = [
  {
    id: "13",
    question: "Will Donald Trump win the 2024 election?",
    image: "/election-rally.png",
    yesPrice: 0.52,
    volume: 45000,
  },
  {
    id: "14",
    question: "Will there be a recession in 2024?",
    image: "/recession-economy.png",
    yesPrice: 0.38,
    volume: 28000,
  },
  {
    id: "15",
    question: "Will Bitcoin reach $100k in 2024?",
    image: "/bitcoin-price-chart.png",
    yesPrice: 0.65,
    volume: 67000,
  },
  {
    id: "16",
    question: "Will AI replace 50% of jobs by 2030?",
    image: "/ai-jobs-automation.png",
    yesPrice: 0.23,
    volume: 15000,
  },
]

export function MarketInfo({ market }: MarketInfoProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [copied, setCopied] = useState(false)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: market.question,
          text: `Check out this prediction market: ${market.question}`,
          url: window.location.href,
        })
      } catch (err) {
        console.log("Error sharing:", err)
      }
    } else {
      // Fallback to copying URL
      handleCopyUrl()
    }
  }

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.log("Error copying:", err)
    }
  }

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % Math.ceil(relatedMarkets.length / 2))
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + Math.ceil(relatedMarkets.length / 2)) % Math.ceil(relatedMarkets.length / 2))
  }

  return (
    <div className="space-y-8">
      {/* Market Description */}
      <Card className="bg-[#12161C] border-[#1E2329] p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#6366F1]" />
            Market Description
          </h3>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="border-[#1E2329] text-[#94A3B8] hover:text-white bg-transparent"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyUrl}
              className="border-[#1E2329] text-[#94A3B8] hover:text-white bg-transparent"
            >
              <Copy className="w-4 h-4 mr-2" />
              {copied ? "Copied!" : "Copy URL"}
            </Button>
          </div>
        </div>

        <div className="prose prose-invert max-w-none">
          <p className="text-[#94A3B8] leading-relaxed text-lg mb-6">{market.description}</p>

          <div className="bg-[#1E2329] rounded-lg p-4 mb-6">
            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Scale className="w-4 h-4 text-[#6366F1]" />
              Resolution Criteria
            </h4>
            <ul className="text-[#94A3B8] space-y-2 text-sm">
              <li>
                • This market will resolve to "Yes" if Joe Biden tests positive for COVID-19 before November 3rd, 2020,
                11:59 PM ET.
              </li>
              <li>
                • The test must be confirmed by official sources (White House, Biden campaign, or credible news
                outlets).
              </li>
              <li>• Antibody tests showing past infection do not count - only active infection tests.</li>
              <li>• If the election date changes, the resolution date will adjust accordingly.</li>
              <li>• Market will resolve to "No" if Biden does not test positive by the deadline.</li>
            </ul>
          </div>

          <div className="bg-[#1E2329] rounded-lg p-4">
            <h4 className="text-white font-semibold mb-3">Market Rules</h4>
            <ul className="text-[#94A3B8] space-y-2 text-sm">
              <li>• All trades are final once executed</li>
              <li>• Market may be paused in case of extraordinary circumstances</li>
              <li>• Resolution will be based on credible, verifiable sources</li>
              <li>• Disputes will be resolved by market moderators</li>
              <li>• Trading fees: 2% on profits</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Market Details */}
      <Card className="bg-[#12161C] border-[#1E2329] p-6">
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <User className="w-5 h-5 text-[#6366F1]" />
          Market Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Creator Info */}
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-[#94A3B8] mb-2">Created By</h4>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="/creator-avatar.png" />
                  <AvatarFallback className="bg-[#6366F1] text-white">PM</AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-white font-medium">PredictionMarkets</div>
                  <div className="text-[#94A3B8] text-sm flex items-center gap-1">
                    Verified Creator
                    <Badge variant="outline" className="text-xs border-[#00D395] text-[#00D395]">
                      ✓
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-[#94A3B8] mb-2">Category</h4>
              <Badge variant="outline" className="text-[#6366F1] border-[#6366F1] bg-[#6366F1]/10">
                {market.category}
              </Badge>
            </div>
          </div>

          {/* Dates */}
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-[#94A3B8] mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Important Dates
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[#94A3B8] text-sm">Created:</span>
                  <span className="text-white text-sm">October 15, 2020</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#94A3B8] text-sm">Ends:</span>
                  <span className="text-white text-sm font-medium">{formatDate(market.endDate)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#94A3B8] text-sm">Resolution:</span>
                  <span className="text-white text-sm">Within 24 hours of end date</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Separator className="bg-[#1E2329] my-6" />

        {/* Market Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">${market.volume24hr}</div>
            <div className="text-[#94A3B8] text-sm">Total Volume</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">1,247</div>
            <div className="text-[#94A3B8] text-sm">Total Traders</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">${market.liquidity}</div>
            <div className="text-[#94A3B8] text-sm">Liquidity</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">
              {Math.floor((new Date(market.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}
            </div>
            <div className="text-[#94A3B8] text-sm">Days Left</div>
          </div>
        </div>
      </Card>

      {/* Related Markets */}
      <Card className="bg-[#12161C] border-[#1E2329] p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">Related Markets</h3>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={prevSlide}
              className="border-[#1E2329] text-[#94A3B8] hover:text-white h-8 w-8 p-0 bg-transparent"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={nextSlide}
              className="border-[#1E2329] text-[#94A3B8] hover:text-white h-8 w-8 p-0 bg-transparent"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="overflow-hidden">
          <motion.div
            className="flex gap-4"
            animate={{ x: -currentSlide * 100 + "%" }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {Array.from({ length: Math.ceil(relatedMarkets.length / 2) }, (_, slideIndex) => (
              <div key={slideIndex} className="flex gap-4 min-w-full">
                {relatedMarkets.slice(slideIndex * 2, slideIndex * 2 + 2).map((relatedMarket) => (
                  <Card
                    key={relatedMarket.id}
                    className="bg-[#1E2329] border-[#2A2F36] p-4 flex-1 cursor-pointer hover:border-[#6366F1]/50 transition-colors"
                  >
                    <div className="flex gap-3">
                      <img
                        src={relatedMarket.image || "/placeholder.svg"}
                        alt={relatedMarket.question}
                        className="w-16 h-12 object-cover rounded bg-[#2A2F36]"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white text-sm font-medium line-clamp-2 mb-2">{relatedMarket.question}</h4>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#00D395] font-medium">
                            {(relatedMarket.yesPrice * 100).toFixed(0)}¢
                          </span>
                          <span className="text-[#94A3B8]">${relatedMarket.volume.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ))}
          </motion.div>
        </div>
      </Card>
    </div>
  )
}
