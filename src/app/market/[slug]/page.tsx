'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import MarketDetailSection from "@/components/market/market-detail-section";
import MarketPageSkeleton from "@/components/ui/maket-page-skeleton";
import { baseUrl } from "@/utils";
import { PolymarketEvent } from "@/types";

interface MarketAPIResponse {
  data: PolymarketEvent;  // Changed from array to single object
  success: boolean;
  error?: string;
}

// API function for fetching market data
async function fetchMarketData(slug: string): Promise<PolymarketEvent> {
  const response = await fetch(`${baseUrl}/api/slug-market`, {
    method: 'POST',
    body: JSON.stringify({ slug }),
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch market: ${response.status}`);
  }

  const result: MarketAPIResponse = await response.json();
  console.log('Fetched market data:', result);

  
  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch market data');
  }

  if (!result.data) {
    throw new Error('Market not found');
  }

  return result.data;  // Return data directly, not data[0]
}

// Error component
function MarketError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4 text-red-600">Error Loading Market</h1>
        <p className="text-gray-600 mb-6">{error.message}</p>
        <div className="space-y-4">
          <button 
            onClick={onRetry}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg mr-4"
          >
            Try Again
          </button>
          <button 
            onClick={() => window.history.back()}
            className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}

// Main client-side market page component
export default function ClientMarketPage() {
  const params = useParams();
  const slug = params.slug as string;

  const {
    data: marketData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['market', slug],
    queryFn: () => fetchMarketData(slug),
    enabled: !!slug,
    staleTime: 60 * 1000, // 1 minute
    retry: (failureCount, error) => {
      // Don't retry on 404 errors
      if (error.message.includes('404') || error.message.includes('not found')) {
        return false;
      }
      // Retry up to 3 times for other errors
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });



  if (error) {
    return (
      <div className="overflow-y-auto min-h-screen">
        <MarketError error={error as Error} onRetry={() => refetch()} />
      </div>
    );
  }

  if (!marketData) {
    return (
      <div className="overflow-y-auto min-h-screen">
      </div>
    );
  }

  return (
    <div className="overflow-y-auto min-h-screen">
      <MarketDetailSection 
        params={{ slug }} 
        marketData={marketData}
      />
    </div>
  );
}