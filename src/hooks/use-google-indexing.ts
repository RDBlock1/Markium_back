// hooks/use-google-indexing.ts
'use client';

import { useState, useCallback, useEffect } from 'react';
import { 
  requestIndexing, 
  requestBatchIndexing, 
  checkIndexingStatus,
  generateFullUrl,
  indexingQueue 
} from '@/lib/indexing-utils';
import { IndexingType } from '@/lib/google-indexing';

export interface UseGoogleIndexingOptions {
  autoIndex?: boolean;
  delayMs?: number;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

export interface IndexingState {
  loading: boolean;
  success: boolean | null;
  error: string | null;
  data: any | null;
}

// Hook for single URL indexing
export function useGoogleIndexing(options?: UseGoogleIndexingOptions) {
  const [state, setState] = useState<IndexingState>({
    loading: false,
    success: null,
    error: null,
    data: null,
  });

  const indexUrl = useCallback(async (
    url: string,
    type: IndexingType = 'URL_UPDATED'
  ) => {
    setState({ loading: true, success: null, error: null, data: null });
    
    try {
      const result = await requestIndexing(url, type);
      
      setState({
        loading: false,
        success: result.success,
        error: result.error || null,
        data: result,
      });
      
      if (result.success && options?.onSuccess) {
        options.onSuccess(result);
      } else if (!result.success && options?.onError) {
        options.onError(result.error || 'Indexing failed');
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState({
        loading: false,
        success: false,
        error: errorMessage,
        data: null,
      });
      
      if (options?.onError) {
        options.onError(errorMessage);
      }
      
      throw error;
    }
  }, [options]);

  const indexCurrentPage = useCallback(async (
    type: IndexingType = 'URL_UPDATED'
  ) => {
    const url = generateFullUrl(window.location.pathname);
    return indexUrl(url, type);
  }, [indexUrl]);

  const getStatus = useCallback(async (url: string) => {
    setState({ loading: true, success: null, error: null, data: null });
    
    try {
      const result = await checkIndexingStatus(url);
      
      setState({
        loading: false,
        success: result.success,
        error: result.error || null,
        data: result.data,
      });
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState({
        loading: false,
        success: false,
        error: errorMessage,
        data: null,
      });
      
      throw error;
    }
  }, []);

  // Auto-index on mount if enabled
  useEffect(() => {
    if (options?.autoIndex && typeof window !== 'undefined') {
      const url = generateFullUrl(window.location.pathname);
      indexUrl(url, 'URL_UPDATED');
    }
  }, [options?.autoIndex, indexUrl]);

  return {
    ...state,
    indexUrl,
    indexCurrentPage,
    getStatus,
  };
}

// Hook for batch URL indexing
export function useBatchIndexing(options?: UseGoogleIndexingOptions) {
  const [state, setState] = useState<IndexingState>({
    loading: false,
    success: null,
    error: null,
    data: null,
  });

  const indexUrls = useCallback(async (
    urls: string[],
    type: IndexingType = 'URL_UPDATED'
  ) => {
    setState({ loading: true, success: null, error: null, data: null });
    
    try {
      const result = await requestBatchIndexing(
        urls, 
        type, 
        options?.delayMs || 1000
      );
      
      setState({
        loading: false,
        success: result.success,
        error: result.error || null,
        data: result,
      });
      
      if (result.success && options?.onSuccess) {
        options.onSuccess(result);
      } else if (!result.success && options?.onError) {
        options.onError(result.error || 'Batch indexing failed');
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState({
        loading: false,
        success: false,
        error: errorMessage,
        data: null,
      });
      
      if (options?.onError) {
        options.onError(errorMessage);
      }
      
      throw error;
    }
  }, [options]);

  return {
    ...state,
    indexUrls,
  };
}

// Hook for managing indexing queue
export function useIndexingQueue() {
  const [queueSize, setQueueSize] = useState(0);

  const addToQueue = useCallback((
    url: string,
    type: IndexingType = 'URL_UPDATED'
  ) => {
    indexingQueue.add({ url, type });
    setQueueSize(indexingQueue.getQueueSize());
  }, []);

  const clearQueue = useCallback(() => {
    indexingQueue.clearQueue();
    setQueueSize(0);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setQueueSize(indexingQueue.getQueueSize());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    queueSize,
    addToQueue,
    clearQueue,
  };
}

// Hook for auto-indexing on route changes
export function useAutoIndexing(enabled: boolean = true) {
  const { indexUrl } = useGoogleIndexing();
  
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const handleRouteChange = () => {
      const url = generateFullUrl(window.location.pathname);
      // Only index actual pages, not API routes or static files
      if (!url.includes('/api/') && !url.includes('/_next/')) {
        indexUrl(url, 'URL_UPDATED').catch(console.error);
      }
    };

    // Listen for route changes (Next.js specific)
    window.addEventListener('popstate', handleRouteChange);
    
    // Also index current page on mount
    handleRouteChange();

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [enabled, indexUrl]);
}