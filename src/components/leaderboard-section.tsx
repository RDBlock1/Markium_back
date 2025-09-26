'use client';
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Clock, TrendingUp, DollarSign, Trophy, Medal, Award, Copy, ExternalLink, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import Link from "next/link"

type TimePeriod = "day" | "week" | "month" | "all" 

interface LeaderboardEntry {
  id: string
  rank: number
  username: string
  avatar: string
  walletAddress: string
  volume?: number
  profit?: number
  change?: number
}

interface LeaderboardData {
  volume: LeaderboardEntry[]
  profit: LeaderboardEntry[]
}

const formatCurrency = (amount: number): string => {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(2)}M`
  } else if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)}K`
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const formatAddress = (address: string): string => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Trophy className="h-5 w-5 text-yellow-400" />
    case 2:
      return <Medal className="h-5 w-5 text-gray-300" />
    case 3:
      return <Award className="h-5 w-5 text-amber-600" />
    default:
      return <span className="text-lg font-bold text-muted-foreground">{rank}</span>
  }
}

const getTimeRemaining = () => {
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)

  const diff = tomorrow.getTime() - now.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  return `${hours}h ${minutes}m ${seconds}s`
}

export function LeaderboardSection() {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("day")
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData>({
    volume: [],
    profit: []
  })
  const [timeRemaining, setTimeRemaining] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Timer for reset countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(getTimeRemaining())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Fetch leaderboard data
  const fetchLeaderboardData = async (period: TimePeriod, showLoadingState = true) => {
    if (showLoadingState) {
      setIsLoading(true)
    } else {
      setIsRefreshing(true)
    }
    setError(null)

    try {
      const response = await fetch(`/api/leaderboard?type=both&period=${period}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`)
      }

      const data: LeaderboardData = await response.json()
      setLeaderboardData(data)

      if (!showLoadingState) {
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch leaderboard data"
      setError(errorMessage)
      toast.error("Error",
        {
          description: errorMessage,
        })

      // Set empty data on error
      setLeaderboardData({ volume: [], profit: [] })
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  // Fetch data when period changes
  useEffect(() => {
    fetchLeaderboardData(selectedPeriod)
  }, [selectedPeriod])

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchLeaderboardData(selectedPeriod, false)
    }, 60000)

    return () => clearInterval(interval)
  }, [selectedPeriod])

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address)
    toast.success("Copied!", {
      description: "Wallet address copied to clipboard",
    })
  }

  const handleOpenPolymarket = (walletAddress: string) => {
    window.open(`https://polymarket.com/profile/${walletAddress}`, '_blank')
  }

  const handleManualRefresh = () => {
    fetchLeaderboardData(selectedPeriod, false)
  }

  const periods: { key: TimePeriod; label: string }[] = [
    { key: "day", label: "Day" },
    { key: "week", label: "Week" },
    { key: "month", label: "Month" },
    { key: "all", label: "All" },
  ]

  const LeaderboardCard = ({
    title,
    icon,
    data,
    type
  }: {
    title: string
    icon: React.ReactNode
    data: LeaderboardEntry[]
    type: 'volume' | 'profit'
  }) => (
    <Card className="glass-effect border-0 shadow-2xl">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              {icon}
            </div>
            <h2 className="text-2xl font-bold">{title}</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className={cn(isRefreshing && "animate-spin")}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        <AnimatePresence >
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-muted/20 animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-muted/40" />
                  <div className="flex-1">
                    <div className="h-4 bg-muted/40 rounded w-24 mb-2" />
                    <div className="h-3 bg-muted/30 rounded w-16" />
                  </div>
                  <div className="h-4 bg-muted/40 rounded w-20" />
                </div>
              ))}
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-8 text-muted-foreground"
            >
              <p>Failed to load data</p>
              <Button onClick={handleManualRefresh} className="mt-4" variant="outline">
                Try Again
              </Button>
            </motion.div>
          ) : data.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-8 text-muted-foreground"
            >
              No data available
            </motion.div>
          ) : (

            <motion.div
              key="data"
              className="space-y-3"
            >
              {data.map((entry, index) => (
                <motion.div
                  key={entry.id}

                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/10 transition-all duration-200 group cursor-pointer"
                >
                  <Link href={`/user-profile/${entry.walletAddress}`} className="flex items-center gap-4 w-full">
                    <div className="flex items-center justify-center w-8 h-8">
                      {getRankIcon(entry.rank)}
                    </div>

                    <Avatar
                      className="h-10 w-10 ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all cursor-pointer"
                      onClick={() => handleOpenPolymarket(entry.walletAddress)}
                    >
                      <AvatarImage src={entry.avatar || "/placeholder.svg"} alt={entry.username} />
                      <AvatarFallback>{entry.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate group-hover:text-primary transition-colors">
                        {entry.username}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground">
                          {formatAddress(entry.walletAddress)}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 p-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleCopyAddress(entry.walletAddress)
                          }}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 p-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOpenPolymarket(entry.walletAddress)
                          }}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>

                        <Button asChild className="bg-purple-500 text-white h-6 hover:bg-purple-600" onClick={(e) => e.stopPropagation()}>
                          <a
                            href={`https://polygonscan.com/address/${entry.walletAddress}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            PolygonScan
                          </a>
                        </Button>
                      </div>
                      {entry.change !== undefined && entry.change !== 0 && (
                        <Badge
                          variant={entry.change >= 0 ? "default" : "destructive"}
                          className="text-xs mt-1"
                        >
                          {entry.change >= 0 ? "+" : ""}{entry.change}%
                        </Badge>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-lg">
                        {type === 'volume'
                          ? formatCurrency(entry.volume || 0)
                          : formatCurrency(entry.profit || 0)
                        }
                      </p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </Card>
  )

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl mt-10">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
        <h1 className="text-4xl  md:text-5xl font-bold text-balance mb-4 text-emerald-400 bg-clip-text ">
          Markium Leaderboard
        </h1>

        {/* Time Period Filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {periods.map((period) => (
            <Button
              key={period.key}
              variant={selectedPeriod === period.key ? "default" : "secondary"}
              size="sm"
              onClick={() => setSelectedPeriod(period.key)}
              disabled={isLoading}
              className={cn(
                "transition-all duration-200 hover:scale-105",
                selectedPeriod === period.key && "bg-primary text-primary-foreground shadow-lg",
              )}
            >
              {period.label}
            </Button>
          ))}
        </div>

        {/* Reset Timer
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center gap-2 text-muted-foreground"
        >
          <Clock className="h-4 w-4" />
          <span className="text-sm">Resets in {timeRemaining}</span>
        </motion.div> */}
      </motion.div>

      {/* Leaderboards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Volume Leaderboard */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <LeaderboardCard
            title="Volume"
            icon={<TrendingUp className="h-6 w-6 text-primary" />}
            data={leaderboardData.volume}
            type="volume"
          />
        </motion.div>

        {/* Profit Leaderboard */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <LeaderboardCard
            title="Profit"
            icon={<DollarSign className="h-6 w-6 text-primary" />}
            data={leaderboardData.profit}
            type="profit"
          />
        </motion.div>
      </div>
    </div>
  )
}