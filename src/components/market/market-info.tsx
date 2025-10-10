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
import Link from "next/link"

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
      <Card className="bg-black p-6">
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

     {/* i want to  add here to section one is to understand the market rules go to ai-rule-analyzer and second to understand history and deep analysis of market got to ai-market-analyzer
      */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href='/ai-rule-analyzer'
              className="bg-[#1E2329] p-4 rounded-lg hover:bg-[#2A2E36] transition"
            >
              <div className="flex items-center mb-2">
                <Scale className="w-5 h-5 text-[#6366F1] mr-2" />
                <h4 className="text-lg font-semibold text-white">Understand Market Rules</h4>
              </div>
              <p className="text-[#94A3B8] text-sm">
                Analyze the rules and structure of this market using our AI Rule Analyzer tool.
              </p>
            </Link>
            <Link
              href="/ai-market-analyzer"
              className="bg-[#1E2329] p-4 rounded-lg hover:bg-[#2A2E36] transition"
            >
              <div className="flex items-center mb-2">
                <Calendar className="w-5 h-5 text-[#6366F1] mr-2" />
                <h4 className="text-lg font-semibold text-white">Market History & Analysis</h4>
              </div>
              <p className="text-[#94A3B8] text-sm">
                Dive deep into the historical data and trends of this market with our AI Market Analyzer.
              </p>
            </Link>
          </div>
        </div>
      </Card>

      {/* Related Markets */}




    </div>
  )
}
