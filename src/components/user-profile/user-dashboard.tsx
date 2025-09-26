"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, BarChart3, Activity, RefreshCw, DollarSign, ArrowUpRight, ArrowDownRight, UserX, AlertTriangle, AlertCircle, Download, PieChart, Target, Filter, Upload } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import UserAlertSystem from "./user-alert-system"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  Line,
  LineChart,
  Bar,
  BarChart,
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts"
import ProfitLossChart from "./profit-loss-chart"
import PolymarketTradeCard, { TradeData } from "../polymarket-trade-card"
import { Dialog, DialogHeader,DialogContent, DialogTitle } from "../ui/dialog"


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
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
    },
  },
  hover: {
    scale: 1.02,
    transition: {
      duration: 0.2,
    },
  },
}

// Utility functions
const formatAddress = (address: string) => {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

const formatNumber = (num: number) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(2) + 'K'
  }
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

const formatCurrency = (num: number) => {
  if (Math.abs(num) >= 1000000) {
    return '$' + (num / 1000000).toFixed(2) + 'M'
  } else if (Math.abs(num) >= 1000) {
    return '$' + (num / 1000).toFixed(2) + 'K'
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp * 1000)
  const now = new Date()
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

  if (diffInHours < 1) {
    const minutes = Math.floor(diffInHours * 60)
    return `${minutes}m ago`
  } else if (diffInHours < 24) {
    return `${Math.floor(diffInHours)}h ago`
  } else if (diffInHours < 168) {
    return `${Math.floor(diffInHours / 24)}d ago`
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  })
}

const getTokenColor = (market: string): string => {
  const marketLower = market.toLowerCase()
  if (marketLower.includes('ethereum') || marketLower.includes('eth')) return 'bg-purple-500'
  if (marketLower.includes('bitcoin') || marketLower.includes('btc')) return 'bg-orange-500'
  if (marketLower.includes('xrp')) return 'bg-blue-500'
  if (marketLower.includes('solana') || marketLower.includes('sol')) return 'bg-gradient-to-br from-purple-400 to-blue-500'
  if (marketLower.includes('trump')) return 'bg-red-500'
  if (marketLower.includes('harris')) return 'bg-blue-600'
  return 'bg-emerald-500'
}

const getTokenSymbol = (market: string): string => {
  const marketLower = market.toLowerCase()
  if (marketLower.includes('ethereum')) return 'ETH'
  if (marketLower.includes('bitcoin')) return 'BTC'
  if (marketLower.includes('xrp')) return 'XRP'
  if (marketLower.includes('solana')) return 'SOL'
  if (marketLower.includes('trump')) return 'DJT'
  if (marketLower.includes('harris')) return 'KH'
  return '?'
}

interface UserData {
  name: string
  pseudonym: string
  proxyWallet: string
  profileImage: string
  createdAt: string
}

interface Metrics {
  volume: number
  profit: number
  positionValue: number
  marketsTraded: number
}

interface Position {
  id: string
  market: string
  slug: string
  icon: string
  outcome: string
  shares: number
  avgPrice: number
  currentPrice: number
  currentValue: number
  pnl: number
  percentPnl: number
  endDate: string
}

interface ActivityItem {
  id: string
  timestamp: number
  type: string
  side: string
  market: string
  icon: string
  outcome: string
  size: number
  usdcSize: number
  price: number
}

export default function UserDashboard({ address }: { address: string }) {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [positions, setPositions] = useState<Position[]>([])
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState("positions")
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [analyticsError, setAnalyticsError] = useState<string | null>(null)
  const [positionFilter, setPositionFilter] = useState('all') // 'all', 'open', 'closed'
  const [isTradeCardOpen, setIsTradeCardOpen] = useState(false)
  const [selectedTrade, setSelectedTrade] = useState<TradeData | null>(null)

  const handleCreateTradeCard = (item: any) => {
    // Convert activity item to TradeData format
    console.log('clicked');
    const tradeData: TradeData = {
      id: item.id || `trade-${Date.now()}`,
      timestamp: item.timestamp,
      type: 'TRADE',
      side: item.side.toUpperCase() as 'BUY' | 'SELL',
      market: item.market,
      slug: item.slug || '',
      eventSlug: item.eventSlug || '',
      icon: item.icon || '',
      outcome: item.outcome,
      outcomeIndex: item.outcomeIndex || 0,
      size: item.size,
      usdcSize: item.usdcSize,
      price: item.price,
      transactionHash: item.transactionHash || '0x' + Math.random().toString(16).substr(2, 64)
    }
    console.log('trade data',tradeData);
    setSelectedTrade(tradeData)
    setIsTradeCardOpen(true)
  }

  // Filter positions based on endDate and current date
  const filteredPositions = useMemo(() => {
    const currentDate = new Date()

    return positions.filter(position => {
      if (!position.endDate) {
        // If no endDate, consider it as open
        return positionFilter === 'all' || positionFilter === 'open'
      }

      const endDate = new Date(position.endDate)
      const isOpen = endDate > currentDate

      switch (positionFilter) {
        case 'open':
          return isOpen
        case 'closed':
          return !isOpen
        default:
          return true
      }
    })
  }, [positions, positionFilter])

  const openPositions = useMemo(() => {
    const currentDate = new Date()

    return positions.filter(position => {
      const hasNoEndDate = !position.endDate
      const hasEndDateInFuture = position.endDate && new Date(position.endDate) > currentDate

      return hasNoEndDate || hasEndDateInFuture
    })
  }, [positions])

  // Count positions for filter buttons
  const positionCounts = useMemo(() => {
    const currentDate = new Date()
    let open = 0
    let closed = 0

    positions.forEach(position => {
      if (!position.endDate) {
        open++
        return
      }

      const endDate = new Date(position.endDate)
      if (endDate > currentDate) {
        open++
      } else {
        closed++
      }
    })

    return { open, closed, all: positions.length }
  }, [positions])

  // Fetch analytics
  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true)
      setAnalyticsError(null)
      // Fix the API path here - should match your actual API route
      const response = await fetch(`/api/market/analytics?address=${address}`)

      if (!response.ok) {
        throw new Error('Failed to fetch analytics')
      }

      const data = await response.json()
      setAnalytics(data)
    } catch (err) {
      setAnalyticsError(err instanceof Error ? err.message : 'Failed to load analytics')
      console.error('Error fetching analytics:', err)
    } finally {
      setAnalyticsLoading(false)
    }
  }

  // Fetch user data
  const fetchUserData = async () => {
    try {
      // Fix API paths to match your actual endpoints
      const response = await fetch(`/api/market/user?address=${address}`)
      if (!response.ok) throw new Error('Failed to fetch user data')
      const data = await response.json()
      setUserData(data)
    } catch (error) {
      console.error('Error fetching user data:', error)
      setError('Failed to load user data')
    }
  }

  // Fetch metrics
  const fetchMetrics = async () => {
    try {
      const response = await fetch(`/api/market/metrics?address=${address}`)
      if (!response.ok) throw new Error('Failed to fetch metrics')
      const data = await response.json()
      setMetrics(data)
    } catch (error) {
      console.error('Error fetching metrics:', error)
      setError('Failed to load metrics')
    }
  }

  // Fetch positions
  const fetchPositions = async () => {
    try {
      const response = await fetch(`/api/market/positions?address=${address}`)
      if (!response.ok) throw new Error('Failed to fetch positions')
      const data = await response.json()
      setPositions(data)
    } catch (error) {
      console.error('Error fetching positions:', error)
      setError('Failed to load positions')
    }
  }

  // Fetch activity
  const fetchActivity = async () => {
    try {
      const response = await fetch(`/api/market/activity?address=${address}`)
      if (!response.ok) throw new Error('Failed to fetch activity')
      const data = await response.json()
      setActivity(data)
    } catch (error) {
      console.error('Error fetching activity:', error)
      setError('Failed to load activity')
    }
  }

  // Initial data fetch
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true)
      setError(null)
      await Promise.all([
        fetchUserData(),
        fetchMetrics(),
        fetchPositions(),
        fetchActivity(),
        fetchAnalytics()
      ])
      setLoading(false)
    }
    fetchAllData()
  }, [address])

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true)
    setError(null)
    await Promise.all([
      fetchMetrics(),
      fetchPositions(),
      fetchActivity(),
      fetchAnalytics()
    ])
    setRefreshing(false)
  }

  // Calculate metrics with changes
  const metricsData = metrics ? [
    {
      label: "Position Value",
      value: formatCurrency(metrics.positionValue),
      icon: TrendingUp,
      change: metrics.positionValue > 0 ? "+12.5%" : "0%",
      rawValue: metrics.positionValue,
      positive: true
    },
    {
      label: "Total Profit/Loss",
      value: formatCurrency(metrics.profit),
      icon: DollarSign,
      change: metrics.profit > 0 ? `+${(metrics.profit / 1000).toFixed(0)}%` : `${(metrics.profit / 1000).toFixed(0)}%`,
      rawValue: metrics.profit,
      positive: metrics.profit > 0
    },
    {
      label: "Volume Traded",
      value: formatCurrency(metrics.volume),
      icon: BarChart3,
      change: "+15.7%",
      rawValue: metrics.volume,
      positive: true
    },
    {
      label: "Active Positions",
      value: openPositions.length.toString(),
      icon: Activity,
      change: `${openPositions.length} markets`,
      rawValue: openPositions.length,
      positive: true
    },
  ] : []

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-black bg-gradient-to-br from-black via-zinc-950 to-black text-white p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 md:h-20 md:w-20 rounded-full bg-zinc-900" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-48 bg-zinc-900" />
              <Skeleton className="h-4 w-64 bg-zinc-900" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full bg-zinc-900" />
            ))}
          </div>
          <Skeleton className="h-96 w-full bg-zinc-900" />
        </div>
      </div>
    )
  }

  // Error state
  if (error && !userData && !metrics) {
    return (
      <div className="min-h-screen bg-black bg-gradient-to-br from-black via-zinc-950 to-black text-white flex items-center justify-center p-4">
        <Card className="bg-zinc-900/80 border border-zinc-800 max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="text-red-400 mb-4">
              <UserX className="h-12 w-12 mx-auto" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">No User Found</h2>
            <p className="text-gray-400">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <motion.div
      className="min-h-screen bg-black bg-gradient-to-br from-black via-zinc-950 to-black text-white p-4 md:p-6 lg:p-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <motion.div
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
          variants={itemVariants}
        >
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-16 w-16 md:h-20 md:w-20 ring-2 ring-emerald-400/20 ring-offset-2 ring-offset-black">
                <AvatarImage src={userData?.profileImage || "/gradient-avatar-yellow-to-teal.jpg"} />
                <AvatarFallback className="bg-gradient-to-br from-yellow-400 to-teal-400 text-black font-bold text-xl">
                  {userData?.name?.slice(0, 2).toUpperCase() || "PM"}
                </AvatarFallback>
              </Avatar>
              <motion.div
                className="absolute -bottom-1 -right-1 h-6 w-6 bg-emerald-400 rounded-full border-2 border-black shadow-lg shadow-emerald-400/50"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
              />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                {userData?.name || userData?.pseudonym || "Loading..."}
              </h1>
              <p className="text-gray-400 text-sm md:text-base">
                <span className="text-emerald-400 font-mono">
                  {formatAddress(userData?.proxyWallet || address)}
                </span>
                {userData?.createdAt && (
                  <span> • Joined {new Date(userData.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <UserAlertSystem userAddress={address} />
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              size="sm"
              variant="outline"
              className="bg-zinc-900 text-emerald-400 border-emerald-400/30 hover:bg-emerald-400/10"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          variants={containerVariants}>
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2  gap-4 "
            variants={containerVariants}
          >
            {metricsData.map((metric, index) => (
              <motion.div key={metric.label} variants={cardVariants} whileHover="hover">
                <Card className="bg-zinc-900/80 h-full border border-zinc-800 backdrop-blur-xl shadow-2xl shadow-black/50 hover:shadow-emerald-400/5 hover:border-emerald-400/20 transition-all duration-300">
                  <CardContent className="p-4 ">
                    <div className="flex items-center justify-between mb-2">
                      <metric.icon className="h-5 w-5 text-gray-400" />
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${metric.positive
                        ? "text-emerald-300 bg-emerald-950/80 border border-emerald-400/30"
                        : "text-red-300 bg-red-950/80 border border-red-400/30"
                        }`}>
                        {metric.change}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm mb-1 font-medium">{metric.label}</p>
                    <p className="text-xl md:text-2xl font-bold text-white tracking-tight">{metric.value}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}

          </motion.div>
          <ProfitLossChart userAddress={address} />

        </motion.div>


        {/* Positions & Activity Tabs */}
        <motion.div variants={itemVariants}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <TabsList className="bg-zinc-900 border border-zinc-800 shadow-lg w-fit">
                <TabsTrigger
                  value="positions"
                  className="data-[state=active]:bg-zinc-800 data-[state=active]:text-emerald-400 data-[state=active]:shadow-lg font-semibold text-gray-300"
                >
                  Positions ({positions.length})
                </TabsTrigger>
                <TabsTrigger
                  value="activity"
                  className="data-[state=active]:bg-zinc-800 data-[state=active]:text-emerald-400 data-[state=active]:shadow-lg font-semibold text-gray-300"
                >
                  Activity ({activity.length})
                </TabsTrigger>
                <TabsTrigger
                  value="analytics"
                  className="data-[state=active]:bg-zinc-800 data-[state=active]:text-emerald-400 data-[state=active]:shadow-lg font-semibold text-gray-300"
                >
                  Analytics
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Positions Tab */}
            <TabsContent value="positions" className="space-y-4">
              {/* Filter Buttons */}
              <div className="flex flex-wrap gap-2 p-1 bg-zinc-900/40 rounded-lg border border-zinc-800 w-fit px-2">
                <Button
                  variant={positionFilter === 'all' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setPositionFilter('all')}
                  className={`flex items-center gap-2 ${positionFilter === 'all'
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-zinc-800'
                    }`}
                >
                  <Filter className="h-4 w-4" />
                  All Positions
                  <Badge variant="secondary" className="bg-zinc-700 text-zinc-200 text-xs">
                    {positionCounts.all}
                  </Badge>
                </Button>

                <Button
                  variant={positionFilter === 'open' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setPositionFilter('open')}
                  className={`flex items-center gap-2 ${positionFilter === 'open'
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-zinc-800'
                    }`}
                >
                  <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                  Open Positions
                  <Badge variant="secondary" className="bg-zinc-700 text-zinc-200 text-xs">
                    {positionCounts.open}
                  </Badge>
                </Button>

                <Button
                  variant={positionFilter === 'closed' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setPositionFilter('closed')}
                  className={`flex items-center gap-2 ${positionFilter === 'closed'
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-zinc-800'
                    }`}
                >
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  Closed Positions
                  <Badge variant="secondary" className="bg-zinc-700 text-zinc-200 text-xs">
                    {positionCounts.closed}
                  </Badge>
                </Button>
              </div>

              {filteredPositions.length === 0 ? (
                <Card className="bg-zinc-900/60 border border-zinc-800 shadow-2xl">
                  <CardContent className="p-8 text-center">
                    <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400 font-medium">
                      {positionFilter === 'all'
                        ? 'No active positions'
                        : `No ${positionFilter} positions`}
                    </p>
                    {positionFilter !== 'all' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPositionFilter('all')}
                        className="mt-2 text-emerald-400 hover:text-emerald-300"
                      >
                        Show all positions
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Desktop Table Header */}
                  <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-4 text-sm text-gray-400 font-semibold border-b border-zinc-800 bg-zinc-900/50 rounded-t-lg">
                    <div className="col-span-5">MARKET</div>
                    <div className="col-span-2 text-center">SHARES</div>
                    <div className="col-span-1 text-center">AVG</div>
                    <div className="col-span-1 text-center">CURRENT</div>
                    <div className="col-span-3 text-right">VALUE / P&L</div>
                  </div>

                  {/* Positions List */}
                  <motion.div
                    className="space-y-3"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {filteredPositions.map((position:any, index:any) => {
                      const tokenColor = getTokenColor(position.market)
                      const tokenSymbol = getTokenSymbol(position.market)
                      const currentDate = new Date()
                      const endDate = position.endDate ? new Date(position.endDate) : null
                      const isOpen = !endDate || endDate > currentDate

                      return (
                        <motion.div key={position.id} variants={cardVariants} whileHover="hover" custom={index}>
                          <Card className="bg-zinc-900/60 border border-zinc-800 hover:bg-zinc-900/80 hover:border-emerald-400/20 hover:shadow-lg hover:shadow-emerald-400/5 transition-all duration-300 backdrop-blur-xl overflow-hidden">
                            <CardContent className="p-4 md:p-6">
                              {/* Mobile Layout */}
                              <div className="md:hidden space-y-3">
                                <div className="flex items-start gap-3">
                                  <div className="relative">
                                    {position.icon ? (
                                      <img src={position.icon} alt="" className="w-10 h-10 rounded-lg" />
                                    ) : (
                                      <div className={`w-10 h-10 ${tokenColor} rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
                                        {tokenSymbol}
                                      </div>
                                    )}
                                    {/* Status indicator */}
                                    <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-zinc-900 ${isOpen ? 'bg-emerald-400' : 'bg-gray-400'
                                      }`}></div>
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <p className="text-white text-sm font-medium leading-tight line-clamp-2">{position.market}</p>
                                      <Badge
                                        variant="outline"
                                        className={`text-xs ${isOpen
                                            ? 'border-emerald-400/50 text-emerald-400 bg-emerald-950/50'
                                            : 'border-gray-400/50 text-gray-400 bg-gray-950/50'
                                          }`}
                                      >
                                        {isOpen ? 'Open' : 'Closed'}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <Badge
                                        variant="secondary"
                                        className="bg-emerald-950/80 text-emerald-300 text-xs border border-emerald-400/30"
                                      >
                                        {position.outcome}
                                      </Badge>
                                      <span className="text-xs text-gray-400 font-medium">
                                        {formatNumber(position.shares)} shares
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <p className="text-gray-400 text-xs font-semibold mb-1">TYPE</p>
                                    <p className="text-white font-semibold">{position.outcome}</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-400 text-xs font-semibold mb-1">AMOUNT</p>
                                    <p className="text-white font-semibold">{formatCurrency(position.currentValue)}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-gray-400 text-xs font-semibold mb-1">PRICE</p>
                                    <p className="text-white font-semibold">{(position.currentValue * 100).toFixed(1)}¢</p>
                                  </div>
                                </div>
                              </div>

                              {/* Desktop Layout */}
                              <div className="hidden md:grid md:grid-cols-12 gap-4 items-center">
                                <div className="col-span-5 flex items-center gap-3">
                                  <div className="relative">
                                    {position.icon ? (
                                      <img src={position.icon} alt="" className="w-10 h-10 rounded-lg" />
                                    ) : (
                                      <div className={`w-10 h-10 ${tokenColor} rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
                                        {tokenSymbol}
                                      </div>
                                    )}
                                    {/* Status indicator */}
                                    <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-zinc-900 ${isOpen ? 'bg-emerald-400' : 'bg-gray-400'
                                      }`}></div>
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <p className="text-white text-sm font-medium leading-tight line-clamp-2">{position.market}</p>
                                      <Badge
                                        variant="outline"
                                        className={`text-xs ${isOpen
                                            ? 'border-emerald-400/50 text-emerald-400 bg-emerald-950/50'
                                            : 'border-gray-400/50 text-gray-400 bg-gray-950/50'
                                          }`}
                                      >
                                        {isOpen ? 'Open' : 'Closed'}
                                      </Badge>
                                    </div>
                                    <Badge
                                      variant="secondary"
                                      className="bg-emerald-950/80 text-emerald-300 text-xs border border-emerald-400/30"
                                    >
                                      {position.outcome}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="col-span-2 text-center">
                                  <p className="text-white font-semibold">{formatNumber(position.shares)}</p>
                                  <p className="text-gray-400 text-xs">shares</p>
                                </div>
                                <div className="col-span-1 text-center">
                                  <p className="text-white font-semibold">{(position.avgPrice * 100).toFixed(1)}¢</p>
                                  <p className="text-gray-400 text-xs">avg price</p>
                                </div>
                                <div className="col-span-1 text-center">
                                  <p className="text-white font-semibold">{(position.currentPrice * 100).toFixed(1)}¢</p>
                                  <p className="text-gray-400 text-xs">current price</p>
                                </div>
                                <div className="col-span-3 text-right">
                                  <p className="text-white font-semibold">{formatCurrency(position.currentValue)}</p>
                                  <p className={`text-sm font-medium ${position.percentPnl > 0
                                    ? 'text-emerald-400'
                                    : position.percentPnl < 0
                                      ? 'text-red-400'
                                      : 'text-gray-400'
                                    }`}>
                                    {position.percentPnl > 0 ? '+' : ''}{position.percentPnl.toFixed(1)}%
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      )
                    })}
                  </motion.div>
                </>
              )}
            </TabsContent>
            {/* Activity Tab */}
            <TabsContent value="activity" className="space-y-4">
           <div>
                <div className="space-y-4">
                  {activity.length === 0 ? (
                    <Card className="bg-zinc-900/60 border border-zinc-800 shadow-2xl">
                      <CardContent className="p-8 text-center">
                        <div className="h-12 w-12 text-gray-400 mx-auto mb-4">
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <p className="text-gray-400 font-medium">No recent activity</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {activity.map((item: any, index: number) => {
                        const tokenColor = getTokenColor(item.market)
                        const tokenSymbol = getTokenSymbol(item.market)
                        const isBuy = item.side.toLowerCase() === 'buy'
                        return (
                          <div key={`${item.id}-${index}`}>
                            <Card className="bg-zinc-900/60 border border-zinc-800 hover:bg-zinc-900/80 hover:border-emerald-400/20 hover:shadow-lg hover:shadow-emerald-400/5 transition-all duration-300 backdrop-blur-xl overflow-hidden">
                              <CardContent className="p-4 md:p-6">
                                <div className="flex items-center gap-3">
                                  <div className="relative">
                                    {item.icon ? (
                                      <img src={item.icon} alt="" className="w-10 h-10 rounded-lg" />
                                    ) : (
                                      <div className={`w-10 h-10 ${tokenColor} rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
                                        {tokenSymbol}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-white text-sm font-medium leading-tight mb-1 line-clamp-2">{item.market}</p>
                                    <Badge
                                      variant="secondary"
                                      className={`text-xs border ${isBuy
                                        ? "bg-emerald-950/80 text-emerald-300 border-emerald-400/30"
                                        : "bg-red-950/80 text-red-300 border-red-400/30"
                                        }`}
                                    >
                                      {item.outcome}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <div className="text-right">
                                      <p className={`text-sm font-semibold ${isBuy ?
                                        'text-emerald-400'
                                        : 'text-red-400'
                                        }`}>
                                        {isBuy ? '+' : '-'}{formatNumber(item.size)} shares
                                      </p>
                                      <p className="text-gray-400 text-xs">{formatCurrency(item.usdcSize)}</p>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleCreateTradeCard(item)}
                                      className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-purple-500/30 hover:from-purple-600/30 hover:to-blue-600/30 text-purple-300 hover:text-purple-200 transition-all duration-200"
                                    >
                                      <Upload className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="mt-3 grid grid-cols-3 gap-4 text-sm text-gray-400">
                                  <div>
                                    <p className="font-semibold">{item.side.charAt(0).toUpperCase() + item.side.slice(1)}</p>
                                  </div>
                                  <div className="text-center">
                                    <p className="font-semibold">{(item.price * 100).toFixed(1)}¢</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-medium">{formatDate(item.timestamp)}</p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Trade Card Dialog */}
                <Dialog open={isTradeCardOpen} onOpenChange={setIsTradeCardOpen}>
                  <DialogContent className="max-w-2xl bg-zinc-900 border-zinc-800 p-0" aria-describedby="trade-card-description">
                    <DialogHeader className="p-6 pb-0">
                      <DialogTitle className="text-white">Trade Card</DialogTitle>
                      <div id="trade-card-description" className="sr-only">
                        Generate and share a visual card for your Polymarket trade
                      </div>
                    </DialogHeader>
                    {selectedTrade && <PolymarketTradeCard tradeData={selectedTrade} />}
                  </DialogContent>
                </Dialog>
           </div>
            </TabsContent>



            <TabsContent value="analytics" className="space-y-6">

              {

                error ? (
                  <Card className="bg-zinc-900/60 border border-zinc-800 shadow-2xl">
                    <CardContent className="p-8 text-center">
                      <div className="text-red-400 mb-4">
                        <AlertCircle className="h-12 w-12 mx-auto" />
                      </div>
                      <h2 className="text-xl font-bold text-white mb-2">Error Loading Analytics</h2>
                      <p className="text-gray-400">{error}</p>
                    </CardContent>
                  </Card>
                ) : analytics ? (

                  <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card className="bg-zinc-900/60 border border-zinc-800 shadow-2xl backdrop-blur-xl">
                        <CardHeader>
                          <CardTitle className="text-white flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-emerald-400" />
                            Profit Trend
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ChartContainer
                            config={{
                              profit: {
                                label: "Profit",
                                color: COLORS[0],
                              },
                            }}
                            className="h-[300px]"
                          >
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={analytics.performanceData}>
                                <defs>
                                  <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="month" stroke="#9ca3af" />
                                <YAxis stroke="#9ca3af" />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Area
                                  type="monotone"
                                  dataKey="profit"
                                  stroke="#10b981"
                                  strokeWidth={2}
                                  fill="url(#profitGradient)"
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          </ChartContainer>
                        </CardContent>
                      </Card>

                      <Card className="bg-zinc-900/60 border border-zinc-800 shadow-2xl backdrop-blur-xl">
                        <CardHeader>
                          <CardTitle className="text-white flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-emerald-400" />
                            Trading Volume
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ChartContainer
                            config={{
                              volume: {
                                label: "Volume",
                                color: "hsl(var(--emerald-400))",
                              },
                            }}
                            className="h-[300px]"
                          >
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={analytics.performanceData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="month" stroke="#9ca3af" />
                                <YAxis stroke="#9ca3af" />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Bar dataKey="volume" fill="#10b981" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </ChartContainer>
                        </CardContent>
                      </Card>
                    </div>


                    {/* Market Distribution & Win Rate */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card className="bg-zinc-900/60 border border-zinc-800 shadow-2xl backdrop-blur-xl">
                        <CardHeader>
                          <CardTitle className="text-white flex items-center gap-2">
                            <PieChart className="h-5 w-5 text-emerald-400" />
                            Market Distribution
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {analytics.marketDistribution.map((market: any, index: number) => (
                              <div key={market.market} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div
                                    className="w-4 h-4 rounded-full"
                                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                  />
                                  <span className="text-white font-medium">{market.market}</span>
                                </div>
                                <div className="text-right">
                                  <div className="text-white font-bold">{market.value}%</div>
                                  <div className="text-gray-400 text-sm">{market.trades} trades</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-zinc-900/60 border border-zinc-800 shadow-2xl backdrop-blur-xl">
                        <CardHeader>
                          <CardTitle className="text-white flex items-center gap-2">
                            <Target className="h-5 w-5 text-emerald-400" />
                            Win Rate Trend
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ChartContainer
                            config={{
                              winRate: {
                                label: "Win Rate %",
                                color: "hsl(var(--emerald-400))",
                              },
                            }}
                            className="h-[250px]"
                          >
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={analytics.winRateData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="week" stroke="#9ca3af" />
                                <YAxis stroke="#9ca3af" domain={[0, 100]} />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Line
                                  type="monotone"
                                  dataKey="winRate"
                                  stroke="#10b981"
                                  strokeWidth={3}
                                  dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                                  activeDot={{ r: 6, stroke: "#10b981", strokeWidth: 2 }}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </ChartContainer>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Trading Statistics */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Buy/Sell Distribution */}
                      <Card className="bg-zinc-900/60 border border-zinc-800 shadow-2xl backdrop-blur-xl">
                        <CardHeader>
                          <CardTitle className="text-white flex items-center gap-2">
                            <Activity className="h-5 w-5 text-emerald-400" />
                            Buy/Sell Distribution
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-400">Buy Orders</span>
                              <div className="flex items-center gap-2">
                                <div className="w-32 bg-gray-700 rounded-full h-2">
                                  <div
                                    className="bg-emerald-400 h-2 rounded-full"
                                    style={{ width: `${analytics.buySellDistribution.buyPercentage}%` }}
                                  />
                                </div>
                                <span className="text-white font-bold">
                                  {analytics.buySellDistribution.buyPercentage}%
                                </span>
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-400">Sell Orders</span>
                              <div className="flex items-center gap-2">
                                <div className="w-32 bg-gray-700 rounded-full h-2">
                                  <div
                                    className="bg-red-400 h-2 rounded-full"
                                    style={{ width: `${analytics.buySellDistribution.sellPercentage}%` }}
                                  />
                                </div>
                                <span className="text-white font-bold">
                                  {analytics.buySellDistribution.sellPercentage}%
                                </span>
                              </div>
                            </div>
                            <div className="pt-2 mt-2 border-t border-zinc-700">
                              <div className="flex justify-between">
                                <span className="text-gray-400">Buy Volume</span>
                                <span className="text-emerald-400 font-bold">
                                  {formatCurrency(analytics.buySellDistribution.buyVolume)}
                                </span>
                              </div>
                              <div className="flex justify-between mt-2">
                                <span className="text-gray-400">Sell Volume</span>
                                <span className="text-red-400 font-bold">
                                  {formatCurrency(analytics.buySellDistribution.sellVolume)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Trade Size Distribution */}
                      <Card className="bg-zinc-900/60 border border-zinc-800 shadow-2xl backdrop-blur-xl">
                        <CardHeader>
                          <CardTitle className="text-white flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-emerald-400" />
                            Trade Size Analysis
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <div className="text-gray-400 text-sm">Average Size</div>
                                <div className="text-white font-bold text-lg">
                                  {formatCurrency(analytics.tradeSizeDistribution.averageSize)}
                                </div>
                              </div>
                              <div>
                                <div className="text-gray-400 text-sm">Median Size</div>
                                <div className="text-white font-bold text-lg">
                                  {formatCurrency(analytics.tradeSizeDistribution.medianSize)}
                                </div>
                              </div>
                            </div>
                            <div className="pt-2 border-t border-zinc-700">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-gray-400 text-sm">Small (&lt;$100)</span>
                                <span className="text-white font-medium">
                                  {analytics.tradeSizeDistribution.smallTrades} trades
                                </span>
                              </div>
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-gray-400 text-sm">Medium ($100-$1k)</span>
                                <span className="text-white font-medium">
                                  {analytics.tradeSizeDistribution.mediumTrades} trades
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-400 text-sm">Large (&gt;$1k)</span>
                                <span className="text-white font-medium">
                                  {analytics.tradeSizeDistribution.largeTrades} trades
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </>

                ) : (
                  <Card className="bg-zinc-900/60 border border-zinc-800 shadow-2xl">
                    <CardContent className="p-8 text-center">
                      <div className="text-yellow-400 mb-4">
                        <AlertTriangle className="h-12 w-12 mx-auto" />
                      </div>
                      <h2 className="text-xl font-bold text-white mb-2">Analytics Unavailable</h2>
                      <p className="text-gray-400">Analytics data is currently unavailable. Please try again later.</p>
                    </CardContent>
                  </Card>
                )
              }

            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Stats Overview Section */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Performance Summary */}
          <Card className="bg-zinc-900/60 border border-zinc-800 backdrop-blur-xl">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
                Performance Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Win Rate</span>
                  <span className="text-white font-semibold">
                    {positions.length > 0
                      ? `${((positions.filter(p => p.pnl > 0).length / positions.length) * 100).toFixed(0)}%`
                      : 'N/A'
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Avg. Return</span>
                  <span className={`font-semibold ${positions.length > 0 && positions.reduce((acc, p) => acc + p.percentPnl, 0) / positions.length > 0
                    ? 'text-emerald-400'
                    : 'text-red-400'
                    }`}>
                    {positions.length > 0
                      ? `${(positions.reduce((acc, p) => acc + p.percentPnl, 0) / positions.length).toFixed(1)}%`
                      : 'N/A'
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Best Position</span>
                  <span className="text-emerald-400 font-semibold">
                    {positions.length > 0
                      ? `+${Math.max(...positions.map(p => p.percentPnl)).toFixed(1)}%`
                      : 'N/A'
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Worst Position</span>
                  <span className="text-red-400 font-semibold">
                    {positions.length > 0
                      ? `${Math.min(...positions.map(p => p.percentPnl)).toFixed(1)}%`
                      : 'N/A'
                    }
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Trading Activity */}
          <Card className="bg-zinc-900/60 border border-zinc-800 backdrop-blur-xl">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Activity className="h-5 w-5 text-emerald-400" />
                Trading Activity
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Total Trades</span>
                  <span className="text-white font-semibold">{activity.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Buy Orders</span>
                  <span className="text-emerald-400 font-semibold">
                    {activity.filter(a => a.side === 'BUY').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Sell Orders</span>
                  <span className="text-red-400 font-semibold">
                    {activity.filter(a => a.side === 'SELL').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Avg. Trade Size</span>
                  <span className="text-white font-semibold">
                    {activity.length > 0
                      ? formatCurrency(activity.reduce((acc, a) => acc + a.usdcSize, 0) / activity.length)
                      : 'N/A'
                    }
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>


        {/* Bottom Info */}
        <motion.div variants={itemVariants} className="text-center text-xs text-gray-500 pb-4">
          <p>Data updates every 30 seconds • Prices in USDC</p>
          {error && (
            <p className="text-yellow-400 mt-2">
              Some data may be unavailable. {error}
            </p>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}



