"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  X,
  ArrowUpDown,
  DollarSign,
  Activity,
  Clock,
  CalendarDays,
  Bell,
  BellIcon,
  CheckIcon,
  Building,
  Cpu,
  Globe
} from "lucide-react"
import { MarketSlug } from "@/types/market"
import PolymarketMiniChart from "./mini-chart"
import { formatVolume, toLocalString } from "@/utils"
import { Progress } from "../ui/progress"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { WatchlistAlertDialog } from "../watchlist/alert-dialog"
import { useAccount } from "wagmi"
import { toast } from "sonner"
import { watchlistAPI } from "@/lib/watchlist-api"
import { useSession } from "next-auth/react"

// Sort options with icons
const sortOptions = [
  { value: "volume", label: "Volume", icon: DollarSign },
  { value: "liquidity", label: "Liquidity", icon: Activity },
  { value: "volume24hr", label: "24h Volume", icon: TrendingUp },
  { value: "newest", label: "Newest", icon: CalendarDays },
  { value: "ending_soon", label: "Ending Soon", icon: Clock },
]

// Updated category filters with proper categorization
const categoryFilters = [
  { id: "trending", label: "Trending", icon: TrendingUp, isFilter: true },
  { id: "new", label: "New", icon: CalendarDays, isFilter: true },
  { id: "politics", label: "Politics", icon: Building, isFilter: false },
  { id: "crypto", label: "Crypto", icon: Bitcoin, isFilter: false },
  { id: "tech", label: "Tech", icon: Cpu, isFilter: false },
  { id: "pop-culture", label: "Pop Culture", icon: Users, isFilter: false },
  { id: "sports", label: "Sports", icon: Trophy, isFilter: false },
  { id: "geopolitics", label: "Geopolitics", icon: Globe, isFilter: false },
]

type Props = {
  marketData: MarketSlug[]
  onSortChange: (sortBy: string) => void
  sortBy: string
  searchQuery: string
  onSearchChange: (query: string) => void
  isSearching?: boolean
  selectedCategory?: string
  onCategoryChange?: (category: string) => void
  selectedFilter?: string
  onFilterChange?: (filter: string) => void
}

type WatchlistItem = {
  id: string
  userId: string
  marketId: string
  question: string
  endDate: Date | null
  liquidity: number | null
  volume24hr: number | null
  triggerType: string
  triggerValue: number
  frequency: string
  isActive: boolean
  isEmailNotification: boolean
  isTelegramNotification: boolean
  lastNotifiedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export default function MarketDashboard({ 
  marketData, 
  onSortChange, 
  sortBy, 
  searchQuery, 
  onSearchChange,
  isSearching = false,
  selectedCategory = 'trending',
  onCategoryChange,
  selectedFilter = '',
  onFilterChange
}: Props) {
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [isChangingSort, setIsChangingSort] = useState(false)
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([])
  const [isLoadingWatchlist, setIsLoadingWatchlist] = useState(false)
  const {data: session} = useSession()
  const router = useRouter()
  const { address, isConnected } = useAccount()

  useEffect(() => {
    console.log("Market Data received:", marketData);
    if (marketData && marketData.length > 0) {
      console.log("First item structure:", marketData[0]);
      console.log("Current sort:", sortBy);
      console.log("Current category:", selectedCategory);
      console.log("Current filter:", selectedFilter);
    }
  }, [marketData, sortBy, selectedCategory, selectedFilter]);

  // Memoized function to check if item is in watchlist
  const isInWatchlist = useCallback((marketId: string) => {
    return Array.isArray(watchlist) && watchlist.some(item => item.marketId === marketId)
  }, [watchlist])

  // Handle sort change with loading state
  const handleSortSelection = async (newSortBy: string) => {
    if (newSortBy === sortBy) return;
    
    setIsChangingSort(true);
    await onSortChange(newSortBy);
    setTimeout(() => setIsChangingSort(false), 300);
  };

  // Handle category/filter click
  const handleFilterClick = (filter: typeof categoryFilters[0]) => {
    console.log('Filter clicked:', filter);
    if (filter.isFilter) {
      // It's a filter (trending, new)
      if (selectedFilter === filter.id) {
        onFilterChange?.(''); // Clear if already selected
      } else {
        onFilterChange?.(filter.id);
      }
    } else {
      // It's a category (politics, crypto, etc.)
      onCategoryChange?.(filter.id);
    }
  };

  // Check if a filter is active
  const isFilterActive = (filter: typeof categoryFilters[0]) => {
    if (filter.isFilter) {
      return selectedFilter === filter.id;
    } else {
      return selectedCategory === filter.id;
    }
  };

  // Get current active filter label for display
  const getActiveFilterLabel = () => {
    if (selectedFilter) {
      const filter = categoryFilters.find(f => f.id === selectedFilter);
      return filter?.label;
    }
    if (selectedCategory !== 'trending') {
      const category = categoryFilters.find(f => f.id === selectedCategory);
      return category?.label;
    }
    return 'Trending';
  };

  // Markets are already filtered by API, so we just display them
  const filteredMarkets = useMemo(() => {
    return Array.isArray(marketData) ? marketData : [];
  }, [marketData]);

  // Optimized price calculation function
  const getYesAndNoPrices = useCallback((market: any) => {
    let prices: number[] = [0, 0];

    try {
      if (Array.isArray(market.outcomePrices)) {
        prices = market.outcomePrices.map((p: string | number) => 
          typeof p === 'string' ? parseFloat(p) : Number(p)
        );
      } else if (typeof market.outcomePrices === "string") {
        const parsed = JSON.parse(market.outcomePrices);
        if (Array.isArray(parsed)) {
          prices = parsed.map(p => typeof p === 'string' ? parseFloat(p) : Number(p));
        }
      }
    } catch (err) {
      console.error("Failed to parse outcomePrices:", market.outcomePrices, err);
    }

    const yesPrice = Math.max(0, Math.min(1, prices[0] ?? 0));
    const noPrice = Math.max(0, Math.min(1, prices[1] ?? 0));
    const yesPercentage = (yesPrice * 100).toFixed(0);
    const noPercentage = (noPrice * 100).toFixed(0);

    return { yesPrice, noPrice, yesPercentage, noPercentage };
  }, []);

  // Fetch watchlist with proper error handling
  useEffect(() => {
    const fetchWatchlist = async () => {
      if (!session?.user || !session.user.email) {
        setWatchlist([]);
        return;
      }

      setIsLoadingWatchlist(true);
      try {
        const response = await fetch(`/api/watchlist?email=${session.user.email}`);
        if (response.ok) {
          const data = await response.json();
          console.log('Fetched watchlist:', data);
          setWatchlist(Array.isArray(data.watchLists) ? data.watchLists : []);
        } else {
          console.error('Failed to fetch watchlist:', response.statusText);
          setWatchlist([]);
        }
      } catch (error) {
        console.error('Error fetching watchlist:', error);
        setWatchlist([]);
      } finally {
        setIsLoadingWatchlist(false);
      }
    };

    fetchWatchlist();
  }, [session?.user]);

  // Optimized watchlist toggle function
  const handleAddToWatchlist = useCallback(async (marketId: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }

    if (!session?.user?.email) {
      toast.info("Please log in to manage your watchlist.");
      return;
    }

    const isCurrentlyInWatchlist = isInWatchlist(marketId);

    try {
      if (isCurrentlyInWatchlist) {
        await watchlistAPI.deleteWatchlist(marketId, session.user.email);
        setWatchlist(prev => prev.filter(item => item.marketId !== marketId));
        toast.success("Market removed from watchlist");
      } else {
        const response = await watchlistAPI.createWatchlist({
          email: session.user.email,
          marketId: marketId,
          triggerType: "price_above"
        });
        
        const updatedWatchlist = response.watchList;
        setWatchlist(prev => [...prev, updatedWatchlist]);
        toast.success("Market added to watchlist");
      }
    } catch (error) {
      console.error("Error managing watchlist:", error);
      toast.error(isCurrentlyInWatchlist ? "Failed to remove from watchlist" : "Failed to add to watchlist");
    }
  }, [isInWatchlist, session?.user?.email]);

  // Get current sort option for display
  const currentSortOption = sortOptions.find(opt => opt.value === sortBy) || sortOptions[0];

  // Watchlist button component
  const WatchlistButton = useCallback(({ marketId, className = "" }: { marketId: string; className?: string }) => (
    <Button 
      variant="outline" 
      size="sm"
      onClick={(e) => handleAddToWatchlist(marketId, e)}
      className={`${className} ${isLoadingWatchlist ? 'opacity-50 cursor-not-allowed' : ''} mx-3`}
      disabled={isLoadingWatchlist}
    >
      {isInWatchlist(marketId) ? (
        <p>Watching</p>
      ) : (
        <p>Watch</p>
      )}
    </Button>
  ), [handleAddToWatchlist, isInWatchlist, isLoadingWatchlist]);



  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header with Search and Filters */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50"
      >
        <div className="container mx-auto px-4 py-4">
           {/* Search Bar and Sort */}
          <div className="flex flex-col gap-4">
            <div className="flex gap-3 items-center">
          <div className="relative flex-1 max-w-xl">
    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
    <Input
      type="text"
      placeholder="Search markets..."
      value={searchQuery}
      onChange={(e) => onSearchChange(e.target.value)}
      className="pl-10 pr-10 h-10"
    />
    {searchQuery && (
      <button
        onClick={() => onSearchChange("")}
        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    )}
    {isSearching && (
      <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
      </div>
    )}
  </div>
              
              {/* Sort Dropdown */}
              <Select value={sortBy} onValueChange={handleSortSelection}>
                <SelectTrigger className="w-[180px] h-10">
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="h-4 w-4" />
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        <currentSortOption.icon className="h-4 w-4" />
                        <span>{currentSortOption.label}</span>
                      </div>
                    </SelectValue>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span>{option.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              
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
        {/* Category Filters - Desktop */}
            <div className="hidden lg:flex items-center justify-between">
              <div className="flex gap-2 flex-wrap">
                {categoryFilters.map((filter) => {
                  const Icon = filter.icon;
                  const isActive = isFilterActive(filter);
                  return (
                    <motion.button
                      key={filter.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleFilterClick(filter)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                        isActive
                          ? "bg-primary text-primary-foreground shadow-lg"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{filter.label}</span>
                      {isActive && filteredMarkets.length > 0 && (
                        <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                          {filteredMarkets.length}
                        </Badge>
                      )}
                    </motion.button>
                  );
                })}
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
                  <div className="space-y-3">
                    {/* Mobile Sort Selector */}
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs text-muted-foreground w-full">Sort by:</span>
                      {sortOptions.map((option) => {
                        const Icon = option.icon;
                        return (
                          <button
                            key={option.value}
                            onClick={() => handleSortSelection(option.value)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                              sortBy === option.value
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground bg-muted"
                            }`}
                          >
                            <Icon className="h-3 w-3" />
                            <span>{option.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    
                    {/* Category Filters */}
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs text-muted-foreground w-full">Categories:</span>
                      {categoryFilters.map((filter) => {
                        const Icon = filter.icon;
                        const isActive = isFilterActive(filter);
                        return (
                          <button
                            key={filter.id}
                            onClick={() => handleFilterClick(filter)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                              isActive
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
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* i want for mobile device Also */}

        <div className="flex justify-between items-center lg:hidden">
             <div className="flex flex-wrap gap-2">
                      {categoryFilters.map((filter) => {
                        const Icon = filter.icon;
                        const isActive = isFilterActive(filter);
                        return (
                          <button
                            key={filter.id}
                            onClick={() => handleFilterClick(filter)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                              isActive
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
          </div>

          {/* Results Count */}
          {(searchQuery || selectedCategory !== "trending" || selectedFilter) && (
            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <span>
                {searchQuery ? 
                  `Found ${filteredMarkets.length} markets matching "${searchQuery}"` :
                  `Showing ${filteredMarkets.length} ${getActiveFilterLabel()} markets`
                }
              </span>
              {(searchQuery || selectedCategory !== "trending" || selectedFilter) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onSearchChange("");
                    onCategoryChange?.("trending");
                    onFilterChange?.("");
                  }}
                  className="h-6 px-2 text-xs"
                >
                  Clear filters
                </Button>
              )}
            </div>
          )}
        </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.1 }}
        >
          {/* Loading Overlay for Sort Changes */}
          <AnimatePresence>
            {isChangingSort && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-background/50 backdrop-blur-sm z-40 flex items-center justify-center"
              >
                <div className="bg-card p-4 rounded-lg shadow-lg flex items-center gap-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  <span className="text-sm font-medium">Updating sort order...</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* No Results Message */}
          {filteredMarkets.length === 0 && !isChangingSort && (
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
                        <th className="p-4 font-medium text-muted-foreground">
                          <button
                            onClick={() => handleSortSelection('liquidity')}
                            className={`flex items-center gap-1 hover:text-foreground transition-colors ${
                              sortBy === 'liquidity' ? 'text-primary' : ''
                            }`}
                          >
                            Liquidity
                            {sortBy === 'liquidity' && <ArrowUpDown className="h-3 w-3" />}
                          </button>
                        </th>
                        <th className="p-4 font-medium text-muted-foreground">
                          <button
                            onClick={() => handleSortSelection('volume')}
                            className={`flex items-center gap-1 hover:text-foreground transition-colors ${
                              sortBy === 'volume' ? 'text-primary' : ''
                            }`}
                          >
                            Volume
                            {sortBy === 'volume' && <ArrowUpDown className="h-3 w-3" />}
                          </button>
                        </th>
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
                            transition={{ delay: index * 0.02 }}
                            className="border-b border-border hover:bg-muted/50 transition-colors"
                            onClick={() => router.push(`/market/${token.slug}`)}
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
                                  <div className="font-semibold truncate ">{token.question}</div>
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
                              <div className="space-y-1">
                                <div className="font-semibold">{formatVolume(Number(token.volume))}</div>
                                {token.volume24hr && (
                                  <div className="text-xs text-muted-foreground">
                                    24h: {formatVolume(Number(token.volume24hr))}
                                  </div>
                                )}
                              </div>
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
                                                              <WatchlistButton marketId={token.id} />

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
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                >
              <Link href={`/market/${token.slug}`}>
                  <Card className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3 flex-1">
                        <img
                          src={token.image || "/placeholder.svg"}
                          alt={token.id}
                          className="w-12 h-12 rounded-full flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                                  <div className="font-semibold truncate w-[120px] md:w-full">{token.question}</div>
                          <div className="text-xs text-muted-foreground">
                            {token.startDate ? toLocalString(token.startDate) : "—"}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Liquidity</span>
                        <div className="font-semibold">{formatVolume(Number(token.liquidity))}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Volume</span>
                        <div className="font-semibold">{formatVolume(Number(token.volume))}</div>
                        {token.volume24hr && (
                          <div className="text-xs text-muted-foreground">
                            24h: {formatVolume(Number(token.volume24hr))}
                          </div>
                        )}
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

                    {/* Sort Badge on Mobile */}
                    <div className="mt-2 flex justify-between items-center">
                       <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Link href={`/market/${token.slug}`}>
                          <Button size="sm" className="bg-emerald-500 hover:bg-green-700">
                            Trade
                          </Button>
                        </Link>
                                                        <WatchlistButton marketId={token.id} />

                      </motion.div>
                      <Badge variant="outline" className="text-xs">
                        <currentSortOption.icon className="h-3 w-3 mr-1" />
                        {currentSortOption.label}
                      </Badge>
                    </div>
                  </Card>
              </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      </main>
    </div>
  )
}