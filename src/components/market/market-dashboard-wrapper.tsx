'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import MarketDashboard from '@/components/market/market-dashboard';
import { baseUrl } from '@/utils';
import { MarketSlug } from '@/types/market';
import { useDebounce } from '@/hooks/useDebounce';
import { PolymarketEvent } from '@/types';

interface MarketData {
  data: PolymarketEvent[];
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
  

  // Build API URL with filters - accepts override parameters
  const buildApiUrl = useCallback((offset: number, overrides?: {
    category?: string;
    filter?: string;
    search?: string;
    sort?: string;
  }) => {
    const currentCategory = overrides?.category !== undefined ? overrides.category : selectedCategory;
    const currentFilter = overrides?.filter !== undefined ? overrides.filter : selectedFilter;
    const currentSearch = overrides?.search !== undefined ? overrides.search : searchQuery;
    const currentSort = overrides?.sort !== undefined ? overrides.sort : sortBy;
    
    let url = `${baseUrl}/api/market?limit=50&offset=${offset}&sortBy=${currentSort}`;
    
    if (currentSearch) {
      url += `&q=${encodeURIComponent(currentSearch)}`;
    } else {
      // Only apply ONE of filter or category, not both
      if (currentFilter && currentFilter !== 'trending') {
        console.log('Applying filter:', currentFilter);
        url += `&filter=${currentFilter}`;
      } else if (currentCategory && currentCategory !== 'trending') {
        console.log('Applying category:', currentCategory);
        url += `&category=${currentCategory}`;
      }
      // If both are 'trending' or empty, don't add any filter/category param
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
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Search failed';
        setError(errorMsg);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (debouncedSearchQuery !== '') {
      handleSearch();
    }
  }, [debouncedSearchQuery, sortBy]);
  
  // Load markets - now accepts overrides parameter
  const loadMarkets = useCallback(async (
    offset: number, 
    replace: boolean = false,
    overrides?: {
      category?: string;
      filter?: string;
      search?: string;
      sort?: string;
    }
  ) => {
    // Prevent duplicate requests
    if (isLoadingRef.current && !replace) {
      return;
    }
    
    
    isLoadingRef.current = true;
    setIsLoading(true);
    setError(null);
    
    try {
      const url = buildApiUrl(offset, overrides);
      console.log('Fetching markets from URL:', url);
      // Try multiple fetch strategies for better compatibility
      let response;
      
      try {
        // First attempt: Standard fetch with minimal options
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
        response = await fetch(url);
      }
      
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const text = await response.text(); // Get as text first
      
      let data;
      try {
        data = JSON.parse(text); // Parse manually for better error handling
      } catch (parseError) {

        throw new Error('Invalid JSON response');
      }
      
      
      // Validate response data
      if (!data || !Array.isArray(data.data)) {
        throw new Error('Invalid response format');
      }
      
      if (replace) {
        setMarketData(data.data);
      } else {
        setMarketData(prev => {
          const existingIds = new Set(prev.map(m => m.id));
          const newMarkets = data.data.filter((m: MarketSlug) => !existingIds.has(m.id));
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
        }
      }
      
      setError(errorMessage);
      
      // Don't set hasMore to false on error - allow retry
      // setHasMore(false);
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  }, [buildApiUrl]);
  
  // Handle category change
  const handleCategoryChange = useCallback(async (category: string) => {
    if (category === selectedCategory && !selectedFilter) return;
    
    console.log(`Changing category to: ${category}`);
    
    // Update state
    setSelectedCategory(category);
    setSelectedFilter(''); // Clear filter when selecting a category
    setSearchQuery('');
    setCurrentOffset(0);
    
    // Pass the new values directly to loadMarkets
    await loadMarkets(0, true, {
      category: category,
      filter: '', // Explicitly clear filter
      search: ''
    });
  }, [selectedCategory, selectedFilter, loadMarkets]);
  
  // Handle filter change
  const handleFilterChange = useCallback(async (filter: string) => {
    if (filter === selectedFilter && selectedCategory === 'trending') return;

    console.log(`Changing filter to: ${filter}`);
    
    // Update state
    setSelectedFilter(filter);
    setSelectedCategory('trending'); // Reset to trending when using filters
    setSearchQuery('');
    setCurrentOffset(0);
    
    // Pass the new values directly to loadMarkets
    await loadMarkets(0, true, {
      category: 'trending',
      filter: filter,
      search: ''
    });
  }, [selectedFilter, selectedCategory, loadMarkets]);
  
  // Load more markets - simplified
  const loadMore = useCallback(async () => {
    if (isLoadingRef.current || !hasMore || searchQuery) {
      return;
    }
    
    const nextOffset = currentOffset + 50;
    await loadMarkets(nextOffset, false);
  }, [currentOffset, hasMore, searchQuery, loadMarkets]);
  
  // Handle sort change
  const handleSortChange = useCallback(async (newSortBy: string) => {
    if (newSortBy === sortBy && !searchQuery) return;
    
    setSortBy(newSortBy);
    
    // Pass the new sort value directly
    await loadMarkets(0, true, {
      sort: newSortBy
    });
  }, [sortBy, searchQuery, loadMarkets]);
  
  // Simple scroll-based infinite loading
  useEffect(() => {
    if (searchQuery || !hasMore) {
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
        loadMore();
      }
    };
    
    // Add both scroll and touchmove for better mobile support
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('touchmove', handleScroll, { passive: true });
    
    // Also check on resize
    window.addEventListener('resize', handleScroll, { passive: true });
    
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('touchmove', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [hasMore, searchQuery, loadMore]);
  
  // Manual load more button as fallback
  const handleManualLoadMore = () => {
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

      {/* End of list message */}
      {!hasMore && marketData.length > 0 && !searchQuery && (
        <div className="text-center py-4 text-gray-500">
          All {marketData.length} markets loaded
        </div>
      )}
    </>
  );
}