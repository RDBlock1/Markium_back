/* eslint-disable react-hooks/purity */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import React, { useState, useEffect, useRef, useMemo } from "react"
import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis, ResponsiveContainer } from "recharts"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartConfig,
    ChartContainer,

} from "@/components/ui/chart"
import { TrendingUp, TrendingDown, Loader2 } from "lucide-react"
import { CustomTooltip } from "@/components/ui/custom-tooltip"
import Image from "next/image"

// TypeScript interfaces
interface PricePoint {
    t: number // Unix timestamp in seconds
    p: number // Price (0-1)
}

interface PriceHistoryResponse {
    history: PricePoint[]
}

interface MarketData {
    clobId: string
    history: PricePoint[]
    color: string
    name: string
}

interface ClobMultiHistoryChartProps {
    clobIds: string[]
    marketNames?: string[]  // Made optional with fallback
    startTs?: number
}

type TimeRange = '1D' | '1W' | '1M' | 'ALL'

// Chart configuration for shadcn/ui
const chartConfig = {
    views: {
        label: "Market Price",
    },
    market1: {
        label: "Market 1",
        color: "var(--chart-1)",
    },
    market2: {
        label: "Market 2",
        color: "var(--chart-2)",
    },
} satisfies ChartConfig

// Default colors for the markets (limit to 2)
const DEFAULT_COLORS = ["#10b981", "#ef4444"]

// Fallback names if none provided
const FALLBACK_NAMES = [
    "Yes",
    "No"
]

export default function MultiHistoryChart({
    clobIds,
    marketNames = FALLBACK_NAMES,
    startTs
}: ClobMultiHistoryChartProps) {
    const [marketData, setMarketData] = useState<MarketData[]>([])
    const [chartData, setChartData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [activeChart, setActiveChart] = useState<string>("market1")
    const [timeRange, setTimeRange] = useState<TimeRange>('ALL')
    const abortControllerRef = useRef<AbortController | null>(null)

    // Limit to 2 markets
    const limitedClobIds = useMemo(() => clobIds.slice(0, 2), [clobIds])
    const limitedMarketNames = useMemo(() => marketNames.slice(0, 2), [marketNames])

    // Fetch price history for a single market
    const fetchMarketHistory = async (clobId: string, signal: AbortSignal): Promise<MarketData | null> => {
        try {
            const now = Math.floor(Date.now() / 1000)
            const thirtyDaysAgo = now - (30 * 24 * 60 * 60)
            const effectiveStartTs = !startTs || startTs > now ? thirtyDaysAgo : startTs

            const url = `https://clob.polymarket.com/prices-history?startTs=${effectiveStartTs}&market=${clobId}&fidelity=720`

            console.log(`Fetching data for ${clobId} from:`, url)
            const response = await fetch(url, { signal })

            if (!response.ok) {
                console.warn(`API failed for ${clobId} with status ${response.status}`)
                return generateMockData(clobId)
            }

            const data: PriceHistoryResponse = await response.json()
            console.log(`Fetched ${clobId} data points:`, data.history?.length || 0)

            if (data && Array.isArray(data.history) && data.history.length > 0) {
                const validHistory = data.history.filter(point =>
                    point &&
                    typeof point.t === 'number' &&
                    typeof point.p === 'number' &&
                    !isNaN(point.t) &&
                    !isNaN(point.p)
                )

                console.log(`Valid data points for ${clobId}:`, validHistory.length)

                if (validHistory.length > 0) {
                    const index = limitedClobIds.indexOf(clobId)
                    const color = DEFAULT_COLORS[index % DEFAULT_COLORS.length]
                    const name = limitedMarketNames[index] || FALLBACK_NAMES[index] || `Market ${index + 1}`

                    return {
                        clobId,
                        history: validHistory,
                        color,
                        name,
                    }
                }
            }

            console.warn(`No valid history for ${clobId}, using mock data`)
            return generateMockData(clobId)
        } catch (err) {
            if (err instanceof Error && err.name === "AbortError") {
                console.log(`Fetch aborted for ${clobId}`)
                return null
            }
            console.error(`Error fetching ${clobId}:`, err)
            return generateMockData(clobId)
        }
    }

    // Generate mock data for demo
    const generateMockData = (clobId: string): MarketData => {
        const now = Date.now()
        const days = 90
        const history: PricePoint[] = []

        let price = 0.3 + Math.random() * 0.4

        for (let i = days; i >= 0; i--) {
            const timestamp = Math.floor((now - (i * 24 * 60 * 60 * 1000)) / 1000)

            const change = (Math.random() - 0.5) * 0.1
            price = Math.max(0.05, Math.min(0.95, price + change))

            history.push({
                t: timestamp,
                p: price
            })
        }

        const index = limitedClobIds.indexOf(clobId)
        const color = DEFAULT_COLORS[index % DEFAULT_COLORS.length]
        const name = limitedMarketNames[index] || FALLBACK_NAMES[index] || `Market ${index + 1}`

        return {
            clobId,
            history,
            color,
            name,
        }
    }

    const processChartData = (markets: MarketData[]) => {
        if (!markets || markets.length === 0) {
            console.log('No markets to process')
            return []
        }

        console.log('Processing chart data for markets:', markets.map(m => m.clobId))

        // Build map for each market for O(1) lookups (key = seconds)
        const marketMaps = markets.map((m) => {
            const map = new Map<number, number>()
            m.history.forEach((pt) => {
                if (pt && typeof pt.t === "number" && typeof pt.p === "number") {
                    map.set(pt.t, pt.p * 100) // convert to percentage (0-100)
                }
            })
            return map
        })

        // collect all seconds-based timestamps (seconds)
        const allTimestamps = new Set<number>()
        markets.forEach((market) => {
            market.history.forEach((pt) => {
                if (pt && typeof pt.t === "number") allTimestamps.add(pt.t)
            })
        })

        const sortedTimestamps = Array.from(allTimestamps).sort((a, b) => a - b)
        console.log('Total unique timestamps:', sortedTimestamps.length)

        // forward-fill: last known price (in percent)
        const lastKnown: (number | null)[] = markets.map(() => null)

        const processedData = sortedTimestamps.map((timestampSec) => {
            const dataPoint: any = {
                timestamp: timestampSec,
                date: timestampSec * 1000, // numeric ms value for X axis
            }

            markets.forEach((market, index) => {
                const map = marketMaps[index]
                if (map.has(timestampSec)) {
                    lastKnown[index] = map.get(timestampSec) ?? null
                }
                // Use lastKnown value (may be null until first seen)
                dataPoint[`market${index + 1}`] = lastKnown[index]
            })

            return dataPoint
        })

        console.log('Processed data points:', processedData.length)
        return processedData
    }

    // Filter chart data based on selected time range
    const filteredChartData = useMemo(() => {
        if (!chartData || chartData.length === 0) return []

        const now = Date.now()
        let cutoffTime: number

        switch (timeRange) {
            case '1D':
                cutoffTime = now - (24 * 60 * 60 * 1000)
                break
            case '1W':
                cutoffTime = now - (7 * 24 * 60 * 60 * 1000)
                break
            case '1M':
                cutoffTime = now - (30 * 24 * 60 * 60 * 1000)
                break
            case 'ALL':
            default:
                return chartData
        }

        const filtered = chartData.filter(point => point.date >= cutoffTime)

        // If no data in this range (market created recently), return all available data
        return filtered.length > 0 ? filtered : chartData
    }, [chartData, timeRange])

    // Get the oldest timestamp available in the data
    const oldestTimestamp = useMemo(() => {
        if (!chartData || chartData.length === 0) return Date.now()
        return chartData[0]?.date || Date.now()
    }, [chartData])

    // Check if a time range button should be disabled (market too new)
    const isTimeRangeAvailable = (range: TimeRange): boolean => {
        if (range === 'ALL') return true

        const now = Date.now()
        let requiredAge: number

        switch (range) {
            case '1D':
                requiredAge = 24 * 60 * 60 * 1000
                break
            case '1W':
                requiredAge = 7 * 24 * 60 * 60 * 1000
                break
            case '1M':
                requiredAge = 30 * 24 * 60 * 60 * 1000
                break
            default:
                return true
        }

        return (now - oldestTimestamp) >= requiredAge
    }

    // Fetch all markets
    useEffect(() => {
        const fetchAllMarkets = async () => {
            // Cancel any ongoing fetch
            if (abortControllerRef.current) {
                abortControllerRef.current.abort()
            }

            abortControllerRef.current = new AbortController()
            const signal = abortControllerRef.current.signal

            console.log('Starting fetch for clob IDs:', limitedClobIds)

            setLoading(true)
            setError(null)

            try {
                const promises = limitedClobIds.map(clobId => fetchMarketHistory(clobId, signal))
                const results = await Promise.all(promises)

                console.log('Fetch results:', results.map(r => r ? `${r.clobId}: ${r.history.length} points` : 'null'))

                const validMarkets = results.filter((market): market is MarketData =>
                    market !== null && market.history && market.history.length > 0
                )

                console.log('Valid markets:', validMarkets.length)

                if (validMarkets.length === 0) {
                    setError("No valid market data available")
                    setMarketData([])
                    setChartData([])
                    setLoading(false)
                    return
                }

                // Process chart data
                const processedData = processChartData(validMarkets)

                if (processedData.length === 0) {
                    setError("Failed to process market data")
                    setMarketData([])
                    setChartData([])
                    setLoading(false)
                    return
                }

                // Update states
                console.log('Setting market data and chart data')
                setMarketData(validMarkets)
                setChartData(processedData)
                setActiveChart("market1")
                setLoading(false)

            } catch (err) {
                if (err instanceof Error && err.name !== "AbortError") {
                    console.error('Fetch error:', err)
                    setError(`Failed to fetch market data: ${err.message}`)
                    setLoading(false)
                }
            }
        }

        if (limitedClobIds && limitedClobIds.length > 0) {
            fetchAllMarkets()
        } else {
            setLoading(false)
            setError("No market IDs provided")
        }

        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort()
            }
        }
    }, [limitedClobIds.join(','), limitedMarketNames.join(','), startTs])

    // Calculate market stats based on filtered data
    const getMarketStats = (market: MarketData) => {
        if (!market || !market.history || market.history.length === 0) {
            return { current: 0, change: 0, isPositive: false, total: 0 }
        }

        // Use filtered data for stats calculation
        const now = Date.now() / 1000
        let cutoffTime: number

        switch (timeRange) {
            case '1D':
                cutoffTime = now - (24 * 60 * 60)
                break
            case '1W':
                cutoffTime = now - (7 * 24 * 60 * 60)
                break
            case '1M':
                cutoffTime = now - (30 * 24 * 60 * 60)
                break
            case 'ALL':
            default:
                cutoffTime = 0
        }

        const relevantHistory = market.history.filter(point => point.t >= cutoffTime)
        const historyToUse = relevantHistory.length > 0 ? relevantHistory : market.history

        const current = historyToUse[historyToUse.length - 1].p * 100
        const previous = historyToUse[0].p * 100
        const change = current - previous
        const total = historyToUse.reduce((acc, point) => acc + (point.p * 100), 0)

        return { current, change, isPositive: change >= 0, total: Math.round(total) }
    }


    // Show loading state
    if (loading) {
        return (
            <Card className="w-full border-0 shadow-lg">
                <CardHeader className="space-y-1 pb-4">
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        Loading Market Data
                    </CardTitle>
                    <CardDescription className="text-sm">
                        Fetching price history for {limitedClobIds?.length || 0} markets
                    </CardDescription>
                </CardHeader>
                <CardContent className="pb-6">
                    <div className="w-full bg-muted/30 rounded-xl flex flex-col items-center justify-center h-[450px] border border-border/50">
                        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                        <p className="text-sm text-muted-foreground mb-2 font-medium">Fetching price history...</p>
                        <div className="flex gap-3 mt-4">
                            {[...Array(Math.min(2, limitedClobIds?.length || 0))].map((_, i) => (
                                <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50">
                                    <div className="h-2 w-2 rounded-full bg-muted-foreground/30 animate-pulse" />
                                    <div className="h-3 w-16 bg-muted-foreground/20 rounded animate-pulse" />
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }



    // Show chart when data is ready
    return (
        <Card className="w-full border-0 shadow-lg overflow-hidden bg-black">
            {/* Market Stats Header */}
            <CardHeader className="pb-0 border-b border-border/50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
                    <div>
                        <CardTitle className="text-xl font-bold mb-1">Market Comparison</CardTitle>
                        <CardDescription className="text-sm">
                            Price history and trends
                        </CardDescription>
                    </div>

                    {/* Time Range Filter Buttons */}
                    <div className="flex gap-1 p-1 bg-muted/50 rounded-lg w-fit   px-1 ">
                        {(['1D', '1W', '1M', 'ALL'] as TimeRange[]).map((range) => {
                            const isAvailable = isTimeRangeAvailable(range)
                            const isActive = timeRange === range

                            return (
                                <button
                                    key={range}
                                    onClick={() => isAvailable && setTimeRange(range)}
                                    disabled={!isAvailable}
                                    className={`px-4 py-2 text-xs font-semibold rounded-md transition-all ${isActive
                                            ? 'bg-primary text-primary-foreground shadow-sm'
                                            : isAvailable
                                                ? 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                                : 'text-muted-foreground/40 cursor-not-allowed'
                                        }`}
                                    title={!isAvailable ? 'Not enough historical data' : ''}
                                >
                                    {range}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Market Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-4">
                    {marketData.map((market, index) => {
                        const marketKey = `market${index + 1}`
                        const stats = getMarketStats(market)
                        const isActive = activeChart === marketKey

                        return (
                            <button
                                key={marketKey}
                                onClick={() => setActiveChart(marketKey)}
                                className={`p-2 rounded-lg border transition-all text-left ${isActive
                                        ? 'border-primary bg-primary/5 shadow-sm'
                                        : 'border-border/50 hover:border-border hover:bg-muted/30'
                                    }`}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-2 h-2 rounded-full shadow-sm"
                                            style={{ backgroundColor: market.color }}
                                        />
                                        <span className="text-xs font-semibold text-foreground">
                                            {market.name}
                                        </span>
                                    </div>
                                    <div className={`flex items-center gap-1 px-1 py-0.5 rounded-full text-[11px] font-medium ${stats.isPositive
                                            ? 'bg-green-500/10 text-green-600 dark:text-green-500'
                                            : 'bg-red-500/10 text-red-600 dark:text-red-500'
                                        }`}>
                                        {stats.isPositive ? (
                                            <TrendingUp className="h-3 w-3" />
                                        ) : (
                                            <TrendingDown className="h-3 w-3" />
                                        )}
                                        <span>{stats.isPositive ? '+' : ''}{stats.change.toFixed(1)}%</span>
                                    </div>
                                </div>
                                <div className="text-xl font-bold text-foreground">
                                    {Math.round(stats.current)}%
                                </div>
                                <div className="text-[11px] text-muted-foreground mt-1">
                                    Current probability
                                </div>
                            </button>
                        )
                    })}
                </div>
            </CardHeader>

            <CardContent className="p-6">
                <div className="relative">
                    {/* Watermark */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                        <Image
                        src="/markium.jpg"
                        alt="Markium Watermark"
                        width={192}
                        height={192}
                        className="opacity-15 select-none user-select-none"
                        />
                    </div>

                    {/* Chart */}
                    <div className="relative z-10">
                        <ChartContainer config={chartConfig} className="h-[400px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                    data={filteredChartData}
                                    margin={{ top: 5, right: 5, left: 3, bottom: 5 }}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        vertical={false}
                                        stroke="currentColor"
                                        className="stroke-muted-foreground/20"
                                    />
                                    <XAxis
                                        dataKey="date"
                                        type="number"
                                        domain={['dataMin', 'dataMax']}
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={12}
                                        minTickGap={timeRange === '1D' ? 10 : 32}
                                        interval="preserveStartEnd"
                                        ticks={timeRange === '1D' && filteredChartData.length > 0 ? (() => {
                                            const minTime = filteredChartData[0]?.date
                                            const maxTime = filteredChartData[filteredChartData.length - 1]?.date
                                            if (!minTime || !maxTime) return undefined

                                            const startDate = new Date(minTime)
                                            startDate.setHours(0, 0, 0, 0)
                                            let startTimestamp = startDate.getTime()

                                            const startHour = new Date(minTime).getHours()
                                            startTimestamp = startDate.getTime() + (Math.floor(startHour / 3) * 3 * 60 * 60 * 1000)

                                            const ticks = []
                                            let currentTime = startTimestamp

                                            while (currentTime <= maxTime) {
                                                if (currentTime >= minTime) {
                                                    ticks.push(currentTime)
                                                }
                                                currentTime += (3 * 60 * 60 * 1000)
                                            }

                                            if (ticks.length === 0 || ticks[ticks.length - 1] < maxTime) {
                                                ticks.push(maxTime)
                                            }

                                            return ticks
                                        })() : undefined}
                                        tickFormatter={(value) => {
                                            const date = new Date(Number(value))
                                            if (timeRange === '1D') {
                                                const hours = date.getHours()
                                                const minutes = date.getMinutes()
                                                if (minutes === 0) {
                                                    return `${hours}:00`
                                                }
                                                return `${hours}:${minutes.toString().padStart(2, '0')}`
                                            }
                                            return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
                                        }}
                                        className="text-xs"
                                        stroke="currentColor"
                                    />
                                    <YAxis
                                        domain={[0, 100]}
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={12}
                                        tickFormatter={(value) => `${Math.round(value)}%`}
                                        className="text-xs"
                                        stroke="currentColor"
                                        width={45}
                                    />
                                    <Tooltip
                                        content={<CustomTooltip marketData={marketData} />}
                                        cursor={{
                                            stroke: 'currentColor',
                                            strokeWidth: 1,
                                            strokeDasharray: '5 5',
                                            className: 'stroke-muted-foreground/30'
                                        }}
                                    />

                                    {/* Render all lines */}
                                    {marketData.map((market, index) => {
                                        const marketKey = `market${index + 1}`
                                        const isActive = activeChart === marketKey

                                        return (
                                            <Line
                                                key={marketKey}
                                                strokeWidth={isActive ? 3 : 2.5}
                                                dataKey={marketKey}
                                                stroke={market.color}
                                                type="monotone"
                                                dot={timeRange === '1D' ? {
                                                    r: 4,
                                                    fill: market.color,
                                                    strokeWidth: 2,
                                                    stroke: '#fff'
                                                } : false}
                                                activeDot={{
                                                    r: 6,
                                                    fill: market.color,
                                                    strokeWidth: 2,
                                                    stroke: '#fff'
                                                }}
                                                connectNulls={true}
                                                opacity={isActive ? 1 : 0.4}
                                            />
                                        )
                                    })}
                                </LineChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}