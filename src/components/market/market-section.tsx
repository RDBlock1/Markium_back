"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { motion } from "framer-motion"
import { Search, Grid3X3, List, TrendingUp, Activity, DollarSign, Loader2 } from "lucide-react"
import { CategoryFilter } from "@/components/market/category-filter"
import { MarketsGrid } from "@/components/market/markets-grid"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency, formatCompactNumber } from "@/utils/format"
import type { Market, Category, SortOption, ViewMode, MarketStats } from "@/types/market"

const categories: Category[] = ["All", "Politics", "Sports", "Crypto", "Business", "Science", "Pop Culture", "Weather"]
const sortOptions: SortOption[] = ["Volume", "Liquidity", "Newest", "Ending Soon"]

const ITEMS_PER_PAGE = 20;

type Props = {
  initialData: Market[]
}

export default function MarketsSection({ initialData }: Props) {
  const [markets, setMarkets] = useState<Market[]>(initialData || [])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [activeCategory, setActiveCategory] = useState<Category>("All")
  const [sortBy, setSortBy] = useState<SortOption>("Volume")
  const [viewMode, setViewMode] = useState<ViewMode>("Grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [offset, setOffset] = useState(ITEMS_PER_PAGE)
  const [hasMore, setHasMore] = useState(true)
  
  // Ref for intersection observer
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const isLoadingRef = useRef(false)
  const observerRef = useRef<IntersectionObserver | null>(null)
  
  // Keep track of loaded market IDs to prevent duplicates
  const loadedMarketIds = useRef<Set<string>>(new Set(initialData?.map(m => m.id) || []))

  // Function to fetch more markets
  const fetchMoreMarkets = useCallback(async () => {
    // Double-check loading state with ref to prevent race conditions
    if (isLoadingRef.current || !hasMore || loadingMore) {
      console.log('Skipping fetch: already loading or no more data');
      return;
    }
    
    console.log(`Fetching markets with offset: ${offset}, limit: ${ITEMS_PER_PAGE}`);
    
    isLoadingRef.current = true;
    setLoadingMore(true);
    
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
      const response = await fetch(
        `${baseUrl}/api/market?limit=${ITEMS_PER_PAGE}&offset=${offset}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          // Prevent caching to avoid stale data
          cache: 'no-store'
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.data && Array.isArray(data.data) && data.data.length > 0) {
        // Filter out duplicates before adding
        const uniqueNewMarkets = data.data.filter((market: Market) => {
          if (loadedMarketIds.current.has(market.id)) {
            console.log(`Duplicate market detected and filtered: ${market.id}`);
            return false;
          }
          loadedMarketIds.current.add(market.id);
          return true;
        });
        
        if (uniqueNewMarkets.length > 0) {
          console.log(`Adding ${uniqueNewMarkets.length} new unique markets`);
          
          setMarkets(prev => {
            // Additional safety check at state update time
            const existingIds = new Set(prev.map(m => m.id));
            const marketsToAdd = uniqueNewMarkets.filter((m: Market) => !existingIds.has(m.id));
            return [...prev, ...marketsToAdd];
          });
          
          // Only increment offset if we actually added new markets
          setOffset(prev => prev + uniqueNewMarkets.length);
        }
        
        // Check if we should continue loading more
        const shouldContinue = data.hasMore !== false && data.data.length === ITEMS_PER_PAGE;
        setHasMore(shouldContinue);
        
        if (!shouldContinue) {
          console.log('No more markets to load');
        }
      } else {
        console.log('No data received or empty array');
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error fetching more markets:', error);
      setHasMore(false);
    } finally {
      setLoadingMore(false);
      // Small delay before allowing next fetch to prevent rapid successive calls
      setTimeout(() => {
        isLoadingRef.current = false;
      }, 100);
    }
  }, [offset, hasMore, loadingMore]);

  // Set up Intersection Observer for infinite scroll
  useEffect(() => {
    // Clean up previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Create new observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasMore && !isLoadingRef.current && !loadingMore) {
          console.log('Intersection detected, fetching more...');
          fetchMoreMarkets();
        }
      },
      {
        root: null,
        rootMargin: '200px', // Start loading 200px before reaching the end
        threshold: 0.01
      }
    );

    // Start observing
    const currentRef = loadMoreRef.current;
    if (currentRef && observerRef.current) {
      observerRef.current.observe(currentRef);
    }

    // Cleanup function
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [fetchMoreMarkets, hasMore, loadingMore]);

  // Filter and sort markets
  const filteredAndSortedMarkets = useMemo(() => {
    let filtered = markets;
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter((market) => 
        market.question.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter (if you have category data in markets)
    // if (activeCategory !== "All") {
    //   filtered = filtered.filter(market => market.category === activeCategory);
    // }

    // Sort markets
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "Volume":
          return b.volume24hr - a.volume24hr
        case "Liquidity":
          return b.liquidity - a.liquidity
        case "Newest":
          return new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
        case "Ending Soon":
          return new Date(a.endDate).getTime() - new Date(b.endDate).getTime()
        default:
          return 0
      }
    });

    // Remove any duplicates that might have slipped through
    const uniqueSorted = sorted.filter((market, index, self) =>
      index === self.findIndex((m) => m.id === market.id)
    );

    return uniqueSorted;
  }, [markets, searchQuery, sortBy, activeCategory]);

  // Calculate stats
  const stats: MarketStats = useMemo(
    () => ({
      totalVolume: markets.reduce((sum, market) => sum + market.volume24hr, 0),
      activeMarkets: markets.filter((market) => market.active).length,
      totalLiquidity: markets.reduce((sum, market) => sum + market.liquidity, 0),
    }),
    [markets],
  );

  // Manual refresh function
  const handleRefresh = useCallback(async () => {
    console.log('Manual refresh triggered');
    setLoading(true);
    
    // Reset all state
    setMarkets([]);
    setOffset(0);
    setHasMore(true);
    loadedMarketIds.current.clear();
    isLoadingRef.current = false;
    
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
      const response = await fetch(
        `${baseUrl}/api/market?limit=${ITEMS_PER_PAGE}&offset=0`,
        {
          cache: 'no-store'
        }
      );
      
      if (!response.ok) throw new Error('Failed to fetch');
      
      const data = await response.json();
      
      if (data.data && Array.isArray(data.data)) {
        // Reset loaded IDs tracking
        loadedMarketIds.current = new Set(data.data.map((m: Market) => m.id));
        
        setMarkets(data.data);
        setOffset(ITEMS_PER_PAGE);
        setHasMore(data.hasMore !== false && data.data.length === ITEMS_PER_PAGE);
      }
    } catch (error) {
      console.error('Error refreshing markets:', error);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load more manually (for testing)
  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore && !isLoadingRef.current) {
      fetchMoreMarkets();
    }
  }, [fetchMoreMarkets, loadingMore, hasMore]);

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8">
    

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6 mb-8"
        >
          {/* Category Filter */}
          <CategoryFilter
            categories={categories}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />

          {/* Search and Controls */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <Input
                placeholder="Search markets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={loading}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Refresh'}
              </Button>

              {/* Manual Load More Button (for testing) */}
              {process.env.NODE_ENV === 'development' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLoadMore}
                  disabled={loadingMore || !hasMore}
                >
                  Load More
                </Button>
              )}

              <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex border border-border rounded-lg">
                <Button
                  variant={viewMode === "Grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("Grid")}
                  className="rounded-r-none"
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "List" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("List")}
                  className="rounded-l-none"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Markets Grid */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <MarketsGrid 
            markets={filteredAndSortedMarkets} 
            loading={loading} 
          />
          
          {/* Infinite Scroll Trigger */}
          <div 
            ref={loadMoreRef} 
            className="flex justify-center py-8"
          >
            {loadingMore && (
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Loading more markets...</span>
              </div>
            )}
            {!hasMore && markets.length > 0 && (
              <p className="text-text-secondary">
                All {markets.length} markets loaded
              </p>
            )}
            {markets.length === 0 && !loading && (
              <p className="text-text-secondary">No markets available</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}