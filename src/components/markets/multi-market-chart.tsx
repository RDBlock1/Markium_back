/* eslint-disable react-hooks/purity */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import React, { useState, useEffect, useRef, useMemo } from "react"
import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts"
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
import { TrendingUp, TrendingDown, BarChart3, Loader2 } from "lucide-react"
import { CustomTooltip } from "@/components/ui/custom-tooltip"
import Image from "next/image"
import { MarketSlug } from "@/types/market"

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
    startTs?: number,
    top4MarketsData?: MarketSlug[]
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
    market3: {
        label: "Market 3",
        color: "var(--chart-3)",
    },
    market4: {
        label: "Market 4",
        color: "var(--chart-4)",
    },
} satisfies ChartConfig

// Default colors for the markets
const DEFAULT_COLORS = ["#FF7A00", "#5DA8FF", "#2E9AFA", "#F2C94C"]

// Fallback names if none provided
const FALLBACK_NAMES = [
    "Market 1",
    "Market 2",
    "Market 3",
    "Market 4"
]

export default function MultiHistoryChart({
    clobIds,
    marketNames = FALLBACK_NAMES,  // Use fallback if not provided
    startTs,
    top4MarketsData
}: ClobMultiHistoryChartProps) {
    const [marketData, setMarketData] = useState<MarketData[]>([])
    const [chartData, setChartData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [dataReady, setDataReady] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [activeChart, setActiveChart] = useState<string>("market1")
    const [timeRange, setTimeRange] = useState<TimeRange>('ALL')
    const abortControllerRef = useRef<AbortController | null>(null)

    // Fetch price history for a single market
    const fetchMarketHistory = async (clobId: string, signal: AbortSignal): Promise<MarketData | null> => {
        try {
            const now = Math.floor(Date.now() / 1000)
            const thirtyDaysAgo = now - (30 * 24 * 60 * 60)
            const effectiveStartTs = !startTs || startTs > now ? thirtyDaysAgo : startTs

            const url = `https://clob.polymarket.com/prices-history?startTs=${effectiveStartTs}&market=${clobId}&fidelity=720`
            const response = await fetch(url, { signal })

            if (!response.ok) {
                console.warn(`API failed for ${clobId}, generating mock data`)
                return generateMockData(clobId)
            }

            const data: PriceHistoryResponse = await response.json()
            console.log(`Fetched ${clobId} data:`, data)

            if (data && Array.isArray(data.history) && data.history.length > 0) {
                const validHistory = data.history.filter(point =>
                    point &&
                    typeof point.t === 'number' &&
                    typeof point.p === 'number' &&
                    !isNaN(point.t) &&
                    !isNaN(point.p)
                )

                if (validHistory.length > 0) {
                    const index = clobIds.indexOf(clobId)
                    const color = DEFAULT_COLORS[index % DEFAULT_COLORS.length]
                    const name = marketNames[index] || FALLBACK_NAMES[index] || `Market ${index + 1}`

                    return {
                        clobId,
                        history: validHistory,
                        color,
                        name,
                    }
                }
            }

            return generateMockData(clobId)
        } catch (err) {
            if (err instanceof Error && err.name === "AbortError") {
                return null
            }
            console.warn(`Error fetching ${clobId}, using mock data:`, err)
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

        const index = clobIds.indexOf(clobId)
        const color = DEFAULT_COLORS[index % DEFAULT_COLORS.length]
        const name = marketNames[index] || FALLBACK_NAMES[index] || `Market ${index + 1}`

        return {
            clobId,
            history,
            color,
            name,
        }
    }

    const processChartData = (markets: MarketData[]) => {
        if (!markets || markets.length === 0) return []

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

        // forward-fill: last known price (in percent)
        const lastKnown: (number | null)[] = markets.map(() => null)

        return sortedTimestamps.map((timestampSec) => {
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
            if (abortControllerRef.current) {
                abortControllerRef.current.abort()
            }

            abortControllerRef.current = new AbortController()
            const signal = abortControllerRef.current.signal

            setLoading(true)
            setDataReady(false)
            setError(null)
            setMarketData([])
            setChartData([])

            try {
                const promises = clobIds.map(clobId => fetchMarketHistory(clobId, signal))
                const results = await Promise.all(promises)

                const validMarkets = results
                    .filter((market): market is MarketData => market !== null && market.history && market.history.length > 0)
                    .slice(0, 4)

                if (validMarkets.length === 0) {
                    setError("No valid market data available")
                    setLoading(false)
                } else {
                    // Process chart data
                    const processedData = processChartData(validMarkets)

                    // Update all states together
                    setMarketData(validMarkets)
                    setChartData(processedData)
                    setActiveChart("market1")

                    // Wait a tick to ensure state updates are processed
                    setTimeout(() => {
                        setDataReady(true)
                        setLoading(false)
                    }, 0)
                }
            } catch (err) {
                if (err instanceof Error && err.name !== "AbortError") {
                    setError(`Failed to fetch market data: ${err.message}`)
                    setLoading(false)
                }
            }
        }

        if (clobIds && clobIds.length > 0) {
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
    }, [clobIds, marketNames, startTs])

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
    if (loading || !dataReady) {
        return (
            <Card className="w-full bg-black">
                <CardHeader className="flex flex-col items-stretch border-b p-0 sm:flex-row">
                    <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
                        <CardTitle className="flex items-center gap-2">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Loading Market Data...
                        </CardTitle>
                        <CardDescription>
                            Fetching {clobIds?.length || 0} markets from Polymarket
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="px-2 pt-6 sm:p-6">
                    <div className="w-full bg-muted/30 rounded-lg flex flex-col items-center justify-center h-[400px]">
                        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                        <p className="text-sm text-muted-foreground mb-2">Fetching price history...</p>
                        <div className="flex gap-2 mt-4">
                            {[...Array(Math.min(4, clobIds?.length || 0))].map((_, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-muted-foreground/30 animate-pulse" />
                                    <div className="h-4 w-20 bg-muted-foreground/20 rounded animate-pulse" />
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    // Show error state if no data
    // if (error || !marketData || marketData.length === 0 || !chartData || chartData.length === 0) {
    //     return (
    //         <Card className="w-full">
    //             <CardHeader>
    //                 <CardTitle className="flex items-center gap-2">
    //                     <BarChart3 className="h-5 w-5" />
    //                     Market Analysis
    //                 </CardTitle>
    //                 <CardDescription>Unable to load market data</CardDescription>
    //             </CardHeader>
    //             <CardContent>
    //                 <div className="flex items-center justify-center h-[400px]">
    //                     <div className="text-center">
    //                         <p className="text-muted-foreground mb-2">
    //                             {error || "No market data available to display"}
    //                         </p>
    //                         <p className="text-sm text-muted-foreground">
    //                             Please check your connection and try again
    //                         </p>
    //                     </div>
    //                 </div>
    //             </CardContent>
    //         </Card>
    //     )
    // }

    // Show chart when data is ready
    return (
        <div className="w-full space-y-6">
            <Card className="py-4 sm:py-0 bg-transparent border-none">
                <CardHeader className="flex flex-col items-stretch border-b !p-0 sm:flex-row">

                    <div className="hidden sm:flex mx-3">
                        {marketData.map((market, index) => {
                            const marketKey = `market${index + 1}`
                            const stats = getMarketStats(market)
                            const isActive = activeChart === marketKey

                            return (
                                <button
                                    key={marketKey}
                                    data-active={isActive}
                                    className="data-[active=true]:bg-muted/50 flex flex-1 flex-col justify-center gap-1 border-t px-4 py-4 text-left even:border-l sm:border-t-0 sm:border-l sm:px-6 sm:py-2 mt-4 hover:bg-muted/30 transition-colors"
                                    onClick={() => setActiveChart(marketKey)}
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <div
                                            className="w-2 h-2 rounded-full"
                                            style={{ backgroundColor: market.color }}
                                        />
                                        <span className="text-muted-foreground text-xs truncate max-w-[150px]" title={market.name}>
                                            {market.name}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg leading-none font-bold sm:text-2xl">
                                            {Math.round(stats.current)}%
                                        </span>
                                        <div className={`flex items-center gap-1 text-xs ${stats.isPositive ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                            {stats.isPositive ? (
                                                <TrendingUp className="h-3 w-3" />
                                            ) : (
                                                <TrendingDown className="h-3 w-3" />
                                            )}
                                            {stats.isPositive ? '+' : ''}{stats.change.toFixed(1)}%
                                        </div>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </CardHeader>
                <CardContent className="px-2 sm:p-6">
                    {/* Time Range Filter Buttons */}
                    <div className="flex justify-end gap-2 mb-4">
                        {(['1D', '1W', '1M', 'ALL'] as TimeRange[]).map((range) => {
                            const isAvailable = isTimeRangeAvailable(range)
                            const isActive = timeRange === range

                            return (
                                <button
                                    key={range}
                                    onClick={() => isAvailable && setTimeRange(range)}
                                    disabled={!isAvailable}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${isActive
                                            ? 'bg-primary text-primary-foreground'
                                            : isAvailable
                                                ? 'bg-muted hover:bg-muted/80 text-muted-foreground'
                                                : 'bg-muted/50 text-muted-foreground/50 cursor-not-allowed'
                                        }`}
                                    title={!isAvailable ? 'Not enough historical data' : ''}
                                >
                                    {range}
                                </button>
                            )
                        })}
                    </div>

                    {/* Watermark */}
                    <div className="absolute top-20 md:top-0 md:-translate-x-20  inset-0 flex items-center justify-center pointer-events-none z-0">
                        <Image
                            src="/markium.jpg"
                            alt="Markium Watermark"
                            width={300}
                            height={300}
                            className="opacity-15"
                            priority
                        />
                    </div>

                    <ChartContainer
                        config={chartConfig}
                        className="aspect-auto h-[400px] w-full relative"
                    >
                     

                        <LineChart
                            accessibilityLayer
                            data={filteredChartData}
                            margin={{
                                left: 12,
                                right: 12,
                                top: 12,
                                bottom: 12,
                            }}
                        >
                            <CartesianGrid vertical={false} className="stroke-muted" />
                            <XAxis
                                dataKey="date"
                                type="number"
                                domain={['dataMin', 'dataMax']}
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                minTickGap={timeRange === '1D' ? 10 : 32}
                                interval={timeRange === '1D' ? 'preserveStartEnd' : 'preserveStartEnd'}
                                ticks={timeRange === '1D' && filteredChartData.length > 0 ? (() => {
                                    const minTime = filteredChartData[0]?.date
                                    const maxTime = filteredChartData[filteredChartData.length - 1]?.date
                                    if (!minTime || !maxTime) return undefined

                                    // Find the start of the day for the earliest data point
                                    const startDate = new Date(minTime)
                                    startDate.setHours(0, 0, 0, 0)
                                    let startTimestamp = startDate.getTime()

                                    // If data starts after midnight, use the actual start time's hour rounded down
                                    const startHour = new Date(minTime).getHours()
                                    startTimestamp = startDate.getTime() + (Math.floor(startHour / 3) * 3 * 60 * 60 * 1000)

                                    // Generate ticks every 3 hours within the data range
                                    const ticks = []
                                    let currentTime = startTimestamp

                                    while (currentTime <= maxTime) {
                                        if (currentTime >= minTime) {
                                            ticks.push(currentTime)
                                        }
                                        currentTime += (3 * 60 * 60 * 1000) // Add 3 hours
                                    }

                                    // Always include the last data point if it's not already included
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
                            />
                            <YAxis
                                domain={[0, 100]}
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                tickFormatter={(value) => `${value}%`}
                                className="text-xs fill-muted-foreground"
                            />
                            <Tooltip
                                content={<CustomTooltip marketData={marketData} />}
                                cursor={{ strokeDasharray: '3 3' }}
                            />


                            {/* Render all lines with different opacities */}
                            {marketData.map((market, index) => {
                                const marketKey = `market${index + 1}`
                                const isActive = activeChart === marketKey

                                return (
                                    <Line
                                        key={marketKey}
                                        strokeWidth={isActive ? 3 : 2}
                                        dataKey={marketKey}
                                        stroke={market.color}
                                        type="monotone"
                                        dot={timeRange === '1D' ? { r: 3, fill: market.color, strokeWidth: 2, stroke: '#fff' } : false}
                                        connectNulls={true}
                                        opacity={isActive ? 1 : 1}
                                    />
                                )
                            })}
                        </LineChart>
                    </ChartContainer>
                </CardContent>
            </Card>
        </div>
    )
}