"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Volume2, Clock, CheckCircle } from "lucide-react"
import { Market, MarketSlug } from "@/types/market"
import useMarketSelectionStore from "@/store/marketSelectionStore"
import { cn } from "@/lib/utils"
import { TradingChart } from "./trading-chart"

type Props = {
  markets: MarketSlug[]
}

export function SubMarketTable({ markets }: Props) {
  const [localSelectedId, setLocalSelectedId] = useState<string | null>(null)
  
  // Global state management
  const { 
    selectedMarket, 
    selectMarket, 
    clearSelectedMarket,
    isLoadingMarket 
  } = useMarketSelectionStore()

  // i want to extract clob ids from market clobTokenIds field

  // e.g : "clobTokenIds": '['123', '456']'
    const clobIds = JSON.parse(markets?.[0]?.clobTokenIds || "[]") as string[];



  const formatVolume = (volume: string | number | undefined) => {
    const num = Number.parseInt(String(volume || "0"))
    if (Number.isNaN(num)) return "$0"
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(1)}M`
    }
    if (num >= 1000) {
      return `$${(num / 1000).toFixed(0)}K`
    }
    return `$${num}`
  }

  const formatPercentage = (price: string | number) => {
    const p = Number.parseFloat(String(price || 0))
    if (Number.isNaN(p)) return "0%"
    return `${(p * 100).toFixed(0)}%`
  }

  const getPriceChange = (market: MarketSlug) => {
    // Mock price change calculation
    const change = Math.random() * 10 - 5
    return change
  }

  // helper: safely parse outcome prices to [yes, no] as numbers
  const parsePrices = (market: Market | MarketSlug) => {
    const raw = market.outcomePrices ?? (market as any).outcomes ?? "[]"
    try {
      if (Array.isArray(raw)) {
        const y = Number.parseFloat(String(raw[0] ?? NaN))
        const n = Number.parseFloat(String(raw[1] ?? NaN))
        return { yes: y, no: n }
      }
      const parsed = JSON.parse(String(raw))
      if (Array.isArray(parsed)) {
        const y = Number.parseFloat(String(parsed[0] ?? NaN))
        const n = Number.parseFloat(String(parsed[1] ?? NaN))
        return { yes: y, no: n }
      }
    } catch {
      // fallthrough to fallback parsing
    }
    // fallback: try splitting by comma
    const maybe = String(raw).split(",").map(s => s.replace(/[\[\]\s"']+/g, ""))
    const y = Number.parseFloat(String(maybe[0] ?? NaN))
    const n = Number.parseFloat(String(maybe[1] ?? NaN))
    return { yes: y, no: n }
  }

  // Build the filtered + sorted markets (useMemo for perf)
  const sortedMarkets = useMemo(() => {
    const filtered = (markets || []).filter((market) => {
      // keep markets with some meaningful volume (numeric)
      return Number(market.volume) > 0
    })

    const withMeta = filtered.map(m => {
      const { yes, no } = parsePrices(m)
      const yesNum = Number.isFinite(yes) ? yes : NaN
      const noNum = Number.isFinite(no) ? no : NaN
      // extreme if exactly 0 or 1 (100%) or missing/NaN
      const isExtreme = !Number.isFinite(yesNum) || yesNum === 0 || yesNum === 1
      // distance to 50% (0.5) — lower = more balanced
      const distanceToMiddle = Number.isFinite(yesNum) ? Math.abs(yesNum - 0.5) : Number.POSITIVE_INFINITY

      return { market: m, yes: yesNum, no: noNum, isExtreme, distanceToMiddle }
    })

    // sort: non-extreme first, then by closeness to 50% (ascending)
    withMeta.sort((a, b) => {
      if (a.isExtreme !== b.isExtreme) return a.isExtreme ? 1 : -1
      // tie-breaker: higher liquidity/volume first for similarly-balanced markets
      const d = a.distanceToMiddle - b.distanceToMiddle
      if (d !== 0) return d
      // fallback: sort by liquidity desc
      const la = Number(a.market.liquidity || 0)
      const lb = Number(b.market.liquidity || 0)
      return lb - la
    })

    return withMeta.map(x => x.market)
  }, [markets])

  // Handle market selection
  const handleMarketClick = (market: MarketSlug) => {
    const isCurrentlySelected = selectedMarket?.id === market.id
    
    if (isCurrentlySelected) {
      // Deselect if clicking the same market
      clearSelectedMarket()
      setLocalSelectedId(null)
    } else {
      // Select new market
      selectMarket(market)
      setLocalSelectedId(market.id)
    }
  }

  return (
    <div className="space-y-3">
      {sortedMarkets.map((market) => {
        const prices = (() => {
          try {
            return JSON.parse(market.outcomePrices || "[]") as string[]
          } catch {
            const s = String(market.outcomePrices || "[]").replace(/[\[\]\s"']+/g, "")
            return s.split(",").filter(Boolean)
          }
        })()
        const yesPrice = Number.parseFloat(prices[0] ?? "0")
        const noPrice = Number.parseFloat(prices[1] ?? "0")
        const priceChange = getPriceChange(market)
        const isSelected = selectedMarket?.id === market.id
        const isExpanded = localSelectedId === market.id

        return (
          <Card
            key={market.id}
            className={cn(

              "transition-all duration-300 cursor-pointer py-4 rounded-md mx-4 sm:mx-0",
              isSelected && "ring-0.5 bg-blue-500/5",
              isLoadingMarket && selectedMarket?.id === market.id && "opacity-50"
            )}
            onClick={() => handleMarketClick(market)}
          >
            <div className="px-3">
              {/* Selected indicator */}
              {isSelected && (
                <div className="flex items-center gap-2 mb-3 text-blue-500">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Selected for Trading</span>
                </div>
              )}
              
              <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                <div className="">
                  <div className="flex items-start gap-3">
                    <img
                      src={market.image || "/placeholder.svg"}
                      alt="Market"
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-700 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold text-base sm:text-lg leading-tight text-balance">
                        {market.question}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs bg-gray-700 text-gray-300">
                          {market.category}
                        </Badge>
                        {isSelected && (
                          <Badge className="text-xs bg-blue-500 text-white">
                            Trading Active
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-400 mt-3">
                    <div className="flex items-center gap-1">
                      <Volume2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>{formatVolume(String(market.volume))} Vol.</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>Ends {new Date(market.endDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-row items-center gap-4 sm:gap-6">
                  <div className="text-center sm:flex-shrink-0">
                    <div className="text-3xl sm:text-4xl font-bold text-white mb-1">{formatPercentage(prices[0] ?? "0")}</div>
                    <div className="text-xs sm:text-sm text-gray-400 mb-2">Chance</div>
                    <div
                      className={`flex items-center justify-center gap-1 text-xs sm:text-sm ${
                        priceChange >= 0 ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {priceChange >= 0 ? (
                        <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                      ) : (
                        <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4" />
                      )}
                      <span>{Math.abs(priceChange).toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full sm:flex-1">
                    <Button
                      className={cn(
                        "flex-1 font-medium py-5 px-3 rounded-md transition-all duration-200 hover:shadow-lg",
                        isSelected 
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white border-2 border-emerald-400"
                          : "bg-emerald-500 hover:bg-emerald-600 text-white border border-emerald-400/20"
                      )}
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        // Optional: directly select and navigate to buy
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
                        "flex-1 font-medium py-5 px-3 rounded-md transition-all duration-200 hover:shadow-lg",
                        isSelected 
                          ? "bg-rose-600 hover:bg-rose-700 text-white border-2 border-rose-400"
                          : "bg-rose-500 hover:bg-rose-600 text-white border border-rose-400/20"
                      )}
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        // Optional: directly select and navigate to sell
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
              {isExpanded && (
                <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-700">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 text-xs sm:text-sm">
                    <div>
                      <h4 className="text-white font-semibold mb-2">Market Details</h4>
                      <div className="space-y-1 text-gray-400">
                        <div>Liquidity: {formatVolume(String(market.liquidity))}</div>
                        <div>24h Volume: {formatVolume(String(market.volume24hr))}</div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-white font-semibold mb-2">Resolution</h4>
                      <div className="space-y-1 text-gray-400">
                        <div>End Date: {new Date(market.endDate).toLocaleString()}</div>
                        <div>Status: {market.active ? "Active" : "Inactive"}</div>
                      </div>
                    </div>
                    {isSelected && (
                      <div>
                        <h4 className="text-white font-semibold mb-2">Trading Options</h4>
                        <div className="space-y-2">
                          <Button
                            size="sm"
                            className="w-full bg-blue-500 hover:bg-blue-600"
                            onClick={(e) => {
                              e.stopPropagation()
                              console.log('Navigate to trading panel')
                            }}
                          >
                            Go to Trading Panel →
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <TradingChart marketId={market.id} conditionId={market.conditionId} yesId={clobIds[0]} noId={clobIds[1]}  />
                  </div>
                </div>
              )}
            </div>
          </Card>
        )
      })}
    </div>
  )
}