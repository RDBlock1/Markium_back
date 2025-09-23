"use client"

import { useMemo, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Market, MarketSlug } from "@/types/market"
import useMarketSelectionStore from "@/store/marketSelectionStore"
import { cn } from "@/lib/utils"
import { PolymarketEvent } from "@/types"

type Props = { 
  slug: string
  fallbackMarkets?: MarketSlug[]
  compact?: boolean // New prop for table-friendly layout
}

export function SubMarketProbability({ slug, fallbackMarkets, compact = false }: Props) {
  const [marketData, setMarketData] = useState<PolymarketEvent | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    selectedMarket,
    selectMarket,
  } = useMarketSelectionStore()

  // Fetch market data when slug changes
  useEffect(() => {
    const fetchMarketData = async () => {
      if (!slug || fallbackMarkets) return
      
      setIsLoading(true)
      setError(null)
      
      try {
        const response = await fetch('/api/market-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug })
        })

        const result = await response.json()

        if (response.status === 429) {
          const retryAfter = result.retryAfter || 60
          setError(`Rate limited. Retrying in ${retryAfter}s...`)
          
          // Retry after the specified time
          setTimeout(() => {
            fetchMarketData()
          }, retryAfter * 1000)
          return
        }

        if (!response.ok) {
          throw new Error(`Failed to fetch market data: ${response.status}`)
        }
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch market data')
        }

        setMarketData(result.data)
      } catch (err) {
        console.error('Error fetching market data:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setIsLoading(false)
      }
    }

    fetchMarketData()
  }, [slug, fallbackMarkets])

  const markets = useMemo(() => {
    if (fallbackMarkets) return fallbackMarkets
    return marketData?.markets || []
  }, [marketData, fallbackMarkets])

  const parsePrices = (market: Market | MarketSlug) => {
    const raw = (market as any).outcomePrices ?? (market as any).outcomes ?? "[]"
    try {
      if (Array.isArray(raw)) {
        return { yes: Number.parseFloat(String(raw[0] ?? 0)), no: Number.parseFloat(String(raw[1] ?? 0)) }
      }
      const parsed = JSON.parse(String(raw))
      if (Array.isArray(parsed)) {
        return { yes: Number.parseFloat(String(parsed[0] ?? 0)), no: Number.parseFloat(String(parsed[1] ?? 0)) }
      }
    } catch {
      // continue to fallback
    }
    const cleaned = String(raw).replace(/[\[\]\s"']+/g, "").split(",").filter(Boolean)
    return {
      yes: Number.parseFloat(cleaned[0] ?? "0"),
      no: Number.parseFloat(cleaned[1] ?? "0")
    }
  }

  const safeVolumeNumber = (m: MarketSlug) => {
    const v = m.volume ?? m.liquidity ?? 0
    const num = Number.parseFloat(String(v || "0"))
    return Number.isFinite(num) ? num : 0
  }

  const sortedMarkets = useMemo(() => {
    const filtered = (markets || []).filter(Boolean)

    const withMeta = filtered.map(m => {
      const { yes, no } = parsePrices(m)
      const yesNum = Number.isFinite(yes) ? yes : NaN
      const isExtreme = !Number.isFinite(yesNum) || yesNum === 0 || yesNum === 1
      const distanceToMiddle = Number.isFinite(yesNum) ? Math.abs(yesNum - 0.5) : Number.POSITIVE_INFINITY
      return { market: m, yes: yesNum, no: no, isExtreme, distanceToMiddle, liquidity: safeVolumeNumber(m) }
    })

    withMeta.sort((a, b) => {
      if (a.isExtreme !== b.isExtreme) return a.isExtreme ? 1 : -1
      const d = a.distanceToMiddle - b.distanceToMiddle
      if (d !== 0) return d
      return b.liquidity - a.liquidity
    })

    // Limit to top 4 markets to reduce API calls and rate limiting
    return withMeta.slice(0, 4).map(x => x.market)
  }, [markets])

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
        Loading...
      </div>
    )
  }

  if (error) {
    return <div className="text-xs text-red-500">Error loading data</div>
  }

  if (!sortedMarkets || sortedMarkets.length === 0) {
    return <div className="text-xs text-muted-foreground">No submarkets</div>
  }

  // Compact layout for table
  if (compact) {
    return (
      <div className="space-y-2 max-w-[200px]">
        {sortedMarkets.slice(0, 3).map((market) => {
          const parsed = parsePrices(market)
          const yesPrice = Number.isFinite(parsed.yes) ? parsed.yes : 0
          const yesPercentage = yesPrice * 100
          const isSelected = selectedMarket?.id === market.id

          return (
            <div key={market.id} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="truncate max-w-[120px]" title={market.question || market.slug}>
                  {(market.question || market.slug || "Market")?.substring(0, 20)}...
                </span>
                <span className="font-medium text-emerald-600">
                  {yesPercentage.toFixed(0)}%
                </span>
              </div>
              <Progress 
                value={yesPercentage} 
                className="h-2"
                onClick={() => selectMarket(market)}
                style={{ cursor: 'pointer' }}
              />
              <div className="flex justify-between text-xs gap-1">
                <Button
                  size="sm"
                  className={cn(
                    "h-6 px-2 text-xs",
                    isSelected 
                      ? "bg-emerald-600 text-white"
                      : "bg-emerald-500 text-white hover:bg-emerald-600"
                  )}
                  onClick={(e) => {
                    e.stopPropagation()
                    selectMarket(market)
                  }}
                >
                  YES {yesPercentage.toFixed(0)}¢
                </Button>
                <Button
                  size="sm"
                  className={cn(
                    "h-6 px-2 text-xs",
                    isSelected 
                      ? "bg-rose-600 text-white"
                      : "bg-rose-500 text-white hover:bg-rose-600"
                  )}
                  onClick={(e) => {
                    e.stopPropagation()
                    selectMarket(market)
                  }}
                >
                  NO {((1 - yesPrice) * 100).toFixed(0)}¢
                </Button>
              </div>
            </div>
          )
        })}
        {/* Show remaining count based on actual markets length, not limited sortedMarkets */}
        {markets.length > 3 && (
          <div className="text-xs text-muted-foreground text-center py-1">
            +{markets.length - 3} more markets
          </div>
        )}
      </div>
    )
  }

  // Original full layout
  return (
    <div className="space-y-3">
      {sortedMarkets.map((market) => {
        const parsed = parsePrices(market)
        const yesPrice = Number.isFinite(parsed.yes) ? parsed.yes : 0
        const noPrice = Number.isFinite(parsed.no) ? parsed.no : 0
        const isSelected = selectedMarket?.id === market.id

        return (
          <div key={market.id} className="border rounded-lg p-3">
            <div className="grid md:grid-cols-2 gap-2 w-full">
              <div className="flex items-center gap-4">
                <div className="flex gap-2 flex-1">
                  <Button
                    className={cn(
                      "flex-1 font-medium py-5 px-3 rounded-md transition-all duration-200 hover:shadow",
                      isSelected 
                        ? "bg-emerald-600 text-white border-2 border-emerald-400"
                        : "bg-emerald-500 text-white border border-emerald-400/20"
                    )}
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      selectMarket(market)
                    }}
                  >
                    <div className="text-center">
                      <div className="text-xs font-medium">YES</div>
                      <div className="text-sm font-bold">{(yesPrice * 100).toFixed(0)}¢</div>
                    </div>
                  </Button>

                  <Button
                    className={cn(
                      "flex-1 font-medium py-5 px-3 rounded-md transition-all duration-200 hover:shadow",
                      isSelected 
                        ? "bg-rose-600 text-white border-2 border-rose-400"
                        : "bg-rose-500 text-white border border-rose-400/20"
                    )}
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      selectMarket(market)
                    }}
                  >
                    <div className="text-center">
                      <div className="text-xs font-medium">NO</div>
                      <div className="text-sm font-bold">{(noPrice * 100).toFixed(0)}¢</div>
                    </div>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}