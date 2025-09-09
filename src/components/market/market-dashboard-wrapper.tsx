'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import MarketDashboard from '@/components/market/market-dashboard';
import { baseUrl } from '@/utils';
import { MarketSlug } from '@/types/market';
import { useDebounce } from '@/hooks/useDebounce';

interface MarketData {
  data: MarketSlug[];
  hasMore: boolean;
  total: number;
  offset?: number;
  limit?: number;
}

export default function MarketDashboardWrapper({ initialData }: { initialData: MarketData }) {
  const [marketData, setMarketData] = useState(initialData.data || []);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialData.hasMore || false);
  const [currentOffset, setCurrentOffset] = useState(initialData.offset || 50); // Start at 50 since we already have initial data
  const [sortBy, setSortBy] = useState('volume');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('trending');
  const [selectedFilter, setSelectedFilter] = useState('trending');
  const [error, setError] = useState<string | null>(null);
  
  // Debug state - visible on screen
  const [debugInfo, setDebugInfo] = useState<string>('');
  
  const isLoadingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  
  // Update debug info
  const updateDebug = (message: string) => {
    console.log(message);
    setDebugInfo(prev => `${new Date().toLocaleTimeString()}: ${message}\n${prev}`.split('\n').slice(0, 10).join('\n'));
  };
  
  // Build API URL with filters
  const buildApiUrl = useCallback((offset: number) => {
    let url = `${baseUrl}/api/market?limit=50&offset=${offset}&sortBy=${sortBy}`;
    
    if (searchQuery) {
      url += `&q=${encodeURIComponent(searchQuery)}`;
    }
    
    if (!searchQuery && selectedCategory !== 'trending') {
      url += `&category=${selectedCategory}`;
    }
    
    if (!searchQuery && selectedFilter) {
      url += `&filter=${selectedFilter}`;
    }
    
    updateDebug(`Built URL: ${url}`);
    return url;
  }, [sortBy, searchQuery, selectedCategory, selectedFilter]);
  
  // Handle search
  useEffect(() => {
    const handleSearch = async () => {
      if (debouncedSearchQuery.trim() === '' && searchQuery.trim() === '') {
        loadMarkets(0, true);
        return;
      }
      
      if (debouncedSearchQuery.trim().length < 2) {
        return;
      }
      
      setIsLoading(true);
      setError(null);
      updateDebug(`Searching for: ${debouncedSearchQuery}`);
      
      try {
        const response = await fetch(
          `${baseUrl}/api/market?q=${encodeURIComponent(debouncedSearchQuery)}&limit=50&offset=0&sortBy=${sortBy}`,
          {
            headers: {
              'Accept': 'application/json',
            }
          }
        );
        
        if (!response.ok) throw new Error(`Search failed: ${response.status}`);
        
        const data = await response.json();
        
        setMarketData(data.data || []);
        setHasMore(data.hasMore || false);
        setCurrentOffset(0);
        updateDebug(`Search returned ${data.data?.length || 0} results`);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Search failed';
        setError(errorMsg);
        updateDebug(`Search error: ${errorMsg}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (debouncedSearchQuery !== '') {
      handleSearch();
    }
  }, [debouncedSearchQuery, sortBy]);
  
  // Load markets - simplified and with better error handling
  const loadMarkets = useCallback(async (offset: number, replace: boolean = false) => {
    // Prevent duplicate requests
    if (isLoadingRef.current && !replace) {
      updateDebug('Already loading, skipping...');
      return;
    }
    
    updateDebug(`Loading markets: offset=${offset}, replace=${replace}`);
    
    isLoadingRef.current = true;
    setIsLoading(true);
    setError(null);
    
    try {
      const url = buildApiUrl(offset);
      
      // Try multiple fetch strategies for better compatibility
      let response;
      
      try {
        // First attempt: Standard fetch with minimal options
        updateDebug('Attempting standard fetch...');
        response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          // Remove mode: 'cors' as it can cause issues
          credentials: 'same-origin', // Important for some browsers
          cache: 'no-cache',
        });
      } catch (fetchError) {
        updateDebug(`Standard fetch failed: ${fetchError}`);
        
        // Fallback: Try with minimal options
        updateDebug('Attempting fallback fetch with minimal options...');
        response = await fetch(url);
      }
      
      updateDebug(`Response status: ${response.status}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const text = await response.text(); // Get as text first
      updateDebug(`Response received, length: ${text.length} chars`);
      
      let data;
      try {
        data = JSON.parse(text); // Parse manually for better error handling
      } catch (parseError) {
        updateDebug(`JSON parse error: ${parseError}`);
        updateDebug(`Response text preview: ${text.substring(0, 200)}`);
        throw new Error('Invalid JSON response');
      }
      
      updateDebug(`Received ${data.data?.length || 0} markets, hasMore: ${data.hasMore}`);
      
      // Validate response data
      if (!data || !Array.isArray(data.data)) {
        updateDebug(`Invalid data structure: ${JSON.stringify(data).substring(0, 200)}`);
        throw new Error('Invalid response format');
      }
      
      if (replace) {
        setMarketData(data.data);
      } else {
        setMarketData(prev => {
          const existingIds = new Set(prev.map(m => m.id));
          const newMarkets = data.data.filter((m: MarketSlug) => !existingIds.has(m.id));
          updateDebug(`Adding ${newMarkets.length} new markets (${data.data.length - newMarkets.length} duplicates filtered)`);
          return [...prev, ...newMarkets];
        });
      }
      
      setHasMore(data.hasMore || false);
      setCurrentOffset(offset);
    } catch (err) {
      let errorMessage = 'Failed to load markets';
      let errorDetails = '';
      
      if (err instanceof Error) {
        errorMessage = err.message;
        errorDetails = err.stack || '';
        
        // More specific error messages
        if (err.message === 'Failed to fetch') {
          errorMessage = 'Network error - please check your connection or try the button below';
          updateDebug('Failed to fetch - likely CORS or network issue');
        }
      }
      
      setError(errorMessage);
      updateDebug(`Error: ${errorMessage}`);
      updateDebug(`Error details: ${errorDetails}`);
      
      // Don't set hasMore to false on error - allow retry
      // setHasMore(false);
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  }, [buildApiUrl]);
  
  // Handle category change
  const handleCategoryChange = useCallback(async (category: string) => {
    if (category === selectedCategory) return;
    
    updateDebug(`Changing category to: ${category}`);
    setSelectedCategory(category);
    setSelectedFilter('');
    setSearchQuery('');
    setCurrentOffset(0);
    
    await loadMarkets(0, true);
  }, [selectedCategory, loadMarkets]);
  
  // Handle filter change
  const handleFilterChange = useCallback(async (filter: string) => {
    if (filter === selectedFilter) return;
    
    updateDebug(`Changing filter to: ${filter}`);
    setSelectedFilter(filter);
    setSelectedCategory('trending');
    setSearchQuery('');
    setCurrentOffset(0);
    
    await loadMarkets(0, true);
  }, [selectedFilter, loadMarkets]);
  
  // Load more markets - simplified
  const loadMore = useCallback(async () => {
    if (isLoadingRef.current || !hasMore || searchQuery) {
      updateDebug(`Not loading more: loading=${isLoadingRef.current}, hasMore=${hasMore}, searching=${!!searchQuery}`);
      return;
    }
    
    const nextOffset = currentOffset + 50;
    updateDebug(`Loading more from offset ${nextOffset}`);
    await loadMarkets(nextOffset, false);
  }, [currentOffset, hasMore, searchQuery, loadMarkets]);
  
  // Handle sort change
  const handleSortChange = useCallback(async (newSortBy: string) => {
    if (newSortBy === sortBy && !searchQuery) return;
    
    updateDebug(`Changing sort to: ${newSortBy}`);
    setSortBy(newSortBy);
    await loadMarkets(0, true);
  }, [sortBy, searchQuery, loadMarkets]);
  
  // Simple scroll-based infinite loading
  useEffect(() => {
    if (searchQuery || !hasMore) {
      updateDebug(`Scroll disabled: searching=${!!searchQuery}, hasMore=${hasMore}`);
      return;
    }
    
    const handleScroll = () => {
      // Use multiple methods to get scroll position for better compatibility
      const scrollTop = window.pageYOffset || 
                       document.documentElement.scrollTop || 
                       document.body.scrollTop || 
                       0;
      
      const scrollHeight = document.documentElement.scrollHeight || 
                          document.body.scrollHeight || 
                          0;
      
      const clientHeight = window.innerHeight || 
                          document.documentElement.clientHeight || 
                          document.body.clientHeight || 
                          0;
      
      const scrollPercentage = ((scrollTop + clientHeight) / scrollHeight) * 100;
      
      // Trigger when user scrolls to bottom 20% of page
      if (scrollPercentage > 80 && hasMore && !isLoadingRef.current) {
        updateDebug(`Scroll trigger at ${scrollPercentage.toFixed(1)}%`);
        loadMore();
      }
    };
    
    // Add both scroll and touchmove for better mobile support
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('touchmove', handleScroll, { passive: true });
    
    // Also check on resize
    window.addEventListener('resize', handleScroll, { passive: true });
    
    updateDebug('Scroll listeners attached');
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('touchmove', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [hasMore, searchQuery, loadMore]);
  
  // Manual load more button as fallback
  const handleManualLoadMore = () => {
    updateDebug('Manual load more clicked');
    loadMore();
  };
  
  return (
    <>
      <MarketDashboard 
        marketData={marketData}
        onSortChange={handleSortChange}
        sortBy={sortBy}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isSearching={isLoading && searchQuery !== ''}
        selectedCategory={selectedCategory}
        onCategoryChange={handleCategoryChange}
        selectedFilter={selectedFilter}
        onFilterChange={handleFilterChange}
      />

      
      {/* Loading indicator */}
      {isLoading && !searchQuery && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}
      
      {/* Error message with retry */}
      {error && (
        <div className="text-center py-4 text-red-500">
          <p>{error}</p>
          <button 
            onClick={handleManualLoadMore} 
            className="mt-2 px-4 py-2 bg-primary text-white rounded hover:opacity-90"
          >
            Retry
          </button>
        </div>
      )}
      
      {/* Error message with retry */}
      {error && (
        <div className="text-center py-4 text-red-500">
          <p>{error}</p>
          <button 
            onClick={handleManualLoadMore} 
            className="mt-2 px-4 py-2 bg-primary text-white rounded hover:opacity-90"
          >
            Retry
          </button>
        </div>
      )}

      {/* End of list message */}
      {!hasMore && marketData.length > 0 && !searchQuery && (
        <div className="text-center py-4 text-gray-500">
          All {marketData.length} markets loaded
        </div>
      )}
    </>
  );
}