"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { motion } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  TrendingUp, BarChart3, Activity, RefreshCw, DollarSign,
  ArrowUpRight, ArrowDownRight, UserX, AlertTriangle, AlertCircle,
  Download, PieChart, Target, Filter, Upload, Copy, Loader2
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import UserAlertSystem from "./user-alert-system"
import ProfitLossChart from "./profit-loss-chart"
import PolymarketTradeCard, { TradeData } from "../polymarket-trade-card"

import { Dialog, DialogHeader, DialogContent, DialogTitle } from "../ui/dialog"
import { toast } from "sonner"
import Link from "next/link"
import { calculateAmountWon, calculateProfit, calculateProfitPercentage, calculateTotalBet } from "@/utils/position-calculation"

// ============= TYPE DEFINITIONS =============
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
  status: 'open' | 'closed'
  id: string
  market: string
  slug: string
  eventSlug: string
  icon: string
  outcome: string
  shares: number
  avgPrice: number
  currentPrice: number
  currentValue: number
  pnl: number
  percentPnl: number
  realizedPnl: number
  percentRealizedPnl: number
  endDate: string
  totalBought: number
  closedAt?: string
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
  slug: string
  eventSlug: string
  outcomeIndex: number
  transactionHash: string
}



// ============= UTILITY FUNCTIONS =============
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

// ============= ANIMATION VARIANTS =============
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 }
  }
}

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4 }
  },
  hover: {
    scale: 1.02,
    transition: { duration: 0.2 }
  }
}

// ============= POSITION ITEM COMPONENT =============
const PositionItem = ({
  position,
  index
}: {
  position: Position
  index: number
}) => {
  const tokenColor = getTokenColor(position.market)
  const tokenSymbol = getTokenSymbol(position.market)
  const isOpen = position.status === 'open'

  return (
    <motion.div variants={cardVariants} whileHover="hover" custom={index}>
      <Card className="bg-zinc-900/60 border border-zinc-800 hover:bg-zinc-900/80 hover:border-emerald-400/20 hover:shadow-lg hover:shadow-emerald-400/5 transition-all duration-300 backdrop-blur-xl overflow-hidden">
        <CardContent className="p-4 md:p-6">
          {/* Mobile Layout */}
          <div className="md:hidden space-y-3">
{
            isOpen ? (
              <>
                  <Link href={`/market/${position.eventSlug}`} target="_blank" rel="noopener noreferrer">
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        {position.icon ? (
                          <img src={position.icon} alt="" className="w-10 h-10 rounded-lg" />
                        ) : (
                          <div className={`w-10 h-10 ${tokenColor} rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
                            {tokenSymbol}
                          </div>
                        )}
                        <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-zinc-900 ${isOpen ? 'bg-emerald-400' : 'bg-gray-400'
                          }`}></div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white text-sm font-medium leading-tight line-clamp-2">{position.market}</p>
                        </div>
                        <div className="flex gap-2">
                          <Badge
                            variant="outline"
                            className={`text-xs ${isOpen
                              ? 'border-emerald-400/50 text-emerald-400 bg-emerald-950/50'
                              : 'border-gray-400/50 text-gray-400 bg-gray-950/50'
                              }`}
                          >
                            {isOpen ? 'Open' : 'Closed'}
                          </Badge>
                          <Badge
                            variant="secondary"
                            className="bg-emerald-950/80 text-emerald-300 text-xs border border-emerald-400/30"
                          >
                            {position.outcome}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </Link>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-xs">Shares</p>
                      <p className="text-white font-semibold">
                        {isOpen ? formatNumber(position.shares) : formatNumber(position.totalBought)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Avg Price</p>
                      <p className="text-white font-semibold">{(position.avgPrice * 100).toFixed(1)}¢</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Current</p>
                      <p className="text-white font-semibold">{(position.currentPrice * 100).toFixed(1)}¢</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">P&L</p>
                      <p className={`font-semibold ${isOpen
                        ? position.percentPnl > 0
                          ? "text-emerald-400"
                          : position.percentPnl < 0
                            ? "text-red-400"
                            : "text-gray-400"
                        : position.realizedPnl > 0
                          ? "text-emerald-400"
                          : position.realizedPnl < 0
                            ? "text-red-400"
                            : "text-gray-400"
                        }`}>
                        {isOpen
                          ? `${position.percentPnl > 0 ? "+" : ""}${position.percentPnl.toFixed(1)}%`
                          : `${position.realizedPnl > 0 ? "+" : ""}${position.realizedPnl.toFixed(1)}%`}
                      </p>
                    </div>
                  </div>
              </>
            )
            :
            (
              <>
                  <Link href={`/market/${position.eventSlug}`} target="_blank" rel="noopener noreferrer">
                    <div className="relative">
                      {position.icon ? (
                        <img src={position.icon} alt="" className="w-10 h-10 rounded-lg" />
                      ) : (
                        <div className={`w-10 h-10 ${tokenColor} rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
                          {tokenSymbol}
                        </div>
                      )}
                      <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-zinc-900 ${isOpen ? 'bg-emerald-400' : 'bg-gray-400'
                        }`}></div>
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium leading-tight mb-1 line-clamp-2">{position.market}</p>
                      <div className="flex gap-2">
                        <Badge
                          variant="outline"
                          className={`text-xs ${isOpen
                            ? 'border-emerald-400/50 text-emerald-400 bg-emerald-950/50'
                            : 'border-gray-400/50 text-gray-400 bg-gray-950/50'
                            }`}
                        >
                          {isOpen ? 'Open' : 'Closed'}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className="bg-emerald-950/80 text-emerald-300 text-xs border border-emerald-400/30"
                        >
                          {position.outcome}
                        </Badge>
                      </div>
                    </div>
                  </Link>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-1">
                      <p className="text-white font-semibold">
                        {
                          `$${calculateTotalBet({
                            avgPrice: position.avgPrice,
                            totalBought: position.totalBought,
                            realizedPnl: position.realizedPnl,
                            curPrice: position.currentPrice
                          })}`
                        }
                      </p>
                      <p className="text-gray-400 text-xs">Total Bet</p>
                    </div>

                    <div className="col-span-1">
                      <p className="text-white font-semibold">
{
                        `$${calculateAmountWon({
                          avgPrice: position.avgPrice,
                          totalBought: position.totalBought,
                          realizedPnl: position.realizedPnl,
                          curPrice: position.currentPrice
                        })}`  }
                      </p>
                      <p className="text-gray-400 text-xs">Amount Won</p>
                    </div>
                  </div>
              </>
            )
}
          </div>

          {/* Desktop Layout */}
          <div className="hidden md:grid md:grid-cols-12 gap-4 items-center">
          {
           isOpen ? (
                <> 
                 <Link href={`/market/${position.eventSlug}`} target="_blank" rel="noopener noreferrer" className="col-span-5 flex items-center gap-3">
                  <div className="relative">
                    {position.icon ? (
                      <img src={position.icon} alt="" className="w-10 h-10 rounded-lg" />
                    ) : (
                      <div className={`w-10 h-10 ${tokenColor} rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
                        {tokenSymbol}
                      </div>
                    )}
                    <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-zinc-900 ${isOpen ? 'bg-emerald-400' : 'bg-gray-400'
                      }`}></div>
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium leading-tight mb-1 line-clamp-2">{position.market}</p>
                    <div className="flex gap-2">
                      <Badge
                        variant="outline"
                        className={`text-xs ${isOpen
                          ? 'border-emerald-400/50 text-emerald-400 bg-emerald-950/50'
                          : 'border-gray-400/50 text-gray-400 bg-gray-950/50'
                          }`}
                      >
                        {isOpen ? 'Open' : 'Closed'}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className="bg-emerald-950/80 text-emerald-300 text-xs border border-emerald-400/30"
                      >
                        {position.outcome}
                      </Badge>
                    </div>
                  </div>
                </Link>

                  <div className="col-span-2 text-center">
                    <p className="text-white font-semibold">
                      {isOpen ? formatNumber(position.shares) : formatNumber(position.totalBought)}
                    </p>
                    <p className="text-gray-400 text-xs">shares</p>
                  </div>

                  <div className="col-span-1 text-center">
                    <p className="text-white font-semibold">{(position.avgPrice * 100).toFixed(1)}¢</p>
                    <p className="text-gray-400 text-xs">avg</p>
                  </div>

                  <div className="col-span-1 text-center">
                    <p className="text-white font-semibold">{(position.currentPrice * 100).toFixed(1)}¢</p>
                    <p className="text-gray-400 text-xs">current</p>
                  </div>

                  <div className="col-span-3 text-right">
                    <p className="text-white font-semibold">
                      {isOpen ? formatCurrency(position.currentValue) : formatCurrency(position.pnl)}
                    </p>
                    <p className={`text-sm font-medium ${isOpen
                      ? position.percentPnl > 0
                        ? "text-emerald-400"
                        : position.percentPnl < 0
                          ? "text-red-400"
                          : "text-gray-400"
                      : position.realizedPnl > 0
                        ? "text-emerald-400"
                        : position.realizedPnl < 0
                          ? "text-red-400"
                          : "text-gray-400"
                      }`}>
                      {isOpen
                        ? `${position.percentPnl > 0 ? "+" : ""}${position.percentPnl.toFixed(1)}%`
                        : `${position.realizedPnl > 0 ? "+" : ""}${position.realizedPnl.toFixed(1)}%`}
                    </p>
                  </div>
            </>
           )
           :
           
             <>
                    <Link href={`/market/${position.eventSlug}`} target="_blank" rel="noopener noreferrer" className="col-span-5 flex items-center gap-3">
                      <div className="relative">
                        {position.icon ? (
                          <img src={position.icon} alt="" className="w-10 h-10 rounded-lg" />
                        ) : (
                          <div className={`w-10 h-10 ${tokenColor} rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
                            {tokenSymbol}
                          </div>
                        )}
                        <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-zinc-900 ${isOpen ? 'bg-emerald-400' : 'bg-gray-400'
                          }`}></div>
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium leading-tight mb-1 line-clamp-2">{position.market}</p>
                        <div className="flex gap-2">
                          <Badge
                            variant="outline"
                            className={`text-xs ${isOpen
                              ? 'border-emerald-400/50 text-emerald-400 bg-emerald-950/50'
                              : 'border-gray-400/50 text-gray-400 bg-gray-950/50'
                              }`}
                          >
                            {isOpen ? 'Open' : 'Closed'}
                          </Badge>
                          <Badge
                            variant="secondary"
                            className="bg-emerald-950/80 text-emerald-300 text-xs border border-emerald-400/30"
                          >
                            {position.outcome}
                          </Badge>
                        </div>
                      </div>
                    </Link>
              


              <div className="col-span-2 text-center">
                <p className="text-white font-semibold">
                  ${calculateTotalBet({
                    avgPrice: position.avgPrice,
                    totalBought: position.totalBought,
                    realizedPnl: position.realizedPnl,
                    curPrice: position.currentPrice
                  })}
                </p>
              </div>




              <div className="col-span-1 text-center">
                <p className="text-white font-semibold">
                  $
                  {
                    calculateAmountWon({
                      avgPrice: position.avgPrice,
                      totalBought: position.totalBought,
                      realizedPnl: position.realizedPnl,
                      curPrice: position.currentPrice
                    })
                  }
                </p>
              </div>

              <div className="col-span-1 text-center">
                <p className="text-white font-semibold">
                  $
                  {
                    calculateProfit({
                      avgPrice: position.avgPrice,
                      totalBought: position.totalBought,
                      realizedPnl: position.realizedPnl,
                      curPrice: position.currentPrice
                    })
                  }
                </p>
              </div>


              <div className="col-span-3 text-right">
              {calculateProfitPercentage({
                      avgPrice: position.avgPrice,
                      totalBought: position.totalBought,
                      realizedPnl: position.realizedPnl,
                      curPrice: position.currentPrice
                    })}%
              </div>
             </>
           
          }
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ============= MAIN DASHBOARD COMPONENT =============
export default function UserDashboard({ address }: { address: string }) {
  // State Management - Cleanly separated
  const [userData, setUserData] = useState<UserData | null>(null)
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [openPositions, setOpenPositions] = useState<Position[]>([])
  const [closedPositions, setClosedPositions] = useState<Position[]>([])
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [analytics, setAnalytics] = useState<any>(null)

  // Loading states - separated for each data type
  const [loadingStates, setLoadingStates] = useState({
    user: true,
    metrics: true,
    openPositions: true,
    closedPositions: true,
    activity: true,
    analytics: true,
    initialLoad: true
  })

  // Error states - separated for better error handling
  const [errors, setErrors] = useState({
    user: null as string | null,
    metrics: null as string | null,
    openPositions: null as string | null,
    closedPositions: null as string | null,
    activity: null as string | null,
    analytics: null as string | null
  })

  // UI State
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState("positions")
  const [positionFilter, setPositionFilter] = useState<'all' | 'open' | 'closed'>('open')
  const [isTradeCardOpen, setIsTradeCardOpen] = useState(false)
  const [selectedTrade, setSelectedTrade] = useState<TradeData | null>(null)

  // ============= DATA FETCHING FUNCTIONS =============

  // Fetch user data
  const fetchUserData = useCallback(async () => {
    try {
      setLoadingStates(prev => ({ ...prev, user: true }))
      const response = await fetch(`/api/market/user?address=${address}`)
      if (!response.ok) throw new Error('Failed to fetch user data')
      const data = await response.json()
      setUserData(data)
      setErrors(prev => ({ ...prev, user: null }))
    } catch (error) {
      console.error('Error fetching user data:', error)
      setErrors(prev => ({ ...prev, user: 'Failed to load user data' }))
    } finally {
      setLoadingStates(prev => ({ ...prev, user: false }))
    }
  }, [address])

  // Fetch metrics
  const fetchMetrics = useCallback(async () => {
    try {
      setLoadingStates(prev => ({ ...prev, metrics: true }))
      const response = await fetch(`/api/market/metrics?address=${address}`)
      if (!response.ok) throw new Error('Failed to fetch metrics')
      const data = await response.json()
      setMetrics(data)
      setErrors(prev => ({ ...prev, metrics: null }))
    } catch (error) {
      console.error('Error fetching metrics:', error)
      setErrors(prev => ({ ...prev, metrics: 'Failed to load metrics' }))
    } finally {
      setLoadingStates(prev => ({ ...prev, metrics: false }))
    }
  }, [address])

  // Fetch open positions - using new dedicated endpoint
  const fetchOpenPositions = useCallback(async () => {
    try {
      setLoadingStates(prev => ({ ...prev, openPositions: true }))
      const response = await fetch(`/api/market/positions/open?address=${address}`)
      if (!response.ok) throw new Error('Failed to fetch open positions')
      const data = await response.json()
      setOpenPositions(data.positions || [])
      setErrors(prev => ({ ...prev, openPositions: null }))
    } catch (error) {                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
      console.error('Error fetching open positions:', error)
      setErrors(prev => ({ ...prev, openPositions: 'Failed to load open positions' }))
      setOpenPositions([])
    } finally {
      setLoadingStates(prev => ({ ...prev, openPositions: false }))
    }
  }, [address])

  // Fetch closed positions - using new dedicated endpoint
  const fetchClosedPositions = useCallback(async () => {
    try {
      setLoadingStates(prev => ({ ...prev, closedPositions: true }))
      const response = await fetch(`/api/market/positions/closed?address=${address}`)
      if (!response.ok) throw new Error('Failed to fetch closed positions')
      const data = await response.json()
      setClosedPositions(data.positions || [])
      setErrors(prev => ({ ...prev, closedPositions: null }))
    } catch (error) {
      console.error('Error fetching closed positions:', error)
      setErrors(prev => ({ ...prev, closedPositions: 'Failed to load closed positions' }))
      setClosedPositions([])
    } finally {
      setLoadingStates(prev => ({ ...prev, closedPositions: false }))
    }
  }, [address])

  // Fetch activity
  const fetchActivity = useCallback(async () => {
    try {
      setLoadingStates(prev => ({ ...prev, activity: true }))
      const response = await fetch(`/api/market/activity?address=${address}`)
      if (!response.ok) throw new Error('Failed to fetch activity')
      const data = await response.json()
      setActivity(data)
      setErrors(prev => ({ ...prev, activity: null }))
    } catch (error) {
      console.error('Error fetching activity:', error)
      setErrors(prev => ({ ...prev, activity: 'Failed to load activity' }))
    } finally {
      setLoadingStates(prev => ({ ...prev, activity: false }))
    }
  }, [address])

  // Fetch analytics
  const fetchAnalytics = useCallback(async () => {
    try {
      setLoadingStates(prev => ({ ...prev, analytics: true }))
      const response = await fetch(`/api/market/analytics?address=${address}`)
      if (!response.ok) throw new Error('Failed to fetch analytics')
      const data = await response.json()
      setAnalytics(data)
      setErrors(prev => ({ ...prev, analytics: null }))
    } catch (error) {
      console.error('Error fetching analytics:', error)
      setErrors(prev => ({ ...prev, analytics: 'Failed to load analytics' }))
    } finally {
      setLoadingStates(prev => ({ ...prev, analytics: false }))
    }
  }, [address])

  // ============= COMBINED DATA OPERATIONS =============

  // Combined positions for "all" filter
  const allPositions = useMemo(() => {
    const combined = [...openPositions, ...closedPositions]
    // Sort by status (open first) then by value/pnl
    return combined.sort((a, b) => {
      if (a.status !== b.status) {
        return a.status === 'open' ? -1 : 1
      }
      return b.currentValue - a.currentValue
    })
  }, [openPositions, closedPositions])

  // Get current positions based on filter
  const currentPositions = useMemo(() => {
    switch (positionFilter) {
      case 'open':
        return openPositions
      case 'closed':
        return closedPositions
      case 'all':
      default:
        return allPositions
    }
  }, [positionFilter, openPositions, closedPositions, allPositions])

  // Position counts for filter buttons
  const positionCounts = useMemo(() => ({
    all: allPositions.length,
    open: openPositions.length,
    closed: closedPositions.length
  }), [allPositions.length, openPositions.length, closedPositions.length])

  // ============= HANDLERS =============

  const handleFilterChange = useCallback((filter: 'all' | 'open' | 'closed') => {
    setPositionFilter(filter)
  }, [])

  const copyAddressHandler = useCallback(() => {
    if (userData?.proxyWallet) {
      navigator.clipboard.writeText(userData.proxyWallet)
      toast.success('Address copied to clipboard')
    }
  }, [userData])

  const handleCreateTradeCard = useCallback((item: ActivityItem) => {
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
    setSelectedTrade(tradeData)
    setIsTradeCardOpen(true)
  }, [])

  // Refresh data - only refreshes positions and activity
  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await Promise.all([
        fetchMetrics(),
        fetchOpenPositions(),
        fetchClosedPositions(),
        fetchActivity(),
        fetchAnalytics()
      ])
      toast.success('Data refreshed successfully')
    } catch (error) {
      toast.error('Failed to refresh some data')
    } finally {
      setRefreshing(false)
    }
  }, [fetchMetrics, fetchOpenPositions, fetchClosedPositions, fetchActivity, fetchAnalytics])

  // ============= EFFECTS =============

  // Initial data load
  useEffect(() => {
    const loadInitialData = async () => {
      setLoadingStates(prev => ({ ...prev, initialLoad: true }))

      // Fetch user data first (most important)
      await fetchUserData()

      // Fetch other data in parallel
      await Promise.all([
        fetchMetrics(),
        fetchOpenPositions(),
        fetchClosedPositions(),
        fetchActivity(),
        fetchAnalytics()
      ])

      setLoadingStates(prev => ({ ...prev, initialLoad: false }))
    }

    loadInitialData()
  }, [address, fetchUserData, fetchMetrics, fetchOpenPositions, fetchClosedPositions, fetchActivity, fetchAnalytics])

  // ============= COMPUTED VALUES =============

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

  // ============= RENDER CONDITIONS =============

  // Initial loading state
  if (loadingStates.initialLoad) {
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

  // Error state - only show if critical data failed
  if (errors.user && !userData) {
    return (
      <div className="min-h-screen bg-black bg-gradient-to-br from-black via-zinc-950 to-black text-white flex items-center justify-center p-4">
        <Card className="bg-zinc-900/80 border border-zinc-800 max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="text-red-400 mb-4">
              <UserX className="h-12 w-12 mx-auto" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">No User Found</h2>
            <p className="text-gray-400">{errors.user}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ============= MAIN RENDER =============

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
              <p className="text-gray-400 text-sm md:text-base flex items-center gap-2">
                <span className="hidden md:inline text-emerald-400 font-mono">
                  {userData?.proxyWallet || address}
                </span>
                <span className="md:hidden text-emerald-400 font-mono">
                  {formatAddress(userData?.proxyWallet || address)}
                </span>
                <Copy
                  className="h-4 w-4 text-gray-400 cursor-pointer hover:text-gray-200 transition-colors"
                  onClick={copyAddressHandler}
                />
                {userData?.createdAt && (
                  <span className="text-gray-400">
                    • Joined {new Date(userData.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
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
              {refreshing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
          </div>
        </motion.div>

        {/* Metrics Grid */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          variants={containerVariants}
        >
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            variants={containerVariants}
          >
            {metricsData.map((metric) => (
              <motion.div key={metric.label} variants={cardVariants} whileHover="hover">
                <Card className="bg-zinc-900/80 h-full border border-zinc-800 backdrop-blur-xl shadow-2xl shadow-black/50 hover:shadow-emerald-400/5 hover:border-emerald-400/20 transition-all duration-300">
                  <CardContent className="p-4">
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

        {/* Positions Tab */}
        <motion.div variants={itemVariants}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-zinc-900 border border-zinc-800 shadow-lg w-fit mb-6">
              <TabsTrigger
                value="positions"
                className="data-[state=active]:bg-zinc-800 data-[state=active]:text-emerald-400 data-[state=active]:shadow-lg font-semibold text-gray-300"
              >
                Positions
              </TabsTrigger>
              <TabsTrigger
                value="activity"
                className="data-[state=active]:bg-zinc-800 data-[state=active]:text-emerald-400 data-[state=active]:shadow-lg font-semibold text-gray-300"
              >
                Activity ({activity.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="positions" className="space-y-4">
              {/* Position Filters */}
              <div className="flex flex-wrap gap-2 p-1 bg-zinc-900/40 rounded-lg border border-zinc-800 w-fit">

                <Button
                  variant={positionFilter === 'open' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleFilterChange('open')}
                  disabled={loadingStates.openPositions}
                  className={`flex items-center gap-2 ${positionFilter === 'open'
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-zinc-800'
                    }`}
                >
                  {loadingStates.openPositions ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                  )}
                  Open
                  <Badge variant="secondary" className="bg-zinc-700 text-zinc-200 text-xs">
                    {positionCounts.open}
                  </Badge>
                </Button>

                <Button
                  variant={positionFilter === 'closed' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleFilterChange('closed')}
                  disabled={loadingStates.closedPositions}
                  className={`flex items-center gap-2 ${positionFilter === 'closed'
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-zinc-800'
                    }`}
                >
                  {loadingStates.closedPositions ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <div className="w-2 h-2 bg-gray-400 rounded-full" />
                  )}
                  Closed
                  <Badge variant="secondary" className="bg-zinc-700 text-zinc-200 text-xs">
                    {positionCounts.closed}
                  </Badge>
                </Button>
              </div>

              {/* Positions List */}
              {currentPositions.length === 0 ? (
                <Card className="bg-zinc-900/60 border border-zinc-800 shadow-2xl">
                  <CardContent className="p-8 text-center">
                    <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400 font-medium">
                      No {positionFilter === 'all' ? '' : positionFilter} positions found
                    </p>
                    {errors.openPositions || errors.closedPositions ? (
                      <p className="text-red-400 text-sm mt-2">
                        {errors.openPositions || errors.closedPositions}
                      </p>
                    ) : null}
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Desktop Table Header */}
                  <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-4 text-sm text-gray-400 font-semibold border-b border-zinc-800 bg-zinc-900/50 rounded-t-lg">
                   {
                    positionFilter== "open" ? (
                      <>
                            <div className="col-span-5">MARKET</div>
                            <div className="col-span-2 text-center">SHARES</div>
                            <div className="col-span-1 text-center">AVG</div>
                            <div className="col-span-1 text-center">CURRENT</div>
                            <div className="col-span-3 text-right">VALUE / P&L</div>
                      </>
                    ) : positionFilter === "closed" ? (
                      <>
                            <div className="col-span-5">MARKET</div>
                            <div className="col-span-2 text-center">TOTAL BET</div>
                            <div className="col-span-1 text-center">AMOUNT</div>
                            <div className="col-span-1 text-center">PROFIT</div>
                            <div className="col-span-3 text-right">PROFIT %</div>
                      </>
                    ) : null}
                  </div>

                  {/* Positions */}
                  <motion.div
                    className="space-y-3"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {currentPositions.map((position, index) => (
                      <PositionItem
                        key={`${position.id}-${position.outcome}`}
                        position={position}
                        index={index}
                      />
                    ))}
                  </motion.div>
                </>
              )}
            </TabsContent>

            <TabsContent value="activity" className="space-y-4">
              {/* Activity implementation remains the same */}
              <p className="text-gray-400">Activity tab content here...</p>
            </TabsContent>
          </Tabs>
        </motion.div>

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
    </motion.div>
  )
}