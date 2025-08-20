"use client"

import { useState, useMemo, useEffect } from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Activity, 
  Maximize2, 
  ZoomIn, 
  ZoomOut,
  Loader2,
  AlertCircle,
  Search
} from "lucide-react"
import { cn } from "@/lib/utils"
import { MarketSlug } from "@/types/market"

// Types for Polymarket API responses
interface PolymarketPricePoint {
  t: number // timestamp
  p: number // price
  v?: number // volume (if available)
}

interface PolymarketTrade {
  id: string
  price: string
  size: string
  timestamp: string
  side: string
}

interface ChartDataPoint {
  price: number
  timestamp: number
  time: string
  volume: number
  change: number
}

// Interval mapping for Polymarket API
const INTERVAL_MAP: Record<string, string> = {
  "1H": "1h",
  "4H": "4h",
  "1D": "1d",
  "1W": "1d", // Will aggregate 7 days
  "1M": "1d", // Will aggregate 30 days
}

export function TradingChart({ marketId, conditionId }: { marketId: string; conditionId: string }) {
  const [chartType, setChartType] = useState<"line" | "area" | "candle">("area")
  const [timeframe, setTimeframe] = useState("1D")
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showVolume, setShowVolume] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [marketInfo, setMarketInfo] = useState<any>(null)

  // Fetch price history from Polymarket
  const fetchPriceHistory = async (tokenId: string, interval: string) => {
    try {
      // Note: You might need to proxy this through your backend to avoid CORS issues
      const response = await fetch(
        `https://clob.polymarket.com/prices-history?market=${tokenId}&interval=${interval}`
      )
      
      if (!response.ok) {
        throw new Error(`Failed to fetch price history: ${response.statusText}`)
      }
      
      const data = await response.json()
      return data.history || []
    } catch (err) {
      console.error("Error fetching price history:", err)
      throw err
    }
  }

  // Fetch trades data from Polymarket
  const fetchTradesData = async (condId: string) => {
    try {
      // Note: You might need to proxy this through your backend to avoid CORS issues
      const response = await fetch(
        `https://data-api.polymarket.com/trades?market=${condId}&limit=100`
      )
      
      if (!response.ok) {
        throw new Error(`Failed to fetch trades: ${response.statusText}`)
      }
      
      const data = await response.json()
      return data || []
    } catch (err) {
      console.error("Error fetching trades:", err)
      throw err
    }
  }

  // Fetch market info
  const fetchMarketInfo = async (condId: string) => {
    try {
      const response = await fetch(
        `https://data-api.polymarket.com/markets/${condId}`
      )
      
      if (response.ok) {
        const data = await response.json()
        setMarketInfo(data)
      }
    } catch (err) {
      console.error("Error fetching market info:", err)
    }
  }

  // Process and combine data
  const processChartData = (
    priceHistory: PolymarketPricePoint[], 
    trades: PolymarketTrade[]
  ): ChartDataPoint[] => {
    // Create a map for volume aggregation
    const volumeMap = new Map<number, number>()
    
    // Aggregate trades volume by hour/day
    trades.forEach(trade => {
      const timestamp = new Date(trade.timestamp).getTime()
      const hourTimestamp = Math.floor(timestamp / (1000 * 60 * 60)) * (1000 * 60 * 60)
      const currentVolume = volumeMap.get(hourTimestamp) || 0
      volumeMap.set(hourTimestamp, currentVolume + parseFloat(trade.size))
    })

    // Process price history
    const processedData: ChartDataPoint[] = priceHistory.map((point, index) => {
      const timestamp = point.t * 1000 // Convert to milliseconds
      const volume = volumeMap.get(Math.floor(timestamp / (1000 * 60 * 60)) * (1000 * 60 * 60)) || 0
      
      const formattedTime = new Date(timestamp).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        ...(timeframe !== "1H" && timeframe !== "4H" ? { month: "short", day: "numeric" } : {}),
      })

      const previousPrice = index > 0 ? priceHistory[index - 1].p : point.p
      const change = point.p - previousPrice

      return {
        timestamp,
        time: formattedTime,
        price: point.p,
        volume: volume,
        change: change,
      }
    })

    return processedData
  }

  // Load data when market IDs are set
  const loadMarketData = async () => {
    if (!marketId || !conditionId) {
      setError("Please enter both Market Token ID and Condition ID")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const interval = INTERVAL_MAP[timeframe]
      
      // Fetch both price history and trades in parallel
      const [priceHistory, trades] = await Promise.all([
        fetchPriceHistory(marketId, interval),
        fetchTradesData(conditionId)
      ])

      // Fetch market info
      await fetchMarketInfo(conditionId)

      // Process and set the data
      const processed = processChartData(priceHistory, trades)
      setChartData(processed)
    } catch (err: any) {
      setError(err.message || "Failed to load market data")
      // Use mock data as fallback
      setChartData(generateMockData(timeframe))
    } finally {
      setIsLoading(false)
    }
  }

  // Load data when market IDs or timeframe changes
  useEffect(() => {
    if (marketId && conditionId) {
      loadMarketData()
    } else {
      // Use mock data if no market IDs
      setChartData(generateMockData(timeframe))
    }
  }, [marketId, conditionId, timeframe])

  // Mock data generator (fallback)
  const generateMockData = (timeframe: string): ChartDataPoint[] => {
    const dataPoints =
      timeframe === "1H" ? 60 : 
      timeframe === "4H" ? 96 :
      timeframe === "1D" ? 24 : 
      timeframe === "1W" ? 7 : 
      timeframe === "1M" ? 30 : 365
    const basePrice = 0.45
    const data: ChartDataPoint[] = []

    for (let i = 0; i < dataPoints; i++) {
      const timestamp = new Date()
      if (timeframe === "1H") {
        timestamp.setMinutes(timestamp.getMinutes() - (dataPoints - i))
      } else if (timeframe === "4H") {
        timestamp.setHours(timestamp.getHours() - (dataPoints - i) * 4)
      } else if (timeframe === "1D") {
        timestamp.setHours(timestamp.getHours() - (dataPoints - i))
      } else if (timeframe === "1W") {
        timestamp.setDate(timestamp.getDate() - (dataPoints - i))
      } else if (timeframe === "1M") {
        timestamp.setDate(timestamp.getDate() - (dataPoints - i))
      }

      const volatility = 0.02
      const trend = Math.sin(i / 10) * 0.01
      const randomChange = (Math.random() - 0.5) * volatility
      const price = Math.max(0.01, Math.min(0.99, basePrice + trend + randomChange))
      const volume = Math.random() * 10000 + 1000

      data.push({
        timestamp: timestamp.getTime(),
        time: timestamp.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          ...(timeframe !== "1H" && timeframe !== "4H" ? { month: "short", day: "numeric" } : {}),
        }),
        price: Number(price.toFixed(3)),
        volume: Math.round(volume),
        change: i > 0 ? price - data[i - 1]?.price || 0 : 0,
      })
    }

    return data
  }

  const currentPrice = chartData[chartData.length - 1]?.price || 0.45
  const previousPrice = chartData[chartData.length - 2]?.price || 0.45
  const priceChange = currentPrice - previousPrice
  const priceChangePercent = previousPrice !== 0 ? ((priceChange / previousPrice) * 100).toFixed(2) : "0.00"

  const timeframes = [
    { label: "1H", value: "1H" },
    { label: "4H", value: "4H" },
    { label: "1D", value: "1D" },
    { label: "1W", value: "1W" },
    { label: "1M", value: "1M" },
  ]

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-[#12161C] border border-[#1E2329] rounded-lg p-3 shadow-lg">
          <p className="text-[#94A3B8] text-sm mb-1">{data.time}</p>
          <p className="text-white font-semibold">
            Price: <span className="text-[#00D395]">${data.price.toFixed(3)}</span>
          </p>
          {showVolume && (
            <p className="text-[#94A3B8] text-sm">
              Volume: <span className="text-white">{data.volume.toLocaleString()}</span>
            </p>
          )}
        </div>
      )
    }
    return null
  }

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 },
    }

    switch (chartType) {
      case "line":
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E2329" />
            <XAxis dataKey="time" stroke="#94A3B8" fontSize={12} />
            <YAxis stroke="#94A3B8" fontSize={12} domain={["dataMin - 0.01", "dataMax + 0.01"]} />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="price"
              stroke="#00D395"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#00D395" }}
            />
          </LineChart>
        )
      case "area":
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00D395" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#00D395" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E2329" />
            <XAxis dataKey="time" stroke="#94A3B8" fontSize={12} />
            <YAxis stroke="#94A3B8" fontSize={12} domain={["dataMin - 0.01", "dataMax + 0.01"]} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="price"
              stroke="#00D395"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#priceGradient)"
            />
          </AreaChart>
        )
      default:
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E2329" />
            <XAxis dataKey="time" stroke="#94A3B8" fontSize={12} />
            <YAxis stroke="#94A3B8" fontSize={12} domain={["dataMin - 0.01", "dataMax + 0.01"]} />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="price"
              stroke="#00D395"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#00D395" }}
            />
          </LineChart>
        )
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn("space-y-4", isFullscreen && "fixed inset-0 z-50 bg-[#0A0B0D] p-6")}
    >


      {/* Main Chart Card */}
      <Card className="bg-[#12161C] border-[#1E2329] p-6">
        {/* Chart Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl font-bold text-white">${currentPrice.toFixed(3)}</span>
                <Badge
                  variant={priceChange >= 0 ? "default" : "destructive"}
                  className={cn(
                    "flex items-center gap-1",
                    priceChange >= 0 ? "bg-[#00D395] text-black" : "bg-[#FF3B69] text-white",
                  )}
                >
                  {priceChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {priceChangePercent}%
                </Badge>
              </div>
              <p className="text-[#94A3B8] text-sm">
                {marketId ? "Polymarket Price" : "Demo Data (Enter Market IDs)"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Chart Type Selector */}
            <div className="flex items-center bg-[#1E2329] rounded-lg p-1">
              <Button
                variant={chartType === "line" ? "default" : "ghost"}
                size="sm"
                onClick={() => setChartType("line")}
                className={cn(
                  "h-8 px-3",
                  chartType === "line" ? "bg-[#6366F1] text-white" : "text-[#94A3B8] hover:text-white",
                )}
              >
                <Activity className="w-4 h-4" />
              </Button>
              <Button
                variant={chartType === "area" ? "default" : "ghost"}
                size="sm"
                onClick={() => setChartType("area")}
                className={cn(
                  "h-8 px-3",
                  chartType === "area" ? "bg-[#6366F1] text-white" : "text-[#94A3B8] hover:text-white",
                )}
              >
                <BarChart3 className="w-4 h-4" />
              </Button>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-[#94A3B8] hover:text-white">
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-[#94A3B8] hover:text-white">
                <ZoomOut className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="h-8 w-8 p-0 text-[#94A3B8] hover:text-white"
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Timeframe Selector */}
        <div className="flex items-center justify-between mb-6">
          <Tabs value={timeframe} onValueChange={setTimeframe}>
            <TabsList className="bg-[#1E2329] border border-[#2A2F36]">
              {timeframes.map((tf) => (
                <TabsTrigger
                  key={tf.value}
                  value={tf.value}
                  className="data-[state=active]:bg-[#6366F1] data-[state=active]:text-white text-[#94A3B8]"
                >
                  {tf.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowVolume(!showVolume)}
            className={cn("text-sm", showVolume ? "text-[#6366F1]" : "text-[#94A3B8]")}
          >
            Volume
          </Button>
        </div>

        {/* Price Chart */}
        <div className="h-80 lg:h-96">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-[#6366F1]" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {renderChart()}
            </ResponsiveContainer>
          )}
        </div>



        {/* Chart Info */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#1E2329]">
          <div className="flex items-center gap-6 text-sm">
            <div>
              <span className="text-[#94A3B8]">24h Volume: </span>
              <span className="text-white font-medium">
                ${chartData.reduce((sum, d) => sum + d.volume, 0).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[#94A3B8]">24h High: </span>
              <span className="text-white font-medium">
                ${Math.max(...chartData.map(d => d.price)).toFixed(3)}
              </span>
            </div>
            <div>
              <span className="text-[#94A3B8]">24h Low: </span>
              <span className="text-white font-medium">
                ${Math.min(...chartData.map(d => d.price)).toFixed(3)}
              </span>
            </div>
          </div>
          <div className="text-xs text-[#94A3B8]">
            {marketId ? "Live Data" : "Demo Mode"} • Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </Card>
    </motion.div>
  )
}