/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { TrendingUp, Zap,Upload, AlertCircle, BarChart3, Target, Activity, AlertTriangle, Sparkles, Award, Copy, TrendingDown } from "lucide-react"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { motion, Variants } from "framer-motion"
import { Skeleton } from "../ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import Link from "next/link"
import { Dialog, DialogHeader, DialogContent, DialogTitle } from "../ui/dialog"
import PolymarketTradeCard from "./polymarket-trade-card"
import { calculateAmountWon, calculateProfit, calculateProfitPercentage, calculateTotalBet } from "@/utils/position-calculation"

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
    Tooltip,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import PolymarketPositionCard, { PositionCard } from "./polymarket-position-card"
import UserAlertSystem from "./user-alert-system"
import { TradingActivityHeatmap } from "./trading-heatmap"


const PositionItem = ({
    position,
    index,
    isPositionCardOpen,
    setIsPositionCardOpen,
    selectedPosition,
    handleCreatePositionCard
}: {
    position: Position
    index: number
    isPositionCardOpen: boolean
    setIsPositionCardOpen: (open: boolean) => void
    selectedPosition: PositionCard | null
    handleCreatePositionCard: (position: Position) => void
}) => {

    const cardVariants: Variants = {
        hover: (index: number) => ({
            scale: 1.02,
            boxShadow: "0 10px 20px rgba(16, 185, 129, 0.1)",
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 20,
                delay: index * 0.05,
            },
        }),
    }
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
                                            <div>

                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleCreatePositionCard(position)}
                                                    className="bg-gradient-to-r from-cyan-600/20 to-cyan-600/20 border-cyan-500/30 hover:from-cyan-600/30 hover:to-cyan-600/30 text-cyan-300 hover:text-cyan-200 transition-all duration-200"
                                                >
                                                    <Upload className="h-4 w-4" />
                                                </Button>
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
                                            <div className="relative flex items-start gap-3 mb-2">
                                               <div>
                                                    {position.icon ? (
                                                        <img src={position.icon} alt="" className="w-10 h-10 rounded-lg" />
                                                    ) : (
                                                        <div className={`w-10 h-10 ${tokenColor} rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
                                                            {tokenSymbol}
                                                        </div>
                                                    )}
                                               </div>

                                                <p className="text-white text-sm font-medium leading-tight mb-1 line-clamp-2 truncate">{position.market}</p>

                                                <div>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleCreatePositionCard(position)}
                                                        className="bg-gradient-to-r from-cyan-600/20 to-cyan-600/20 border-cyan-500/30 hover:from-cyan-600/30 hover:to-cyan-600/30 text-cyan-300 hover:text-cyan-200 transition-all duration-200"
                                                    >
                                                        <Upload className="h-4 w-4" />
                                                    </Button>
                                                </div>

                                            </div>
                                            <div>
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
                                                        })}`}
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
                                    <Link href={`/market/${position.eventSlug}`} target="_blank" rel="noopener noreferrer" className="col-span-8 flex items-center gap-3">
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



                                    <div className="col-span-1 text-center">
                                        <p className="text-white font-semibold">
                                            {(() => {
                                                const cents = position.avgPrice * 100;
                                                const display = Number.isInteger(cents) ? cents : Math.ceil(cents);
                                                return `${display}¢`;
                                            })()}
                                        </p>
                                        <p className="text-gray-400 text-xs">avg</p>
                                    </div>

                                    <div className="col-span-1 text-center">
                                        <p className="text-white font-semibold">
                                            {(() => {
                                                const cents = position.currentPrice * 100;
                                                const display = Number.isInteger(cents) ? cents : Math.ceil(cents);
                                                return `${display}¢`;
                                            })()}
                                        </p>
                                        <p className="text-gray-400 text-xs">current</p>
                                    </div>

                                    <div className="col-span-1 text-right flex gap-x-5">
                                      <div>
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
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleCreatePositionCard(position)}
                                            className="bg-gradient-to-r from-cyan-600/20 to-cyan-600/20 border-cyan-500/30 hover:from-cyan-600/30 hover:to-cyan-600/30 text-cyan-300 hover:text-cyan-200 transition-all duration-200"
                                        >
                                            <Upload className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    
                                </>
                            )
                                :

                                <>
                                    <Link href={`/market/${position.eventSlug}`} target="_blank" rel="noopener noreferrer" className="col-span-8 flex items-center gap-3">
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
                                                    variant="secondary"
                                                    className="bg-emerald-950/80 text-emerald-300 text-xs border border-emerald-400/30"
                                                >
                                                    {position.label}
                                                </Badge>
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




                                    <div className="col-span-2 text-center">
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
                                        {(() => {
                                            const profit = calculateProfit({
                                                avgPrice: position.avgPrice,
                                                totalBought: position.totalBought,
                                                realizedPnl: position.realizedPnl,
                                                curPrice: position.currentPrice
                                            })
                                            const num = Number(profit)
                                            const cls = num > 0 ? "text-emerald-400 font-semibold" : num < 0 ? "text-red-400 font-semibold" : "text-gray-400"
                                            return (
                                                <span className={cls}>
                                                    {typeof profit === "number" ? formatCurrency(num) : profit}
                                                </span>
                                            )
                                        })()}

                                    </div>


                                </>

                        }

                        {/* Position Card Dialog */}
                        <Dialog open={isPositionCardOpen} onOpenChange={setIsPositionCardOpen}>
                            <DialogContent className="max-w-2xl bg-zinc-900 border-zinc-800 p-0" aria-describedby="trade-card-description">
                                <DialogHeader className="p-6 pb-0">
                                    <DialogTitle className="text-white">Position Card</DialogTitle>
                                    <div id="trade-card-description" className="sr-only">
                                        Generate and share a visual card for your Polymarket position
                                    </div>
                                </DialogHeader>
                                {selectedPosition && <PolymarketPositionCard position={selectedPosition!} />}
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
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

// ============= TYPE DEFINITIONS =============

export interface TradeData {
    id: string
    timestamp: number
    type: 'TRADE'
    side: 'BUY' | 'SELL'
    market: string
    slug: string
    eventSlug: string
    icon: string
    outcome: string
    outcomeIndex: number
    size: number
    usdcSize: number
    price: number
    transactionHash: string
}

interface UserData {
    name: string
    pseudonym: string
    proxyWallet: string
    profileImage: string
    createdAt: string
    largestWin:number;
    trades:number
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
    proxyWallet?: string
    asset?: string
    conditionId?: string
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
    curPrice?: number
    title?: string
    outcomeIndex?: number
    oppositeOutcome?: string
    oppositeAsset?: string
    label: 'WON' | 'LOST' | 'BREAK-EVEN'
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


interface WindowStat {
    value: number
    formatted: string
    fromTimestamp: number
    toTimestamp: number
    fromPnL: number
    toPnL: number
}

interface ProfitStatsResponse {
    address: string
    windows: {
        '1d': WindowStat
        '1w': WindowStat
        '1m': WindowStat
        'all': WindowStat
    }
    latestPoint: { t: number; p: number } | null
    totalDataPoints: number
    dataSourcesUsed: string[]
    series: {
        '1d': Array<{ t: number; p: number }>
        '1w': Array<{ t: number; p: number }>
        '1m': Array<{ t: number; p: number }>
        'all': Array<{ t: number; p: number }>
    }
}
// ============= UTILITY FUNCTIONS =============
const formatAddress = (address: string) => {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
}
const COLORS = ["#06b6d4", "#0891b2", "#0e7490", "#164e63", "#06d6a0"]
const CYAN = "#06b6d4"

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
type Timeframe = '1D' | '1W' | '1M' | 'ALL';


export default function UserProfile({ address }: { address: string }) {
    // State Management
    const [userData, setUserData] = useState<UserData | null>(null)
    const [metrics, setMetrics] = useState<Metrics | null>(null)
    const [openPositions, setOpenPositions] = useState<Position[]>([])
    const [closedPositions, setClosedPositions] = useState<Position[]>([])
    const [activity, setActivity] = useState<ActivityItem[]>([])
    const [analytics, setAnalytics] = useState<any>(null)
    const [chartData, setChartData] = useState<any[]>([])

    const [loading, setLoading] = useState(true)
    const [chartTimeframe, setChartTimeframe] = useState<Timeframe>('ALL');
    const [profitStats, setProfitStats] = useState<ProfitStatsResponse | null>(null)

    const [activeTab, setActiveTab] = useState("positions")
    const [positionFilter, setPositionFilter] = useState<'all' | 'open' | 'closed'>('open')
    const [isTradeCardOpen, setIsTradeCardOpen] = useState(false)
    const [selectedTrade, setSelectedTrade] = useState<TradeData | null>(null)
    const [isPositionCardOpen, setIsPositionCardOpen] = useState(false)
    const [selectedPosition, setSelectedPosition] = useState<PositionCard | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [refreshing, setRefreshing] = useState(false)
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
    const [errors, setErrors] = useState({
        user: null as string | null,
        metrics: null as string | null,
        openPositions: null as string | null,
        closedPositions: null as string | null,
        activity: null as string | null,
        analytics: null as string | null
    })
    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    }

    // Add these states after your existing state declarations
    const [loadingMore, setLoadingMore] = useState(false)
    const [hasMoreOpen, setHasMoreOpen] = useState(true)
    const [hasMoreClosed, setHasMoreClosed] = useState(true)
    const [hasMoreActivity, setHasMoreActivity] = useState(true)
    const [currentLimitOpen, setCurrentLimitOpen] = useState(50)
    const [currentLimitClosed, setCurrentLimitClosed] = useState(50)
    const [currentLimitActivity, setCurrentLimitActivity] = useState(50)
    const loadMoreOpenRef = useRef<HTMLDivElement>(null)
    const loadMoreClosedRef = useRef<HTMLDivElement>(null)
    const loadMoreActivityRef = useRef<HTMLDivElement>(null)
    const [chartLoading, setChartLoading] = useState(true)


    // ============= DATA FETCHING FUNCTIONS =============
    const fetchUserData = useCallback(async () => {
        try {
            const response = await fetch(`/api/market/user?address=${address}`)
            if (!response.ok) throw new Error('Failed to fetch user data')
            const data = await response.json()
        console.log('Fetched user data:', data);
            setUserData(data)
        } catch (error) {
            console.error('Error fetching user data:', error)
        }
    }, [address])

    const fetchMetrics = useCallback(async () => {
        try {
            const response = await fetch(`/api/market/metrics?address=${address}`)
            if (!response.ok) throw new Error('Failed to fetch metrics')
            const data = await response.json()
            console.log('Fetched metrics:', data);
            setMetrics(data)
        } catch (error) {
            console.error('Error fetching metrics:', error)
        }
    }, [address])

    const fetchOpenPositions = useCallback(async (limit: number) => {
        try {
            const response = await fetch(`/api/market/positions/open?address=${address}&limit=${limit}`)
            const data = await response.json()
            setOpenPositions(data.positions || [])
            setHasMoreOpen(data.hasMore || false)
        } catch (error) {
            console.error('Error fetching open positions:', error)
            setOpenPositions([])
        }
    }, [address])

    const fetchClosedPositions = useCallback(async (limit:number) => {
        try {
            const response = await fetch(`/api/market/positions/closed?address=${address}&limit=${limit}`)
            const data = await response.json()
            setClosedPositions(data.positions || [])
            setHasMoreClosed(data.hasMore || false)
        } catch (error) {
            console.error('Error fetching closed positions:', error)
            setClosedPositions([])
        }
    }, [address])

    const fetchActivity = useCallback(async (limit:number) => {
        try {
            const response = await fetch(`/api/market/activity?address=${address}&limit=${limit}`)
            const data = await response.json()
            const activityData = data.activities || data || []

            setActivity(Array.isArray(activityData) ? activityData : [])
            setHasMoreActivity(data.hasMore || false)
        } catch (error) {
            console.error('Error fetching activity:', error)
        }
    }, [address])

    const loadMoreOpenPositions = useCallback(async () => {
        if (loadingMore || !hasMoreOpen) return
        setLoadingMore(true)
        const newLimit = currentLimitOpen + 50
        await fetchOpenPositions(newLimit)
        setCurrentLimitOpen(newLimit)
        setLoadingMore(false)
    }, [loadingMore, hasMoreOpen, currentLimitOpen, fetchOpenPositions])

    const loadMoreClosedPositions = useCallback(async () => {
        if (loadingMore || !hasMoreClosed) return
        setLoadingMore(true)
        const newLimit = currentLimitClosed + 50
        await fetchClosedPositions(newLimit)
        setCurrentLimitClosed(newLimit)
        setLoadingMore(false)
    }, [loadingMore, hasMoreClosed, currentLimitClosed, fetchClosedPositions])

    const loadMoreActivity = useCallback(async () => {
        if (loadingMore || !hasMoreActivity) return
        setLoadingMore(true)
        const newLimit = currentLimitActivity + 50
        await fetchActivity(newLimit)
        setCurrentLimitActivity(newLimit)
        setLoadingMore(false)
    }, [loadingMore, hasMoreActivity, currentLimitActivity, fetchActivity])

    const fetchAnalytics = useCallback(async () => {
        try {
            const response = await fetch(`/api/polymarket/analytics?address=${address}`)
            if (!response.ok) throw new Error('Failed to fetch analytics')
            const data = await response.json()

            console.log('📊 New Analytics Data:', data) // Debug log
            setAnalytics(data)


        } catch (error) {
            console.error('Error fetching analytics:', error)
        }
    }, [address])

    const fetchProfitStats = useCallback(async () => {
        try {
            setChartLoading(true)
            const response = await fetch(`/api/market/user/profit-stats?user_address=${address}&fidelity=1d`)
            if (!response.ok) throw new Error('Failed to fetch profit stats')
            const data = await response.json()
            console.log('Fetched profit stats:', data);

            // ONLY set profitStats - let the useEffect handle chartData transformation
            setProfitStats(data)

        } catch (error) {
            console.error('Error fetching profit stats:', error)
            setProfitStats(null) // Set to null on error so useEffect can handle fallback
        } finally {
            setChartLoading(false)
        }
    }, [address])


    

    useEffect(() => {
        // Only observe when we're on the positions tab, viewing open positions, and have more to load
        if (activeTab !== 'positions' || positionFilter !== 'open' || !hasMoreOpen) {
            return
        }

        const currentRef = loadMoreOpenRef.current
        if (!currentRef) return

        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0]
                if (entry.isIntersecting && !loadingMore && hasMoreOpen) {
                    console.log('Loading more OPEN positions')
                    loadMoreOpenPositions()
                }
            },
            {
                threshold: 0.1,
                rootMargin: '200px'
            }
        )

        observer.observe(currentRef)

        return () => {
            observer.disconnect()
        }
    }, [activeTab, positionFilter, hasMoreOpen, loadingMore, loadMoreOpenPositions])

    // Observer for Closed Positions
    useEffect(() => {
        if (!loadMoreClosedRef.current || !hasMoreClosed || positionFilter !== 'closed' || activeTab !== 'positions') {
            return
        }

        const currentRef = loadMoreClosedRef.current // Capture ref value

        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0]
                if (entry.isIntersecting && !loadingMore && hasMoreClosed) {
                    console.log('Loading more CLOSED positions')
                    loadMoreClosedPositions()
                }
            },
            {
                threshold: 0.1,
                rootMargin: '200px'
            }
        )

        observer.observe(currentRef)

        return () => {
            observer.disconnect()
        }
    }, [hasMoreClosed, loadingMore, positionFilter, activeTab, loadMoreClosedPositions]) // Added loadMoreClosedPositions

    // Observer for Activity
    useEffect(() => {
        if (!loadMoreActivityRef.current || !hasMoreActivity || activeTab !== 'activity') {
            return
        }

        const currentRef = loadMoreActivityRef.current // Capture ref value

        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0]
                if (entry.isIntersecting && !loadingMore && hasMoreActivity) {
                    console.log('Loading more ACTIVITY')
                    loadMoreActivity()
                }
            },
            {
                threshold: 0.1,
                rootMargin: '200px'
            }
        )

        observer.observe(currentRef)

        return () => {
            observer.disconnect()
        }
    }, [hasMoreActivity, loadingMore, activeTab, loadMoreActivity]) // Added loadMoreActivity
    useEffect(() => {
        if (!profitStats?.series) {
            // Set empty state with better fallback
            setChartData([
                { date: "Start", value: 0, timestamp: 0 },
                { date: "Now", value: 0, timestamp: Date.now() / 1000 }
            ]);
            return;
        }

        const timeframeMap = {
            '1D': '1d',
            '1W': '1w',
            '1M': '1m',
            'ALL': 'all'
        } as const;

        const key = timeframeMap[chartTimeframe as keyof typeof timeframeMap];
        const seriesData = profitStats.series[key];

        if (seriesData && seriesData.length > 0) {
            const transformedData = seriesData.map((item) => {
                const date = new Date(item.t * 1000);
                let dateLabel: string;

                if (chartTimeframe === '1D') {
                    dateLabel = date.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                    });
                } else if (chartTimeframe === '1W') {
                    dateLabel = date.toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                    });
                } else if (chartTimeframe === '1M') {
                    dateLabel = date.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                    });
                } else {
                    dateLabel = date.toLocaleDateString('en-US', {
                        month: 'short',
                        year: '2-digit'
                    });
                }

                return {
                    date: dateLabel,
                    value: item.p,
                    timestamp: item.t
                };
            });

            setChartData(transformedData);
        } else {
            // No data for this timeframe
            setChartData([
                { date: "Start", value: 0, timestamp: 0 },
                { date: "Now", value: 0, timestamp: Date.now() / 1000 }
            ]);
        }
    }, [profitStats, chartTimeframe]);

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

    const handleCreatePositionCard = useCallback((position: Position) => {
        console.log('Creating position card for position:', position);
        if(!position) {

            toast.error('Cannot create position card: Position is missing');
            return;
        }
        const positionCard: PositionCard = {
            id: position.id,
            conditionId: position.conditionId || '',
            market: position.market,
            slug: position.slug,
            eventSlug: position.eventSlug,
            icon: position.icon,
            outcome: position.outcome,
            outcomeIndex: position.outcomeIndex || 0,
            oppositeOutcome: position.oppositeOutcome || '',
            shares: position.shares,
            totalBought: position.totalBought,
            totalSold: 0, // Assuming totalSold is not available in Position
            avgPrice: position.avgPrice,
            avgBuyPrice: position.avgPrice, // Assuming avgBuyPrice is same as avgPrice
            avgSellPrice: 0, // Assuming avgSellPrice is not available in Position
            currentPrice: position.currentPrice,
            closePrice: 0, // Assuming closePrice is not available in Position
            initialValue: position.avgPrice * position.shares,
            currentValue: position.currentValue,
            pnl: position.pnl,
            realizedPnl: position.realizedPnl,
            unrealizedPnl: position.pnl - position.realizedPnl,
            percentPnl: position.percentPnl,
            percentRealizedPnl: position.percentRealizedPnl,
            redeemable: false, // Assuming redeemable is not available in Position
            mergeable: false, // Assuming mergeable is not available in Position
            negativeRisk: false, // Assuming negativeRisk is not available in Position
            endDate: position.endDate,
            closedAt: position.closedAt || '',
            status: position.status,
            label:position.label

        }
        setSelectedPosition(positionCard)
        setIsPositionCardOpen(true)
    }, [])

  

    // ============= EFFECTS =============
    useEffect(() => {
        const loadData = async () => {
            setLoading(true)
            await Promise.all([
                fetchUserData(),
                fetchMetrics(),
                fetchOpenPositions(currentLimitOpen),
                fetchClosedPositions(currentLimitClosed),
                fetchActivity(currentLimitActivity),
                fetchAnalytics(),
                fetchProfitStats() 

            ])
            setLoading(false)
        }
        loadData()
    }, [address, fetchUserData, fetchMetrics, fetchOpenPositions, fetchClosedPositions, fetchActivity, fetchAnalytics, fetchProfitStats])
    const itemVariants : Variants= {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5 }
        }
    }

    // Add to COMPUTED VALUES section
    const currentTimeframeProfit = useMemo(() => {
        // ensure we always return a full WindowStat-shaped object so callers can safely access fromPnL/toPnL
        const emptyWindowStat: WindowStat = {
            value: 0,
            formatted: '$0.00',
            fromTimestamp: 0,
            toTimestamp: 0,
            fromPnL: 0,
            toPnL: 0,
        }

        if (!profitStats) return emptyWindowStat

        const timeframeMap = {
            '1D': '1d',
            '1W': '1w',
            '1M': '1m',
            'ALL': 'all'
        } as const

        const key = timeframeMap[chartTimeframe as keyof typeof timeframeMap]
        return profitStats.windows[key] ?? emptyWindowStat
    }, [profitStats, chartTimeframe])


    // ============= COMPUTED VALUES =============
    const profitPercentage = useMemo(() => {
        if (!metrics) return 0
        // Calculate profit percentage based on volume traded
        if (metrics.volume > 0) {
            return ((metrics.profit / metrics.volume) * 100).toFixed(2)
        }
        return 0
    }, [metrics])

    const joinDate = useMemo(() => {
        if (!userData?.createdAt) return ''
        return new Date(userData.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric'
        })
    }, [userData])
     


    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-black">
                <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
                    <div className="flex items-center gap-4 mb-6">
                        <Skeleton className="rounded-full w-16 h-16 bg-zinc-900" />
                        <div>
                            <Skeleton className="h-8 w-48 bg-zinc-900 mb-2" />
                            <Skeleton className="h-4 w-64 bg-zinc-900" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                        {[...Array(4)].map((_, i) => (
                            <Skeleton key={i} className="h-32 w-full bg-zinc-900 rounded-xl" />
                        ))}
                    </div>
                </main>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-black">
            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
                <div className="mb-6 sm:mb-8 flex justify-between">
                    <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                        <Avatar className="h-16 w-16 md:h-20 md:w-20 ring-2 ring-emerald-400/20 ring-offset-2 ring-offset-black">
                            <AvatarImage src={userData?.profileImage } />
                            <AvatarFallback className="bg-gradient-to-br from-yellow-400 to-teal-400 text-black font-bold text-xl">
                                {userData?.name?.slice(0, 2).toUpperCase() || "PM"}
                            </AvatarFallback>
                        </Avatar>
               
                        <div className="min-w-0">
                            <h2 className="text-2xl sm:text-3xl font-bold text-white truncate">
                                {userData?.name || userData?.pseudonym || "Loading..."}
                            </h2>
                            <p className="text-gray-500 text-xs sm:hidden font-light ">
{formatAddress(userData?.proxyWallet || address)}
                                <Button variant="outline" size="sm" className="ml-2 px-2 py-1 h-auto" onClick={copyAddressHandler}>
                                    <Copy className="w-3 h-3 mr-1" />
                                </Button>
                            </p>

                            <p className="hidden sm:block text-gray-500 text-xs sm:text-sm font-light ">
                                {userData?.proxyWallet || address}
                                <Button variant="outline" size="sm" className="ml-2 px-2 py-1 h-auto" onClick={copyAddressHandler}>
                                    <Copy className="w-3 h-3 mr-1" />
                                </Button>
                            </p>
                            <span>
                                {joinDate && `Joined ${joinDate}`}
                            </span>
                        </div>
                    </div>

                    <div className="my-auto">
                        <UserAlertSystem userAddress={userData?.proxyWallet || ''}/>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
                    {/* Position Value */}
                    <Card className="gradient-dark-card rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-[#1a1a1a] hover:border-cyan-500/50 transition group">
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <span className="text-gray-400 text-xs sm:text-sm font-medium">Position Value</span>
                            <div className="flex items-center gap-1 bg-cyan-500/10 text-cyan-400 px-2 py-1 rounded text-xs font-semibold">
                                <TrendingUp className="w-3 h-3" />
                                {metrics?.positionValue ? '+12.5%' : '0%'}
                            </div>
                        </div>
                        <p className="text-2xl sm:text-3xl font-bold text-white">
                            {formatCurrency(metrics?.positionValue || 0)}
                        </p>
                        <div className="h-1 bg-gradient-to-r from-cyan-500 to-transparent rounded-full mt-3 sm:mt-4 opacity-0 group-hover:opacity-100 transition"></div>
                    </Card>

                    {/* Total Profit/Loss */}
                    <Card className="gradient-dark-card rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-[#1a1a1a] hover:border-cyan-500/50 transition group">
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <span className="text-gray-400 text-xs sm:text-sm font-medium">Predictions </span>
                           </div>
                        <p className="text-2xl sm:text-3xl font-bold text-white">
                            {userData?.trades || 0}
                        </p>
                        <div className="h-1 bg-gradient-to-r from-cyan-500 to-transparent rounded-full mt-3 sm:mt-4 opacity-0 group-hover:opacity-100 transition"></div>
                    </Card>

                    {/* Volume Traded */}
                    <Card className="gradient-dark-card rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-[#1a1a1a] hover:border-cyan-500/50 transition group">
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <span className="text-gray-400 text-xs sm:text-sm font-medium">Volume Traded</span>
                            <div className="flex items-center gap-1 bg-cyan-500/10 text-cyan-400 px-2 py-1 rounded text-xs font-semibold">
                                <TrendingUp className="w-3 h-3" />
                                +15.7%
                            </div>
                        </div>
                        <p className="text-2xl sm:text-3xl font-bold text-white">
                            {formatCurrency(metrics?.volume || 0)}
                        </p>
                        <div className="h-1 bg-gradient-to-r from-cyan-500 to-transparent rounded-full mt-3 sm:mt-4 opacity-0 group-hover:opacity-100 transition"></div>
                    </Card>

                    {/* Active Positions */}
                    <Card className="gradient-dark-card rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-[#1a1a1a] hover:border-cyan-500/50 transition group">
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <span className="text-gray-400 text-xs sm:text-sm font-medium">Biggest Win</span>
                        
                        </div>
                        <p className="text-2xl sm:text-3xl font-bold text-white">{formatCurrency(userData?.largestWin!) || 0}</p>
                        <div className="h-1 bg-gradient-to-r from-cyan-500 to-transparent rounded-full mt-3 sm:mt-4 opacity-0 group-hover:opacity-100 transition"></div>
                    </Card>
                </div>

                <Card className="gradient-dark-card rounded-xl sm:rounded-2xl p-4 sm:p-8 border border-[#1a1a1a] mb-6 sm:mb-8">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-4">
                        <div>
                            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                                <Zap className="w-4 sm:w-5 h-4 sm:h-5 text-cyan-400" /> Profit/Loss
                            </h3>
                            <p className="text-gray-500 text-xs sm:text-sm mt-1 font-light">
                                {chartTimeframe === '1D' ? 'Last 24 Hours' :
                                    chartTimeframe === '1W' ? 'Last 7 Days' :
                                        chartTimeframe === '1M' ? 'Last 30 Days' : 'All Time'}
                            </p>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                            <button
                                onClick={() => setChartTimeframe("1D")}
                                className={`px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium ${chartTimeframe === "1D" ? 'bg-cyan-500 text-black font-semibold' : 'text-gray-400 hover:text-cyan-400 hover:bg-[#1a1a1a]'
                                    } rounded transition`}>
                                1D
                            </button>
                            <button
                                onClick={() => setChartTimeframe("1W")}
                                className={`px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium ${chartTimeframe === "1W" ? 'bg-cyan-500 text-black font-semibold' : 'text-gray-400 hover:text-cyan-400 hover:bg-[#1a1a1a]'
                                    } rounded transition`}>
                                1W
                            </button>
                            <button
                                onClick={() => setChartTimeframe("1M")}
                                className={`px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium ${chartTimeframe === "1M" ? 'bg-cyan-500 text-black font-semibold' : 'text-gray-400 hover:text-cyan-400 hover:bg-[#1a1a1a]'
                                    } rounded transition`}>
                                1M
                            </button>
                            <button
                                onClick={() => setChartTimeframe("ALL")}
                                className={`px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium ${chartTimeframe === "ALL" ? 'bg-cyan-500 text-black font-semibold' : 'text-gray-400 hover:text-cyan-400 hover:bg-[#1a1a1a]'
                                    } rounded transition`}>
                                ALL
                            </button>
                        </div>
                    </div>

                    <div className="mb-4 sm:mb-6">
                        <p className="text-2xl sm:text-4xl font-bold text-white">
                            {currentTimeframeProfit.formatted}
                        </p>
                        <p className={`text-base sm:text-lg font-semibold mt-2 ${currentTimeframeProfit.value >= 0 ? 'text-cyan-400' : 'text-red-400'}`}>
                            {currentTimeframeProfit.value >= 0 ? '+' : ''}{((currentTimeframeProfit.value / (currentTimeframeProfit.fromPnL || 1)) * 100).toFixed(2)}%
                        </p>
                    </div>

                    {!profitStats?.series && !chartData ? (

                        <div className="flex items-center justify-center h-[250px]">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500" />
                        </div>
                    ) : (
                            <ResponsiveContainer width="100%" height={250}>
                                <LineChart data={chartData.length > 0 ? chartData : [
                                    { date: "Jan", value: 0 },
                                    { date: "Feb", value: 0 },
                                    { date: "Mar", value: 0 },
                                ]}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                                    <XAxis dataKey="date" stroke="#666666" tick={{ fontSize: 12 }} />
                                    <YAxis stroke="#666666" tick={{ fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "#0a0a0a",
                                            border: "1px solid #1a1a1a",
                                            borderRadius: "8px",
                                        }}
                                        labelStyle={{ color: "#ffffff" }}
                                        formatter={(value: any) => {
                                            // Accept arrays or single values returned by recharts and extract a number safely
                                            const raw = Array.isArray(value) ? value[0] : value;
                                            const num = typeof raw === "number" ? raw : Number(raw ?? 0);
                                            return formatCurrency(num);
                                        }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="value"
                                        stroke="#00d9ff"
                                        strokeWidth={3}
                                        dot={false}
                                        isAnimationActive={true}
                                    />
                                </LineChart>
                            </ResponsiveContainer>

                    )
                }
                
                </  Card>

                <motion.div variants={itemVariants}>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="bg-zinc-900 border border-zinc-800 shadow-lg w-fit mb-6 gap-x-8 mx-2">
                            <TabsTrigger
                                value="positions"
                                className="data-[state=active]:bg-zinc-800 data-[state=active]:text-cyan-400 data-[state=active]:shadow-lg font-semibold text-gray-300"
                            >
                                Positions
                            </TabsTrigger>
                            <TabsTrigger
                                value="activity"
                                className="data-[state=active]:bg-zinc-800 data-[state=active]:text-cyan-400 data-[state=active]:shadow-lg font-semibold text-gray-300"
                            >
                                Activity 
                            </TabsTrigger>
                            <TabsTrigger
                                value="analytics"
                                className="data-[state=active]:bg-zinc-800 data-[state=active]:text-cyan-400 data-[state=active]:shadow-lg font-semibold text-gray-300"
                            >
                                Analytics
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="positions" className="space-y-4" ref={loadMoreOpenRef}>
                            {/* Position Filters */}
                            <div className="flex flex-wrap gap-2 p-1 bg-zinc-900/40 rounded-lg border border-zinc-800 w-fit">

                                <Button
                                    variant={positionFilter === 'open' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => handleFilterChange('open')}

                                    className={`flex items-center gap-2 ${positionFilter === 'open'
                                        ? 'bg-cyan-600 hover:bg-cyan-700 text-white'
                                        : 'text-gray-400 hover:text-white hover:bg-zinc-800'
                                        }`}
                                >
                                
                                    Open
                                  
                                </Button>

                                <Button
                                    variant={positionFilter === 'closed' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => handleFilterChange('closed')}
                                    className={`flex items-center gap-2 ${positionFilter === 'closed'
                                        ? 'bg-cyan-600 hover:bg-cyan-700 text-white'
                                        : 'text-gray-400 hover:text-white hover:bg-zinc-800'
                                        }`}
                                >
                                 
                                    Closed
                                  
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
                                    <div className="hidden md:grid md:grid-cols-12 gap-4  px-6 py-4 text-sm text-gray-400 font-semibold border-b border-zinc-800 bg-zinc-900/50 rounded-t-lg">
                                        {
                                            positionFilter == "open" ? (
                                                <>
                                                    <div className="col-span-8">MARKET</div>
                                                    <div className="col-span-1 text-center">AVG</div>
                                                    <div className="col-span-1 text-center">CURRENT</div>
                                                    <div className="col-span-1 text-right">VALUE</div>
                                                </>
                                            ) : positionFilter === "closed" ? (
                                                <>
                                                    <div className="col-span-8">MARKET</div>
                                                    <div className="col-span-2 text-center">TOTAL BET</div>
                                                    <div className="col-span-2 text-center">AMOUNT</div>
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
                                                isPositionCardOpen={isPositionCardOpen}
                                                setIsPositionCardOpen={setIsPositionCardOpen}
                                                selectedPosition={selectedPosition}
                                                handleCreatePositionCard={handleCreatePositionCard}

                                            />
                                        ))}
                                    </motion.div>

                                        {/* Load More Trigger for OPEN positions */}
                                        {positionFilter === 'open' && hasMoreOpen && (
                                            <div ref={loadMoreOpenRef} className="py-8 text-center">
                                                {loadingMore ? (
                                                    <div className="flex items-center justify-center gap-2">
                                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-500" />
                                                        <span className="text-gray-400">Loading more open positions...</span>
                                                    </div>
                                                ) : (
                                                 <div className="flex flex-col items-center justify-center">
                                                            <span className="text-gray-500 text-sm">Scroll for more</span>
                                                            <Button onClick={loadMoreOpenPositions} className="w-fit">
                                                                Click to load more </Button>
                                                 </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Load More Trigger for CLOSED positions */}
                                        {positionFilter === 'closed' && hasMoreClosed && (
                                            <div ref={loadMoreClosedRef} className="py-8 text-center">
                                                {loadingMore ? (
                                                    <div className="flex items-center justify-center gap-2">
                                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-500" />
                                                        <span className="text-gray-400">Loading more closed positions...</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-500 text-sm">Scroll for more</span>
                                                )}
                                            </div>
                                        )}
                               
                                </>
                            )}
                        </TabsContent>

                        <TabsContent value="activity" className="space-y-4" ref={loadMoreActivityRef}>
                            <div>
                                <div className="space-y-4">
                                    {activity && activity.length === 0 ? (
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
                                        <>
                                            <div className="space-y-3">
                                                {activity && activity.map((item: any, index: number) => {
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

                                                {/* 🔥 FIXED INFINITE SCROLL TRIGGER */}
                                                {hasMoreActivity && (
                                                    <div ref={loadMoreActivityRef} className="py-8 text-center mt-4">
                                                        {loadingMore ? (
                                                            <div className="flex items-center justify-center gap-2">
                                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-500" />
                                                                <span className="text-gray-400">Loading more activity...</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-500 text-sm">Scroll for more</span>
                                                        )}
                                                    </div>
                                                )}

                                        </>
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

                                            <div className="mb-8">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Sparkles className="h-5 w-5 text-cyan-500" />
                                                    <h1 className="text-3xl font-bold text-white">Enhanced Analytics</h1>
                                                </div>
                                                <p className="text-muted-foreground">Comprehensive trading performance insights</p>
                                            </div>

                                            {/* TOP METRICS ROW */}
                                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-1 lg:grid-cols-3">
                                                {/* Win Rate */}
                                                <Card className=" bg-gradient-to-br from-emerald-500/5 to-transparent backdrop-blur-l border border-emerald-500/20 hover:border-emerald-500/40 transition-all">
                                                    <CardContent className="p-6">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-xs text-gray-400 uppercase tracking-wider">Win Rate</span>
                                                            <Award className="h-4 w-4 text-emerald-500" />
                                                        </div>
                                                        <p className="text-3xl font-bold text-white mb-1">
                                                            {analytics.overview.averageWinRate.toFixed(1)}%
                                                        </p>
                                                        <p className="text-xs text-gray-400">
                                                            {analytics.performanceMetrics.totalWins}W / {analytics.performanceMetrics.totalLosses}L
                                                        </p>
                                                    </CardContent>
                                                </Card>

                                                {/* Best Day */}
                                                <Card className=" bg-gradient-to-br from-emerald-500/5 to-transparent backdrop-blur-l border border-emerald-500/20 hover:border-emerald-500/40 transition-all">
                                                    <CardContent className="p-6">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-xs text-gray-400 uppercase tracking-wider">Best Day</span>
                                                            <TrendingUp className="h-4 w-4 text-emerald-500" />
                                                        </div>
                                                        <p className="text-2xl font-bold text-emerald-400 mb-1">
                                                            +{formatCurrency(analytics.overview.bestDay.profit)}
                                                        </p>
                                                        <p className="text-xs text-gray-400">{analytics.overview.bestDay.date}</p>
                                                    </CardContent>
                                                </Card>

                                                {/* Current Streak */}
                                                <Card className={` bg-gradient-to-br from-emerald-500/5 to-transparent backdrop-blur-l border transition-all ${analytics.performanceMetrics.currentStreak.type === 'win'
                                                        ? 'border-emerald-500/20 hover:border-emerald-500/40'
                                                        : 'border-red-500/20 hover:border-red-500/40'
                                                    }`}>
                                                    <CardContent className="p-6">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-xs text-gray-400 uppercase tracking-wider">Current Streak</span>
                                                            {analytics.performanceMetrics.currentStreak.type === 'win' ? (
                                                                <span className="text-2xl">🔥</span>
                                                            ) : (
                                                                <TrendingDown className="h-4 w-4 text-red-500" />
                                                            )}
                                                        </div>
                                                        <p className={`text-2xl font-bold mb-1 ${analytics.performanceMetrics.currentStreak.type === 'win'
                                                                ? 'text-emerald-400'
                                                                : 'text-red-400'
                                                            }`}>
                                                            {analytics.performanceMetrics.currentStreak.count}{' '}
                                                            {analytics.performanceMetrics.currentStreak.type === 'win' ? 'Wins' : 'Losses'}
                                                        </p>
                                                        <p className="text-xs text-gray-400">
                                                            Best: {analytics.performanceMetrics.longestWinStreak} wins
                                                        </p>
                                                    </CardContent>
                                                </Card>
                                            </div>

                                            {/* TRADING ACTIVITY HEATMAP */}
                                            <TradingActivityHeatmap
                                                hourlyActivity={analytics.tradingPatterns.hourlyActivity}
                                                mostActiveHour={analytics.tradingPatterns.mostActiveHour}
                                            />


                                            {/* POSITION HEALTH & WIN/LOSS COMPARISON */}
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                {/* Open Positions Health */}
                                                <Card className="bg-gradient-to-br from-emerald-500/5 to-transparent backdrop-blur-lg border border-cyan-500/20">
                                                    <CardHeader>
                                                        <CardTitle className="flex items-center gap-2">
                                                            <Target className="h-5 w-5 text-cyan-500" />
                                                            Open Positions Health
                                                        </CardTitle>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <div className="space-y-4">
                                                            <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10">
                                                                <span className="text-emerald-400 font-medium">● Profitable</span>
                                                                <span className="text-xl font-bold text-white">
                                                                    {analytics.positionAnalysis.openPositions.profitable}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/10">
                                                                <span className="text-red-400 font-medium">● Losing</span>
                                                                <span className="text-xl font-bold text-white">
                                                                    {analytics.positionAnalysis.openPositions.losing}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-500/10">
                                                                <span className="text-gray-400 font-medium">● Break-even</span>
                                                                <span className="text-xl font-bold text-white">
                                                                    {analytics.positionAnalysis.openPositions.breakeven}
                                                                </span>
                                                            </div>

                                                            <div className="pt-4 border-t border-gray-700">
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-gray-400">Unrealized P&L</span>
                                                                    <span className={`text-xl font-bold ${analytics.positionAnalysis.openPositions.totalUnrealizedPnl >= 0
                                                                            ? 'text-emerald-400'
                                                                            : 'text-red-400'
                                                                        }`}>
                                                                        {formatCurrency(analytics.positionAnalysis.openPositions.totalUnrealizedPnl)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>

                                                {/* Win vs Loss Comparison */}
                                                <Card className=" bg-gradient-to-br from-emerald-500/5 to-transparent backdrop-blur-l border border-amber-500/20">
                                                    <CardHeader>
                                                        <CardTitle className="flex items-center gap-2">
                                                            <BarChart3 className="h-5 w-5 text-amber-500" />
                                                            Win vs Loss Analysis
                                                        </CardTitle>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <div className="space-y-6">
                                                            <div>
                                                                <div className="flex justify-between mb-2">
                                                                    <span className="text-sm text-gray-400">Average Win</span>
                                                                    <span className="text-sm font-bold text-emerald-400">
                                                                        {formatCurrency(analytics.performanceMetrics.avgWinAmount)}
                                                                    </span>
                                                                </div>
                                                                <div className="h-8 bg-gray-800 rounded-full overflow-hidden">
                                                                    <div
                                                                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 flex items-center justify-center"
                                                                        style={{
                                                                            width: `${Math.min(
                                                                                (analytics.performanceMetrics.avgWinAmount /
                                                                                    (analytics.performanceMetrics.avgWinAmount + analytics.performanceMetrics.avgLossAmount)) * 100,
                                                                                100
                                                                            )}%`
                                                                        }}
                                                                    >
                                                                        <span className="text-xs font-semibold text-white">
                                                                            {formatCurrency(analytics.performanceMetrics.avgWinAmount)}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div>
                                                                <div className="flex justify-between mb-2">
                                                                    <span className="text-sm text-gray-400">Average Loss</span>
                                                                    <span className="text-sm font-bold text-red-400">
                                                                        {formatCurrency(analytics.performanceMetrics.avgLossAmount)}
                                                                    </span>
                                                                </div>
                                                                <div className="h-8 bg-gray-800 rounded-full overflow-hidden">
                                                                    <div
                                                                        className="h-full bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center"
                                                                        style={{
                                                                            width: `${Math.min(
                                                                                (analytics.performanceMetrics.avgLossAmount /
                                                                                    (analytics.performanceMetrics.avgWinAmount + analytics.performanceMetrics.avgLossAmount)) * 100,
                                                                                100
                                                                            )}%`
                                                                        }}
                                                                    >
                                                                        <span className="text-xs font-semibold text-white">
                                                                            {formatCurrency(analytics.performanceMetrics.avgLossAmount)}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="pt-4 border-t border-gray-700">
                                                                <div className="flex justify-between">
                                                                    <span className="text-gray-400">Win/Loss Ratio</span>
                                                                    <span className="text-xl font-bold text-cyan-400">
                                                                        {(analytics.performanceMetrics.avgWinAmount /
                                                                            Math.max(analytics.performanceMetrics.avgLossAmount, 1)).toFixed(2)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </div>
                                            <div className="space-y-8">



                                                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                                                    {/* Profit Trend */}
                                                    <div className="rounded-xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-transparent backdrop-blur-lg p-6 transition-all hover:border-cyan-500/40">
                                                        <div className="mb-4 flex items-center justify-between">
                                                            <div>
                                                                <h3 className="font-bold text-white text-lg">Profit Trend</h3>
                                                                <p className="text-xs text-muted-foreground mt-0.5">Monthly performance overview</p>
                                                            </div>
                                                            <div className="h-8 w-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                                                                <TrendingUp className="h-4 w-4 text-cyan-500" />
                                                            </div>
                                                        </div>
                                                        <ChartContainer config={{ profit: { label: "Profit", color: CYAN } }} className="h-[280px]">
                                                            <ResponsiveContainer width="100%" height="100%">
                                                                <AreaChart data={analytics.performanceData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                                                    <defs>
                                                                        <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                                                                            <stop offset="5%" stopColor={CYAN} stopOpacity={0.4} />
                                                                            <stop offset="95%" stopColor={CYAN} stopOpacity={0} />
                                                                        </linearGradient>
                                                                    </defs>
                                                                    <CartesianGrid strokeDasharray="3 3" stroke="rgb(15 23 42 / 0.5)" vertical={false} />
                                                                    <XAxis dataKey="month" stroke="rgb(100 116 139)" style={{ fontSize: "12px" }} />
                                                                    <YAxis stroke="rgb(100 116 139)" style={{ fontSize: "12px" }} />
                                                                    <ChartTooltip content={<ChartTooltipContent />} />
                                                                    <Area type="monotone" dataKey="profit" stroke={CYAN} strokeWidth={3} fill="url(#profitGrad)" />
                                                                </AreaChart>
                                                            </ResponsiveContainer>
                                                        </ChartContainer>
                                                    </div>

                                                    {/* Trading Volume */}
                                                    {/* <div className="rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent backdrop-blur-lg p-6 transition-all hover:border-purple-500/40">
                                                        <div className="mb-4 flex items-center justify-between">
                                                            <div>
                                                                <h3 className="font-bold text-white text-lg">Market Distribution</h3>
                                                                <p className="text-xs text-muted-foreground mt-0.5">Trading breakdown by market</p>
                                                            </div>
                                                            <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                                                <Activity className="h-4 w-4 text-purple-500" />
                                                            </div>
                                                        </div>
                                                        <div className="space-y-4">
                                                            {analytics.marketDistribution.map((market: { market: string; value: number; trades: number }, index: number) => (
                                                                <div key={market.market} className="space-y-1.5">
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="text-sm font-medium text-white">{market.market}</span>
                                                                        <span className="text-sm font-bold text-cyan-500">{market.value}%</span>
                                                                    </div>
                                                                    <div className="h-2 rounded-full bg-white/5 overflow-hidden border border-white/10">
                                                                        <div
                                                                            className="h-full rounded-full transition-all duration-500"
                                                                            style={{ width: `${market.value}%`, backgroundColor: COLORS[index % COLORS.length] }}
                                                                        />
                                                                    </div>
                                                                    <p className="text-xs text-muted-foreground">{market.trades} trades</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div> */}
                                                    {/* <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent backdrop-blur-lg p-6 transition-all hover:border-emerald-500/40">
                                                        <div className="mb-4 flex items-center justify-between">
                                                            <div>
                                                                <h3 className="font-bold text-white text-lg">Trading Volume</h3>
                                                                <p className="text-xs text-muted-foreground mt-0.5">Monthly transaction volume</p>
                                                            </div>
                                                            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                                                <BarChart3 className="h-4 w-4 text-emerald-500" />
                                                            </div>
                                                        </div>
                                                        <ChartContainer config={{ volume: { label: "Volume", color: "#10b981" } }} className="h-[280px]">
                                                            <ResponsiveContainer width="100%" height="100%">
                                                                <BarChart data={analytics.performanceData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                                                    <CartesianGrid strokeDasharray="3 3" stroke="rgb(15 23 42 / 0.5)" vertical={false} />
                                                                    <XAxis dataKey="month" stroke="rgb(100 116 139)" style={{ fontSize: "12px" }} />
                                                                    <YAxis stroke="rgb(100 116 139)" style={{ fontSize: "12px" }} />
                                                                    <ChartTooltip content={<ChartTooltipContent />} />
                                                                    <Bar dataKey="volume" fill="#10b981" radius={[8, 8, 0, 0]} />
                                                                </BarChart>
                                                            </ResponsiveContainer>
                                                        </ChartContainer>
                                                    </div> */}

                                                    <div className="rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent backdrop-blur-lg p-6 transition-all hover:border-amber-500/40">
                                                        <div className="mb-4 flex items-center justify-between">
                                                            <div>
                                                                <h3 className="font-bold text-white text-lg">Win Rate Trend</h3>
                                                                <p className="text-xs text-muted-foreground mt-0.5">Weekly success rate</p>
                                                            </div>
                                                            <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                                                <Target className="h-4 w-4 text-amber-500" />
                                                            </div>
                                                        </div>
                                                        <ChartContainer
                                                            config={{
                                                                winRate: { label: "Win Rate %", color: "#f59e0b" },
                                                                totalTrades: { label: "Total Trades", color: "#6366f1" }
                                                            }}
                                                            className="h-[280px]"
                                                        >
                                                            <ResponsiveContainer width="100%" height="100%">
                                                                <BarChart
                                                                    data={analytics.winRateData}
                                                                    margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                                                                >
                                                                    <CartesianGrid
                                                                        strokeDasharray="3 3"
                                                                        stroke="rgb(15 23 42 / 0.5)"
                                                                        vertical={false}
                                                                    />
                                                                    <XAxis
                                                                        dataKey="week"
                                                                        stroke="rgb(100 116 139)"
                                                                        style={{ fontSize: "12px" }}
                                                                    />
                                                                    <YAxis
                                                                        domain={[0, 100]}
                                                                        stroke="rgb(100 116 139)"
                                                                        style={{ fontSize: "12px" }}
                                                                    />
                                                                    <ChartTooltip
                                                                        content={<ChartTooltipContent />}
                                                                    />
                                                                    <Bar
                                                                        dataKey="winRate"
                                                                        fill="#f59e0b"
                                                                        radius={[4, 4, 0, 0]}
                                                                        maxBarSize={40}
                                                                    />
                                                                </BarChart>
                                                            </ResponsiveContainer>
                                                        </ChartContainer>
                                                    </div>
                                                </div>


                                                {/* Secondary Grid */}
                                                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

                                                    {/* <div className="rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent backdrop-blur-lg p-6 transition-all hover:border-amber-500/40">
                                                        <div className="mb-4 flex items-center justify-between">
                                                            <div>
                                                                <h3 className="font-bold text-white text-lg">Win Rate Trend</h3>
                                                                <p className="text-xs text-muted-foreground mt-0.5">Weekly success rate</p>
                                                            </div>
                                                            <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                                                <Target className="h-4 w-4 text-amber-500" />
                                                            </div>
                                                        </div>
                                                        <ChartContainer config={{ winRate: { label: "Win Rate %", color: "#f59e0b" } }} className="h-[280px]">
                                                            <ResponsiveContainer width="100%" height="100%">
                                                                <LineChart data={analytics.winRateData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                                                    <CartesianGrid strokeDasharray="3 3" stroke="rgb(15 23 42 / 0.5)" vertical={false} />
                                                                    <XAxis dataKey="week" stroke="rgb(100 116 139)" style={{ fontSize: "12px" }} />
                                                                    <YAxis domain={[0, 100]} stroke="rgb(100 116 139)" style={{ fontSize: "12px" }} />
                                                                    <ChartTooltip content={<ChartTooltipContent />} />
                                                                    <Line
                                                                        type="monotone"
                                                                        dataKey="winRate"
                                                                        stroke="#f59e0b"
                                                                        strokeWidth={3}
                                                                        dot={{ fill: "#f59e0b", r: 5 }}
                                                                        activeDot={{ r: 7 }}
                                                                    />
                                                                </LineChart>
                                                            </ResponsiveContainer>
                                                        </ChartContainer>
                                                    </div> */}

{/* 
                                                    <div className="rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent backdrop-blur-lg p-6 transition-all hover:border-purple-500/40">
                                                        <div className="mb-4 flex items-center justify-between">
                                                            <div>
                                                                <h3 className="font-bold text-white text-lg">Market Distribution</h3>
                                                                <p className="text-xs text-muted-foreground mt-0.5">Trading breakdown by market</p>
                                                            </div>
                                                            <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                                                <Activity className="h-4 w-4 text-purple-500" />
                                                            </div>
                                                        </div>
                                                        <div className="space-y-4">
                                                            {analytics.marketDistribution.map((market: { market: string; value: number; trades: number }, index: number) => (
                                                                <div key={market.market} className="space-y-1.5">
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="text-sm font-medium text-white">{market.market}</span>
                                                                        <span className="text-sm font-bold text-cyan-500">{market.value}%</span>
                                                                    </div>
                                                                    <div className="h-2 rounded-full bg-white/5 overflow-hidden border border-white/10">
                                                                        <div
                                                                            className="h-full rounded-full transition-all duration-500"
                                                                            style={{ width: `${market.value}%`, backgroundColor: COLORS[index % COLORS.length] }}
                                                                        />
                                                                    </div>
                                                                    <p className="text-xs text-muted-foreground">{market.trades} trades</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div> */}
                                                </div>

                                                {/* Bottom Grid */}
                                                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                                                    {/* Buy/Sell Distribution */}
                                                    <div className="rounded-xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-transparent backdrop-blur-lg p-6 transition-all hover:border-cyan-500/40">
                                                        <div className="mb-4">
                                                            <h3 className="font-bold text-white text-lg">Buy/Sell Distribution</h3>
                                                            <p className="text-xs text-muted-foreground mt-0.5">Order composition analysis</p>
                                                        </div>
                                                        <div className="space-y-5">
                                                            <div>
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <span className="text-sm text-muted-foreground font-medium">Buy Orders</span>
                                                                    <span className="text-sm font-bold text-emerald-500">
                                                                        {analytics.buySellDistribution.buyPercentage}%
                                                                    </span>
                                                                </div>
                                                                <div className="h-2.5 rounded-full bg-white/5 overflow-hidden border border-white/10">
                                                                    <div
                                                                        className="h-full rounded-full bg-emerald-500 transition-all"
                                                                        style={{ width: `${analytics.buySellDistribution.buyPercentage}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <span className="text-sm text-muted-foreground font-medium">Sell Orders</span>
                                                                    <span className="text-sm font-bold text-red-500">{analytics.buySellDistribution.sellPercentage}%</span>
                                                                </div>
                                                                <div className="h-2.5 rounded-full bg-white/5 overflow-hidden border border-white/10">
                                                                    <div
                                                                        className="h-full rounded-full bg-red-500 transition-all"
                                                                        style={{ width: `${analytics.buySellDistribution.sellPercentage}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="border-t border-cyan-500/20 pt-5 mt-5">
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4">
                                                                        <p className="text-xs text-muted-foreground font-medium">Buy Volume</p>
                                                                        <p className="text-lg font-bold text-emerald-500 mt-2">
                                                                            ${(analytics.buySellDistribution.buyVolume / 1000).toFixed(1)}k
                                                                        </p>
                                                                    </div>
                                                                    <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4">
                                                                        <p className="text-xs text-muted-foreground font-medium">Sell Volume</p>
                                                                        <p className="text-lg font-bold text-red-500 mt-2">
                                                                            ${(analytics.buySellDistribution.sellVolume / 1000).toFixed(1)}k
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Trade Size Analysis */}
                                                    <div className="rounded-xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-transparent backdrop-blur-lg p-6 transition-all hover:border-cyan-500/40">
                                                        <div className="mb-4">
                                                            <h3 className="font-bold text-white text-lg">Trade Size Analysis</h3>
                                                            <p className="text-xs text-muted-foreground mt-0.5">Distribution by transaction size</p>
                                                        </div>
                                                        <div className="space-y-5">
                                                            <div className="grid grid-cols-2 gap-3">
                                                                <div className="rounded-lg bg-cyan-500/10 border border-cyan-500/20 p-4">
                                                                    <p className="text-xs text-muted-foreground font-medium">Average Size</p>
                                                                    <p className="text-lg font-bold text-cyan-500 mt-2">
                                                                        ${analytics.tradeSizeDistribution.averageSize.toLocaleString()}
                                                                    </p>
                                                                </div>
                                                                <div className="rounded-lg bg-cyan-500/10 border border-cyan-500/20 p-4">
                                                                    <p className="text-xs text-muted-foreground font-medium">Median Size</p>
                                                                    <p className="text-lg font-bold text-cyan-500 mt-2">
                                                                        ${analytics.tradeSizeDistribution.medianSize.toLocaleString()}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="border-t border-cyan-500/20 pt-5 space-y-3">
                                                                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                                                                    <span className="text-sm text-muted-foreground">Small {"<"}$100</span>
                                                                    <span className="text-sm font-bold text-cyan-500">{analytics.tradeSizeDistribution.smallTrades}</span>
                                                                </div>
                                                                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                                                                    <span className="text-sm text-muted-foreground">Medium $100-$1k</span>
                                                                    <span className="text-sm font-bold text-cyan-500">{analytics.tradeSizeDistribution.mediumTrades}</span>
                                                                </div>
                                                                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                                                                    <span className="text-sm text-muted-foreground">Large {">"}$1k</span>
                                                                    <span className="text-sm font-bold text-cyan-500">{analytics.tradeSizeDistribution.largeTrades}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
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

                {/* <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    <Card className="bg-zinc-900/60 border border-zinc-800 backdrop-blur-xl">
                        <CardContent className="p-6">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-emerald-400" />
                                Performance Summary
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400 text-sm">Avg Win Rate</span>
                                    <span className="text-white font-semibold">
                                        {
                                            analytics.overview ? `${analytics.overview.averageWinRate}%` : 'N/A'
                                        }
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400 text-sm">Avg Monthly Profit</span>
                                    {analytics.overview ? (
                                        <span className="text-white font-semibold">
                                            {formatCurrency(analytics.overview.avgMonthlyProfit)}
                                        </span>
                                    ) : (
                                        <span className="text-white font-semibold">N/A</span>
                                    )}
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400 text-sm">Total Volume</span>
                                    <span className="text-emerald-400 font-semibold">
                                        {
                                            formatCurrency(analytics.overview ? analytics.overview.totalVolume : 0)
                                        }
                                    </span>
                                </div>

                            </div>
                        </CardContent>
                    </Card>


                    <Card className="bg-zinc-900/60 border border-zinc-800 backdrop-blur-xl">
                        <CardContent className="p-6">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <Activity className="h-5 w-5 text-emerald-400" />
                                Trading Activity
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400 text-sm">Total Trades</span>
                                    <span className="text-white font-semibold">{analytics.overview.totalTrades}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400 text-sm">Buy Orders</span>
                                    <span className="text-emerald-400 font-semibold">
                                        {analytics.buySellDistribution.buyCount}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400 text-sm">Sell Orders</span>
                                    <span className="text-red-400 font-semibold">
                                        {analytics.buySellDistribution.sellCount}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400 text-sm">Avg. Trade Size</span>
                                    <span className="text-white font-semibold">
                                        {formatCurrency(analytics.tradeSizeDistribution.averageSize)}

                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div> */}
            </main>

        </div>
    )
}