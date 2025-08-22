"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Loader2, AlertCircle } from "lucide-react"

// Types for Polymarket API
interface PolymarketPricePoint {
  t: number // timestamp
  p: number // price
}

interface MiniChartProps {
  marketId?: string
  height?: number
  width?: number
  showPrice?: boolean
  interval?: string
}

export default function PolymarketMiniChart({ 
  marketId = "", 
  height = 50, 
  width = 120,
  showPrice = true,
  interval = "4h"
}: MiniChartProps) {
  const [data, setData] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPrice, setCurrentPrice] = useState<number>(0)
  const [trend, setTrend] = useState<"up" | "down">("up")

  // Generate mock data for demo
  const generateMockData = (): number[] => {
    const basePrice = 0.45
    const points = 20
    const mockData: number[] = []

    for (let i = 0; i < points; i++) {
      const volatility = 0.02
      const trendFactor = Math.sin(i / 5) * 0.01
      const randomChange = (Math.random() - 0.5) * volatility
      const price = Math.max(0.01, Math.min(0.99, basePrice + trendFactor + randomChange))
      mockData.push(Number(price.toFixed(3)))
    }

    return mockData
  }

  // Fetch price history from Polymarket
  const fetchPriceHistory = async (tokenId: string) => {
    try {
      setIsLoading(true)
      setError(null)

      // Note: In production, you should proxy this through your backend to avoid CORS
      const response = await fetch(
        `https://clob.polymarket.com/prices-history?market=${tokenId}&interval=${interval}`
      )
      
      if (!response.ok) {
        throw new Error("Failed to fetch data")
      }
      
      const apiData = await response.json()
      const history = apiData.history || []
      
      if (history.length === 0) {
        throw new Error("No price data available")
      }

      // Extract prices and limit to last 20 points for mini chart
      const prices = history
        .slice(-20)
        .map((point: PolymarketPricePoint) => point.p)
      
      setData(prices)
      setCurrentPrice(prices[prices.length - 1] || 0)
      
      // Determine trend from first and last price
      const firstPrice = prices[0]
      const lastPrice = prices[prices.length - 1]
      setTrend(lastPrice >= firstPrice ? "up" : "down")
      
    } catch (err: any) {
      console.error("Error fetching price history:", err)
      setError(err.message)
      
      // Fallback to mock data
      const mockData = generateMockData()
      setData(mockData)
      setCurrentPrice(mockData[mockData.length - 1])
      setTrend(mockData[mockData.length - 1] >= mockData[0] ? "up" : "down")
    } finally {
      setIsLoading(false)
    }
  }

  // Load data when component mounts or marketId changes
  useEffect(() => {
    if (marketId.trim()) {
      fetchPriceHistory(marketId)
    } else {
      // Show mock data when no market ID provided
      const mockData = generateMockData()
      setData(mockData)
      setCurrentPrice(mockData[mockData.length - 1])
      setTrend(mockData[mockData.length - 1] >= mockData[0] ? "up" : "down")
    }
  }, [marketId, interval])

  // Calculate change percentage
  const changePercent = data.length >= 2 
    ? (((data[data.length - 1] - data[0]) / data[0]) * 100).toFixed(2)
    : "0.00"

  if (isLoading) {
    return (
      <div className="flex items-center justify-center bg-gray-800 rounded-lg p-4" style={{ width, height }}>
        <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center bg-gray-800 rounded-lg p-2" style={{ width, height }}>
        <AlertCircle className="w-4 h-4 text-red-400" />
      </div>
    )
  }

  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 0.001

  // Generate SVG path
  const pathData = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * (width - 20) + 10
      const y = (height - 20) - ((value - min) / range) * (height - 30) + 10
      return `${index === 0 ? "M" : "L"} ${x} ${y}`
    })
    .join(" ")

  const strokeColor = trend === "up" ? "#10b981" : "#ef4444"
  const gradientId = `gradient-${trend}-${Math.random().toString(36).substr(2, 9)}`

  return (
    <div className="relative rounded-lg p-1 ">
      {/* Price Display */}
      {showPrice && (
        <div className="flex items-center justify-between mb-2">
    
          <div className={`text-xs font-medium ${trend === "up" ? "text-green-400" : "text-red-400"}`}>
            {trend === "up" ? "+" : ""}{changePercent}%
          </div>
        </div>
      )}

      {/* Chart */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <svg width={width} height={height} className="overflow-visible">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Fill area */}
          <motion.path
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, ease: "easeInOut" }}
            d={`${pathData} L ${width - 10} ${height - 10} L 10 ${height - 10} Z`}
            fill={`url(#${gradientId})`}
          />

          {/* Stroke line */}
          <motion.path
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, ease: "easeInOut" }}
            d={pathData}
            fill="none"
            stroke={strokeColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Current price dot */}
          <motion.circle
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.2, duration: 0.3 }}
            cx={(width - 20) + 10}
            cy={(height - 20) - ((data[data.length - 1] - min) / range) * (height - 30) + 10}
            r="3"
            fill={strokeColor}
            className="drop-shadow-sm"
          />
        </svg>
      </motion.div>

      {/* Error indicator */}
      {error && !marketId && (
        <div className="absolute top-1 right-1">
          <div className="w-2 h-2 bg-yellow-400 rounded-full" title="Using demo data" />
        </div>
      )}


    </div>
  )
}

