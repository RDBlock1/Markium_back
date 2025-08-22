"use client"

import { useEffect, useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { 
  ExternalLink, 
  Copy, 
  Search,
  Filter,
  TrendingUp,
  Trophy,
  Users,
  Bitcoin,
  Sparkles,
  X
} from "lucide-react"
import { MarketSlug } from "@/types/market"
import PolymarketMiniChart from "./mini-chart"
import { formatVolume, toLocalString } from "@/utils"
import { Progress } from "../ui/progress"
import Link from "next/link"

const timeFilters = ["1m", "5m", "30m", "1h"]

// Category filters with icons
const categoryFilters = [
  { id: "all", label: "All", icon: Sparkles },
  { id: "politics", label: "Politics", icon: TrendingUp },
  { id: "sports", label: "Sports", icon: Trophy },
  { id: "pop-culture", label: "Pop Culture", icon: Users },
  { id: "crypto", label: "Crypto", icon: Bitcoin },
]

type Props = {
  marketData: MarketSlug[]
}

export default function MarketDashboard({ marketData }: Props) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [activeTimeFilter, setActiveTimeFilter] = useState("1h")
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  useEffect(() => {
    console.log("Market Data received:", marketData);
    if (marketData && marketData.length > 0) {
      console.log("First item structure:", marketData[0]);
      console.log("startDate value:", marketData[0].startDate);
      console.log("startDate type:", typeof marketData[0].startDate);
    }
  }, [marketData]);

  // Filter markets based on search and category
  const filteredMarkets = useMemo(() => {
    if (!marketData) return [];
    
    let filtered = [...marketData];
    
    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(market => 
        market.question?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        market.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        market.id?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(market => {
        // You'll need to add a category field to your MarketSlug type
        // For now, we'll use keyword matching in the question
        const question = market.question?.toLowerCase() || "";
        
        switch(selectedCategory) {
          case "politics":
            return question.includes("president") || 
                   question.includes("election") || 
                   question.includes("congress") ||
                   question.includes("senate") ||
                   question.includes("political") ||
                   question.includes("government");
          case "sports":
            return question.includes("game") || 
                   question.includes("win") || 
                   question.includes("championship") ||
                   question.includes("team") ||
                   question.includes("player") ||
                   question.includes("nfl") ||
                   question.includes("nba") ||
                   question.includes("soccer");
          case "pop-culture":
            return question.includes("movie") || 
                   question.includes("music") || 
                   question.includes("celebrity") ||
                   question.includes("entertainment") ||
                   question.includes("oscar") ||
                   question.includes("grammy");
          case "crypto":
            return question.includes("bitcoin") || 
                   question.includes("ethereum") || 
                   question.includes("crypto") ||
                   question.includes("btc") ||
                   question.includes("eth") ||
                   question.includes("defi") ||
                   question.includes("blockchain");
          default:
            return true;
        }
      });
    }
    
    return filtered;
  }, [marketData, searchQuery, selectedCategory]);

  function getYesAndNoPrices(market: any) {
    let prices: number[] = [0, 0];

    if (Array.isArray(market.outcomePrices)) {
      prices = market.outcomePrices.map((p: string) => parseFloat(p));
    } else if (typeof market.outcomePrices === "string") {
      try {
        const parsed = JSON.parse(market.outcomePrices);
        if (Array.isArray(parsed)) {
          prices = parsed.map(p => parseFloat(p));
        }
      } catch (err) {
        console.error("Failed to parse outcomePrices:", market.outcomePrices, err);
      }
    }

    const yesPrice = prices[0] ?? 0;
    const noPrice = prices[1] ?? 0;
    const yesPercentage = (yesPrice * 100).toFixed(0);
    const noPercentage = (noPrice * 100).toFixed(0);

    return { yesPrice, noPrice, yesPercentage, noPercentage };
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header with Search and Filters */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50"
      >
        <div className="container mx-auto px-4 py-4">
          {/* Search Bar */}
          <div className="flex flex-col gap-4">
            <div className="flex gap-3 items-center">
              <div className="relative flex-1 max-w-xl">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search markets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10 h-10"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              
              {/* Mobile Filter Toggle */}
              <Button
                variant="outline"
                size="icon"
                className="lg:hidden"
                onClick={() => setShowMobileFilters(!showMobileFilters)}
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>

            {/* Category Filters - Desktop */}
            <div className="hidden lg:flex items-center justify-between">
              <div className="flex gap-2">
                {categoryFilters.map((filter) => {
                  const Icon = filter.icon;
                  return (
                    <motion.button
                      key={filter.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedCategory(filter.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                        selectedCategory === filter.id
                          ? "bg-primary text-primary-foreground shadow-lg"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{filter.label}</span>
                      {selectedCategory === filter.id && filteredMarkets.length > 0 && (
                        <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                          {filteredMarkets.length}
                        </Badge>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Time Filters */}
              {/* <div className="flex gap-1">
                {timeFilters.map((filter) => (
                  <motion.button
                    key={filter}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveTimeFilter(filter)}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      activeTimeFilter === filter
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {filter}
                  </motion.button>
                ))}
              </div> */}
            </div>

            {/* Category Filters - Mobile (Collapsible) */}
            <AnimatePresence>
              {showMobileFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="lg:hidden overflow-hidden"
                >
                  <div className="flex flex-wrap gap-2 pb-2">
                    {categoryFilters.map((filter) => {
                      const Icon = filter.icon;
                      return (
                        <button
                          key={filter.id}
                          onClick={() => {
                            setSelectedCategory(filter.id);
                            setShowMobileFilters(false);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                            selectedCategory === filter.id
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground bg-muted"
                          }`}
                        >
                          <Icon className="h-3 w-3" />
                          <span>{filter.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Results Count */}
          {(searchQuery || selectedCategory !== "all") && (
            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <span>Showing {filteredMarkets.length} of {marketData?.length || 0} markets</span>
              {(searchQuery || selectedCategory !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("all");
                  }}
                  className="h-6 px-2 text-xs"
                >
                  Clear filters
                </Button>
              )}
            </div>
          )}
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          {/* No Results Message */}
          {filteredMarkets.length === 0 && (
            <div className="text-center py-12">
              <div className="text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No markets found</p>
                <p className="text-sm mt-2">Try adjusting your search or filters</p>
              </div>
            </div>
          )}

          {/* Desktop Table */}
          {filteredMarkets.length > 0 && (
            <div className="hidden lg:block border border-border rounded-lg overflow-hidden mb-6">
              <div className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-border bg-muted/50">
                      <tr className="text-left">
                        <th className="p-4 font-medium text-muted-foreground">Market Info</th>
                        <th className="p-4 font-medium text-muted-foreground">Chart</th>
                        <th className="p-4 font-medium text-muted-foreground">Liquidity</th>
                        <th className="p-4 font-medium text-muted-foreground">Volume</th>
                        <th className="p-4 font-medium text-muted-foreground">Probability</th>
                        <th className="p-4 font-medium text-muted-foreground">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      <AnimatePresence mode="popLayout">
                        {filteredMarkets.map((token, index) => (
                          <motion.tr
                            key={token.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ delay: index * 0.05 }}
                            className="border-b border-border hover:bg-muted/50 transition-colors"
                          >
                            {/* Market Info */}
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={token.image || "/placeholder.svg"}
                                  alt={token.id}
                                  className="w-10 h-10 rounded-full"
                                />
                                <div className="max-w-sm">
                                  <div className="font-semibold truncate">{token.question}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {token.startDate ? toLocalString(token.startDate) : "—"}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Chart */}
                            <td>
                              <div>
                                <PolymarketMiniChart marketId={token.id} />
                              </div>
                            </td>

                            {/* Liquidity */}
                            <td className="p-4">
                              <div className="font-semibold">{formatVolume(Number(token.liquidity))}</div>
                            </td>

                            {/* Volume */}
                            <td className="p-4">
                              <span className="font-semibold">{formatVolume(Number(token.volume))}</span>
                            </td>

                            {/* Probability */}
                            <td className="p-4">
                              <div className="space-y-1">
                                {(() => {
                                  const { yesPercentage, noPercentage } = getYesAndNoPrices(token);
                                  return (
                                    <div className="flex flex-col gap-1">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium">YES</span>
                                        <div className="flex-1 bg-muted rounded-full h-2 max-w-[100px]">
                                          <div 
                                            className="bg-green-500 h-2 rounded-full transition-all"
                                            style={{ width: `${yesPercentage}%` }}
                                          />
                                        </div>
                                        <span className="text-sm font-semibold">{yesPercentage}%</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium">NO</span>
                                        <div className="flex-1 bg-muted rounded-full h-2 max-w-[100px]">
                                          <div 
                                            className="bg-red-500 h-2 rounded-full transition-all"
                                            style={{ width: `${noPercentage}%` }}
                                          />
                                        </div>
                                        <span className="text-sm font-semibold">{noPercentage}%</span>
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                            </td>

                            {/* Action */}
                            <td className="p-4">
                              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                 <Link href={`/market/${token.slug}`}>
                        <Button size="sm" className="bg-emerald-500 hover:bg-green-700">
                          Trade
                        </Button>
                    </Link>
                              </motion.div>
                            </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredMarkets.map((token, index) => (
                <motion.div
                  key={token.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <Card className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3 flex-1">
                        <img
                          src={token.image || "/placeholder.svg"}
                          alt={token.id}
                          className="w-12 h-12 rounded-full flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm truncate">{token.question}</div>
                          <div className="text-xs text-muted-foreground">
                            {token.startDate ? toLocalString(token.startDate) : "—"}
                          </div>
                        </div>
                      </div>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link href={`/market/${token.slug}`}>
                        <Button size="sm" className="bg-emerald-500 hover:bg-green-700">
                          Trade
                        </Button>
                    </Link>
                      </motion.div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Liquidity</span>
                        <div className="font-semibold">{formatVolume(Number(token.liquidity))}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Volume</span>
                        <div className="font-semibold">{formatVolume(Number(token.volume))}</div>
                      </div>
                    </div>

                    {/* Probability Bars */}
                    <div className="mt-3 pt-3 border-t border-border">
                      {(() => {
                        const { yesPercentage, noPercentage } = getYesAndNoPrices(token);
                        return (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-medium">YES {yesPercentage}%</span>
                              <span className="font-medium">NO {noPercentage}%</span>
                            </div>
                            <div className="flex h-2 rounded-full overflow-hidden bg-muted">
                              <div 
                                className="bg-green-500 transition-all"
                                style={{ width: `${yesPercentage}%` }}
                              />
                              <div 
                                className="bg-red-500 transition-all"
                                style={{ width: `${noPercentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      </main>
    </div>
  )
}