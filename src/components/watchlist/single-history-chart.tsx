/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/purity */
"use client"
import React, { useState, useEffect, useRef } from "react"
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

// TypeScript interfaces
interface PricePoint {
    t: number // Unix timestamp in seconds
    p: number // Price (0-1)
}

interface PriceHistoryResponse {
    history: PricePoint[]
}

interface ClobSingleHistoryChartProps {
    clobId: string
    marketName?: string
    startTs?: number
    chance: string
    color?: string
    isWatchlistCard: boolean
}

// Chart configuration for shadcn/ui
const chartConfig = {
    price: {
        label: "Price",
        color: "hsl(var(--chart-1))",
    },
} satisfies ChartConfig

// Custom tooltip component
const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload
        const price = payload[0].value
        const date = new Date(data.date)

        return (
            <div className="rounded-lg border bg-background p-2 shadow-sm">
                <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                            Date
                        </span>
                        <span className="font-bold text-muted-foreground">
                            {date.toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric"
                            })}
                        </span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                            Price
                        </span>
                        <span className="font-bold">
                            {price?.toFixed(2)}%
                        </span>
                    </div>
                </div>
            </div>
        )
    }
    return null
}

export default function ClobSingleHistoryChart({
    clobId,
    marketName,
    startTs,
    chance,
    isWatchlistCard,
    color = "#FF7A00"
}: ClobSingleHistoryChartProps) {
    const [priceHistory, setPriceHistory] = useState<PricePoint[]>([])
    const [chartData, setChartData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [stats, setStats] = useState({ current: 0, change: 0, isPositive: false, high: 0, low: 100 })
    const abortControllerRef = useRef<AbortController | null>(null)

    // Fetch price history
    const fetchPriceHistory = async (signal: AbortSignal) => {
        try {
            const now = Math.floor(Date.now() / 1000)

            const oneHundredTwentyDaysAgo = now - (120 * 24 * 60 * 60)
            const effectiveStartTs = !startTs || startTs > now ? oneHundredTwentyDaysAgo : startTs

            const url = `https://clob.polymarket.com/prices-history?startTs=${effectiveStartTs}&market=${clobId}&fidelity=720`
            const response = await fetch(url, { signal })

            if (!response.ok) {
                console.warn(`API failed for ${clobId}, generating mock data`)
                return generateMockData()
            }

            const data: PriceHistoryResponse = await response.json()
            console.log(`Fetched data:`, data)

            if (data && Array.isArray(data.history) && data.history.length > 0) {
                const validHistory = data.history.filter(point =>
                    point &&
                    typeof point.t === 'number' &&
                    typeof point.p === 'number' &&
                    !isNaN(point.t) &&
                    !isNaN(point.p)
                )

                if (validHistory.length > 0) {
                    return validHistory
                }
            }

            return generateMockData()
        } catch (err) {
            if (err instanceof Error && err.name === "AbortError") {
                return null
            }
            console.warn(`Error fetching ${clobId}, using mock data:`, err)
            return generateMockData()
        }
    }
    const formatPercentage = (price: string | number) => {
        const p = Number.parseFloat(String(price || 0))
        if (Number.isNaN(p)) return "0%"
        return `${(p * 100).toFixed(0)}%`
    }
    // Generate mock data for demo
    const generateMockData = (): PricePoint[] => {
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

        return history
    }

    const processChartData = (history: PricePoint[]) => {
        if (!history || history.length === 0) return []

        return history.map(point => ({
            timestamp: point.t,
            date: point.t * 1000, // Convert to milliseconds for X axis
            price: point.p * 100 // Convert to percentage (0-100)
        }))
    }

    // Calculate stats
    const calculateStats = (history: PricePoint[]) => {
        if (!history || history.length === 0) {
            return { current: 0, change: 0, isPositive: false, high: 0, low: 100 }
        }

        const prices = history.map(p => p.p * 100)
        const current = prices[prices.length - 1]
        const weekAgo = prices[Math.max(0, prices.length - 7)]
        const change = current - weekAgo
        const high = Math.max(...prices)
        const low = Math.min(...prices)

        return {
            current,
            change,
            isPositive: change >= 0,
            high,
            low
        }
    }

    // Fetch data on mount
    useEffect(() => {
        const fetchData = async () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort()
            }

            abortControllerRef.current = new AbortController()
            const signal = abortControllerRef.current.signal

            setLoading(true)
            setError(null)

            try {
                const history = await fetchPriceHistory(signal)

                if (history) {
                    setPriceHistory(history)
                    const processed = processChartData(history)
                    setChartData(processed)
                    setStats(calculateStats(history))
                    setLoading(false)
                }
            } catch (err) {
                if (err instanceof Error && err.name !== "AbortError") {
                    setError(`Failed to fetch market data: ${err.message}`)
                    setLoading(false)
                }
            }
        }

        if (clobId) {
            fetchData()
        } else {
            setLoading(false)
            setError("No market ID provided")
        }

        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort()
            }
        }
    }, [clobId, startTs])

    // Show loading state
    if (loading) {
        return (
            <Card className="w-full">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Loading Market Data...
                    </CardTitle>
                    <CardDescription>
                        Fetching price history for {marketName}
                    </CardDescription>
                </CardHeader>
                <CardContent className="px-2 pt-6 sm:p-6">
                    <div className="w-full bg-muted/30 rounded-lg flex flex-col items-center justify-center h-[400px]">
                        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                        <p className="text-sm text-muted-foreground">Fetching price history...</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    // Show error state
    if (error || !chartData || chartData.length === 0) {
        return (
            <Card className="w-full">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        {marketName}
                    </CardTitle>
                    <CardDescription>Unable to load market data</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center h-[400px]">
                        <div className="text-center">
                            <p className="text-muted-foreground mb-2">
                                {error || "No market data available to display"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Please check your connection and try again
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    // Show chart
    return (
        <Card className="w-full">
        {
            isWatchlistCard?null :(
                    <CardHeader className="pb-0">
                        <div className="flex items-start justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5" />
                                    {marketName}
                                </CardTitle>
                                <CardDescription>
                                    Price history over the last {chartData.length} data points
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="text-right">
                                    <div className="text-2xl font-bold">{chance}</div>
                                    <div className={`flex items-center gap-1 text-sm ${stats.isPositive ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                        {stats.isPositive ? (
                                            <TrendingUp className="h-3 w-3" />
                                        ) : (
                                            <TrendingDown className="h-3 w-3" />
                                        )}
                                        <span>{stats.isPositive ? '+' : ''}{stats.change.toFixed(1)}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 mt-4 pt-4 border-t">
                            <div className="flex-1">
                                <div className="text-sm text-muted-foreground">High</div>
                                <div className="text-lg font-semibold">{stats.high.toFixed(1)}%</div>
                            </div>
                            <div className="flex-1">
                                <div className="text-sm text-muted-foreground">Low</div>
                                <div className="text-lg font-semibold">{stats.low.toFixed(1)}%</div>
                            </div>
                            <div className="flex-1">
                                <div className="text-sm text-muted-foreground">Range</div>
                                <div className="text-lg font-semibold">{(stats.high - stats.low).toFixed(1)}%</div>
                            </div>
                        </div>
                    </CardHeader>
            )
        }

            <CardContent className="px-2 pt-6 sm:p-6">
                <ChartContainer
                    config={chartConfig}
                    className="aspect-auto h-[400px] w-full"
                >
                    <LineChart
                        accessibilityLayer
                        data={chartData}
                        margin={{
                            left: 12,
                            right: 12,
                            top: 12,
                            bottom: 12,
                        }}
                    >
                        <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                            dataKey="date"
                            type="number"
                            domain={['dataMin', 'dataMax']}
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            minTickGap={32}
                            tickFormatter={(value) => {
                                const date = new Date(Number(value))
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
                            content={<CustomTooltip />}
                            cursor={{ strokeDasharray: '3 3' }}
                        />
                        <Line
                            strokeWidth={2}
                            dataKey="price"
                            stroke={color}
                            type="monotone"
                            dot={false}
                            connectNulls={true}
                        />
                    </LineChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}