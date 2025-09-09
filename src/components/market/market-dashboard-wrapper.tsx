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
  const [currentOffset, setCurrentOffset] = useState(initialData.offset || 0);
  const [sortBy, setSortBy] = useState('volume');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('trending');
  const [selectedFilter, setSelectedFilter] = useState('trending');
  const [error, setError] = useState<string | null>(null);
  
  // Use refs to track loading state and prevent duplicate requests
  const isLoadingRef = useRef(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  
  // Debounce search query with 500ms delay
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  
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
      
      try {
        const response = await fetch(
          `${baseUrl}/api/market?q=${encodeURIComponent(debouncedSearchQuery)}&limit=50&offset=0&sortBy=${sortBy}`,
          {
            signal: AbortSignal.timeout(15000), // Increased timeout
            headers: {
              'Accept': 'application/json',
            }
          }
        );
        
        if (!response.ok) throw new Error('Search failed');
        
        const data = await response.json();
        
        setMarketData(data.data || []);
        setHasMore(data.hasMore || false);
        setCurrentOffset(0);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed');
        console.error('Search error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (debouncedSearchQuery !== '') {
      handleSearch();
    }
  }, [debouncedSearchQuery, sortBy]);
  
  // Load markets with better error handling
  const loadMarkets = useCallback(async (offset: number, replace: boolean = false) => {
    // Prevent duplicate requests
    if (isLoadingRef.current && !replace) {
      console.log('Already loading, skipping request');
      return;
    }
    
    isLoadingRef.current = true;
    setIsLoading(true);
    setError(null);
    
    try {
      const url = buildApiUrl(offset);
      console.log('Fetching markets from:', url);
      
      const response = await fetch(url, {
        signal: AbortSignal.timeout(15000), // Increased timeout for slower connections
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
        },
        mode: 'cors', // Explicitly set CORS mode
      });
      
      if (!response.ok) {
        throw new Error(`Failed to load markets: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Validate response data
      if (!data || !Array.isArray(data.data)) {
        throw new Error('Invalid response format');
      }
      
      if (replace) {
        setMarketData(data.data);
      } else {
        setMarketData(prev => {
          // Prevent duplicates
          const existingIds = new Set(prev.map(m => m.id));
          const newMarkets = data.data.filter((m: MarketSlug) => !existingIds.has(m.id));
          return [...prev, ...newMarkets];
        });
      }
      
      setHasMore(data.hasMore || false);
      setCurrentOffset(offset);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load markets';
      setError(errorMessage);
      console.error('Error loading markets:', err);
      
      // Reset loading state on error
      setHasMore(false);
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  }, [buildApiUrl]);
  
  // Handle category change
  const handleCategoryChange = useCallback(async (category: string) => {
    if (category === selectedCategory) return;
    
    setSelectedCategory(category);
    setSelectedFilter('');
    setSearchQuery('');
    setCurrentOffset(0);
    
    if (category === 'trending') {
      loadMarkets(0, true);
    } else {
      setIsLoading(true);
      setError(null);
      
      try {
        const url = `${baseUrl}/api/market?limit=50&offset=0&sortBy=${sortBy}&category=${category}`;
        const response = await fetch(url, {
          signal: AbortSignal.timeout(15000),
          headers: {
            'Accept': 'application/json',
          }
        });
        
        if (!response.ok) throw new Error('Failed to load category');
        
        const data = await response.json();
        
        setMarketData(data.data || []);
        setHasMore(data.hasMore || false);
        setCurrentOffset(0);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load category');
        console.error('Error loading category:', err);
      } finally {
        setIsLoading(false);
      }
    }
  }, [selectedCategory, sortBy, loadMarkets]);
  
  // Handle filter change
  const handleFilterChange = useCallback(async (filter: string) => {
    if (filter === selectedFilter) return;
    
    setSelectedFilter(filter);
    setSelectedCategory('trending');
    setSearchQuery('');
    setCurrentOffset(0);
    
    setIsLoading(true);
    setError(null);
    
    try {
      const url = `${baseUrl}/api/market?limit=50&offset=0&sortBy=${sortBy}&filter=${filter}`;
      const response = await fetch(url, {
        signal: AbortSignal.timeout(15000),
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (!response.ok) throw new Error('Failed to load filtered markets');
      
      const data = await response.json();
      
      setMarketData(data.data || []);
      setHasMore(data.hasMore || false);
      setCurrentOffset(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load markets');
      console.error('Error loading filtered markets:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedFilter, sortBy]);
  
  // Load more markets with duplicate prevention
  const loadMore = useCallback(async () => {
    if (isLoadingRef.current || !hasMore || searchQuery) {
      console.log('Skipping loadMore:', { 
        isLoading: isLoadingRef.current, 
        hasMore, 
        searchQuery: !!searchQuery 
      });
      return;
    }
    
    const nextOffset = currentOffset + 50;
    await loadMarkets(nextOffset, false);
  }, [currentOffset, hasMore, searchQuery, loadMarkets]);
  
  // Handle sort change
  const handleSortChange = useCallback(async (newSortBy: string) => {
    if (newSortBy === sortBy && !searchQuery) return;
    
    setSortBy(newSortBy);
    await loadMarkets(0, true);
  }, [sortBy, searchQuery, loadMarkets]);
  
  // Use Intersection Observer for infinite scroll (more reliable than scroll events)
  useEffect(() => {
    // Clean up previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    
    // Don't set up observer if searching or no more data
    if (searchQuery || !hasMore) {
      return;
    }
    
    // Create intersection observer
    const options = {
      root: null,
      rootMargin: '200px', // Start loading 200px before the sentinel is visible
      threshold: 0.1
    };
    
    observerRef.current = new IntersectionObserver((entries) => {
      const target = entries[0];
      if (target.isIntersecting && hasMore && !isLoadingRef.current) {
        console.log('Sentinel intersecting, loading more...');
        loadMore();
      }
    }, options);
    
    // Observe the sentinel element
    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }
    
    // Cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, searchQuery, loadMore]);
  
  // Fallback: Traditional scroll event listener for older browsers
  useEffect(() => {
    // Only use as fallback if IntersectionObserver is not supported
    if ('IntersectionObserver' in window) {
      return;
    }
    
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const scrollHeight = document.documentElement.scrollHeight;
          const clientHeight = window.innerHeight;
          
          if (scrollTop + clientHeight >= scrollHeight - 200 && hasMore && !isLoadingRef.current && !searchQuery) {
            loadMore();
          }
          
          ticking = false;
        });
        
        ticking = true;
      }
    };
    
    (window as Window).addEventListener('scroll', handleScroll, { passive: true });
    return () => (window as Window).removeEventListener('scroll', handleScroll);
  }, [hasMore, searchQuery, loadMore]);
  
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
            onClick={() => loadMore()} 
            className="mt-2 px-4 py-2 bg-primary text-white rounded hover:opacity-90"
          >
            Retry
          </button>
        </div>
      )}
      
      {/* Sentinel element for intersection observer */}
      {hasMore && !searchQuery && (
        <div 
          ref={sentinelRef} 
          className="h-10 flex justify-center items-center"
          aria-hidden="true"
        >
          {isLoading && (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          )}
        </div>
      )}
      
      {/* End of list message */}
      {!hasMore && marketData.length > 0 && !searchQuery && (
        <div className="text-center py-4 text-gray-500">
          All markets loaded
        </div>
      )}
    </>
  );
}