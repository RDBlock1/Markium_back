'use client';

import { useState, useEffect, useCallback } from 'react';
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
  const [selectedFilter, setSelectedFilter] = useState('trending'); // trending, new, etc.
  const [error, setError] = useState<string | null>(null);
  
  // Debounce search query with 500ms delay
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  
  // Build API URL with filters
  const buildApiUrl = useCallback((offset: number) => {
    let url = `${baseUrl}/api/market?limit=50&offset=${offset}&sortBy=${sortBy}`;
    
    // Add search query if present
    if (searchQuery) {
      url += `&q=${encodeURIComponent(searchQuery)}`;
    }
    
    // Add category if selected and not searching
    if (!searchQuery && selectedCategory !== 'trending') {
      url += `&category=${selectedCategory}`;
    }
    
    // Add filter if selected and not searching
    if (!searchQuery && selectedFilter) {
      url += `&filter=${selectedFilter}`;
    }
    
    return url;
  }, [sortBy, searchQuery, selectedCategory, selectedFilter]);
  
  // Handle search
  useEffect(() => {
    const handleSearch = async () => {
      if (debouncedSearchQuery.trim() === '' && searchQuery.trim() === '') {
        // If search is cleared, reload with current filters
        loadMarkets(0, true);
        return;
      }
      
      if (debouncedSearchQuery.trim().length < 2) {
        // Don't search for single characters
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(
          `${baseUrl}/api/market?q=${encodeURIComponent(debouncedSearchQuery)}&limit=50&offset=0&sortBy=${sortBy}`,
          {
            signal: AbortSignal.timeout(10000)
          }
        );
        
        if (!response.ok) throw new Error('Search failed');
        
        const data = await response.json();
        
        setMarketData(data.data);
        setHasMore(data.hasMore);
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
  
  // Load markets with filters
  const loadMarkets = useCallback(async (offset: number, replace: boolean = false) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const url = buildApiUrl(offset);
      console.log('Fetching markets from:', url);
      
      const response = await fetch(url, {
        signal: AbortSignal.timeout(10000)
      });
      
      if (!response.ok) throw new Error('Failed to load markets');
      
      const data = await response.json();
      
      if (replace) {
        setMarketData(data.data);
      } else {
        setMarketData(prev => [...prev, ...data.data]);
      }
      
      setHasMore(data.hasMore);
      setCurrentOffset(offset);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load markets');
      console.error('Error loading markets:', err);
    } finally {
      setIsLoading(false);
    }
  }, [buildApiUrl]);
  
  // Handle category change
  const handleCategoryChange = useCallback(async (category: string) => {
    if (category === selectedCategory) return;
    
    setSelectedCategory(category);
    setSelectedFilter(''); // Clear filter when changing category
    setSearchQuery(''); // Clear search
    setCurrentOffset(0);
    
    // If setting to 'all' with no filter, just reset
    if (category === 'trending') {
      loadMarkets(0, true);
    } else {
      // Load markets for the specific category
      setIsLoading(true);
      setError(null);
      
      try {
        const url = `${baseUrl}/api/market?limit=50&offset=0&sortBy=${sortBy}&category=${category}`;
        const response = await fetch(url, {
          signal: AbortSignal.timeout(10000)
        });
        
        if (!response.ok) throw new Error('Failed to load category');
        
        const data = await response.json();
        
        setMarketData(data.data);
        setHasMore(data.hasMore);
        setCurrentOffset(0);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load category');
        console.error('Error loading category:', err);
      } finally {
        setIsLoading(false);
      }
    }
  }, [selectedCategory, sortBy, loadMarkets]);
  
  // Handle filter change (trending, new)
  const handleFilterChange = useCallback(async (filter: string) => {
    if (filter === selectedFilter) return;
    
    setSelectedFilter(filter);
    setSelectedCategory('trending'); // Clear category when using filter
    setSearchQuery(''); // Clear search
    setCurrentOffset(0);
    
    setIsLoading(true);
    setError(null);
    
    try {
      const url = `${baseUrl}/api/market?limit=50&offset=0&sortBy=${sortBy}&filter=${filter}`;
      const response = await fetch(url, {
        signal: AbortSignal.timeout(10000)
      });
      
      if (!response.ok) throw new Error('Failed to load filtered markets');
      
      const data = await response.json();
      
      setMarketData(data.data);
      setHasMore(data.hasMore);
      setCurrentOffset(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load markets');
      console.error('Error loading filtered markets:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedFilter, sortBy]);
  
  // Load more markets (pagination)
  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;
    
    const nextOffset = currentOffset + 50;
    await loadMarkets(nextOffset, false);
  }, [currentOffset, hasMore, isLoading, loadMarkets]);
  
  // Handle sort change
  const handleSortChange = useCallback(async (newSortBy: string) => {
    if (newSortBy === sortBy && !searchQuery) return;
    
    setSortBy(newSortBy);
    await loadMarkets(0, true);
  }, [sortBy, searchQuery, loadMarkets]);
  
  // Prefetch next batch
  useEffect(() => {
    if (hasMore && !isLoading && !searchQuery) {
      const nextOffset = currentOffset + 50;
      // Prefetch next batch in background
      fetch(buildApiUrl(nextOffset))
        .catch(err => console.log('Prefetch error (non-critical):', err));
    }
  }, [currentOffset, hasMore, isLoading, searchQuery, buildApiUrl]);
  
  // Implement infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop 
          >= document.documentElement.offsetHeight - 100) {
        loadMore();
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMore]);
  
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
      
      {isLoading && !searchQuery && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}
      
      {error && (
        <div className="text-center py-4 text-red-500">
          {error}
          <button 
            onClick={loadMore} 
            className="ml-2 underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}
      
      {!hasMore && marketData.length > 0 && !searchQuery && (
        <div className="text-center py-4 text-gray-500">
          All markets loaded
        </div>
      )}
    </>
  );
}