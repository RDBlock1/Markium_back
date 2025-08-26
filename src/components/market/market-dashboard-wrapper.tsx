'use client';

import { useState, useEffect, useCallback } from 'react';
import MarketDashboard from '@/components/market/market-dashboard';
import { baseUrl } from '@/utils';
import { MarketSlug } from '@/types/market';

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
  const [error, setError] = useState<string | null>(null);
  
  // Load more markets (pagination)
  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const nextOffset = currentOffset + 50;
      const response = await fetch(
        `${baseUrl}/api/market?limit=50&offset=${nextOffset}&sortBy=${sortBy}`,
        {
          signal: AbortSignal.timeout(10000) // 10 second timeout
        }
      );
      
      if (!response.ok) throw new Error('Failed to load more markets');
      
      const data = await response.json();
      
      setMarketData(prev => [...prev, ...data.data]);
      setHasMore(data.hasMore);
      setCurrentOffset(nextOffset);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load markets');
      console.error('Error loading more markets:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentOffset, hasMore, isLoading, sortBy]);
  
  // Handle sort change
  const handleSortChange = useCallback(async (newSortBy: string) => {
    if (newSortBy === sortBy) return;
    
    setIsLoading(true);
    setError(null);
    setSortBy(newSortBy);
    
    try {
      const response = await fetch(
        `${baseUrl}/api/market?limit=50&offset=0&sortBy=${newSortBy}`,
        {
          signal: AbortSignal.timeout(10000)
        }
      );
      
      if (!response.ok) throw new Error('Failed to sort markets');
      
      const data = await response.json();
      
      setMarketData(data.data);
      setHasMore(data.hasMore);
      setCurrentOffset(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sort markets');
      console.error('Error sorting markets:', err);
    } finally {
      setIsLoading(false);
    }
  }, [sortBy]);
  
  // Prefetch next batch
  useEffect(() => {
    if (hasMore && !isLoading) {
      const nextOffset = currentOffset + 50;
      // Prefetch next batch in background
      fetch(`${baseUrl}/api/market?limit=50&offset=${nextOffset}&sortBy=${sortBy}`)
        .catch(err => console.log('Prefetch error (non-critical):', err));
    }
  }, [currentOffset, hasMore, isLoading, sortBy]);
  
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
      />
      
      {isLoading && (
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
      
      {!hasMore && marketData.length > 0 && (
        <div className="text-center py-4 text-gray-500">
          All markets loaded
        </div>
      )}
    </>
  );
}