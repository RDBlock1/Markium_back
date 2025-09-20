// hooks/useUserAnalytics.ts
import { useState, useEffect, useCallback } from 'react';
import { useDebounce } from '@/hooks/useDebounce';

interface User {
  address: string;
  tradingVolume: number;
  winRate: number;
  avgReturn: number;
  trades: number;
  largestLoss: number;
  highestProfit: number;
  buyPercentage: number;
  sellPercentage: number;
  walletAge: number;
  // Additional fields for detailed view
  positionValue?: number;
  mostTradedCategory?: string;
  tradingStyle?: string;
  riskProfile?: string;
  avgMonthlyProfit?: number;
  avgMonthlyTrades?: number;
  marketDistribution?: any[];
  tradeSizeData?: any;
  priceStats?: any;
  monthlyPerformance?: any[];
  weeklyWinRate?: any[];
}

interface Filters {
  searchQuery: string;
  volumeRange: [number, number];
  ageRange: [number, number];
  winRateRange: [number, number];
  buyRatioRange: [number, number];
  sellRatioRange: [number, number];
  largestLossRange: [number, number];
  highestProfitRange: [number, number];
  avgReturnRange: [number, number];
  tradesRange?: [number, number];
  timeframe: 'daily' | 'weekly' | 'monthly' | 'all';
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface UseUserAnalyticsReturn {
  users: User[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: Filters;
  updateFilter: (key: keyof Filters, value: any) => void;
  updateFilters: (updates: Partial<Filters>) => void;
  resetFilters: () => void;
  refreshData: () => void;
}

const defaultFilters: Filters = {
  searchQuery: '',
  volumeRange: [0, 500],
  ageRange: [0, 365],
  winRateRange: [0, 100],
  buyRatioRange: [0, 100],
  sellRatioRange: [0, 100],
  largestLossRange: [-100, 0],
  highestProfitRange: [0, 100],
  avgReturnRange: [0, 50],
  timeframe: 'all',
  page: 1,
  limit: 30,
  sortBy: 'totalVolume',
  sortOrder: 'desc',
};

export function useUserAnalytics(): UseUserAnalyticsReturn {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 30,
    total: 0,
    totalPages: 0,
  });

  // Debounce search query
  const debouncedSearchQuery = useDebounce(filters.searchQuery, 500);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Build query parameters
      const params = new URLSearchParams();
      
      // Use debounced search query
      if (debouncedSearchQuery) {
        params.append('searchQuery', debouncedSearchQuery);
      }
      
      // Add range filters only if they're not at default values
      if (filters.volumeRange[0] !== 0 || filters.volumeRange[1] !== 500) {
        params.append('volumeRange', JSON.stringify(filters.volumeRange));
      }
      
      if (filters.ageRange[0] !== 0 || filters.ageRange[1] !== 365) {
        params.append('ageRange', JSON.stringify(filters.ageRange));
      }
      
      if (filters.winRateRange[0] !== 0 || filters.winRateRange[1] !== 100) {
        params.append('winRateRange', JSON.stringify(filters.winRateRange));
      }
      
      if (filters.buyRatioRange[0] !== 0 || filters.buyRatioRange[1] !== 100) {
        params.append('buyRatioRange', JSON.stringify(filters.buyRatioRange));
      }
      
      if (filters.sellRatioRange[0] !== 0 || filters.sellRatioRange[1] !== 100) {
        params.append('sellRatioRange', JSON.stringify(filters.sellRatioRange));
      }
      
      if (filters.largestLossRange[0] !== -100 || filters.largestLossRange[1] !== 0) {
        params.append('largestLossRange', JSON.stringify(filters.largestLossRange));
      }
      
      if (filters.highestProfitRange[0] !== 0 || filters.highestProfitRange[1] !== 100) {
        params.append('highestProfitRange', JSON.stringify(filters.highestProfitRange));
      }
      
      if (filters.avgReturnRange[0] !== 0 || filters.avgReturnRange[1] !== 50) {
        params.append('avgReturnRange', JSON.stringify(filters.avgReturnRange));
      }

      // Add other filters
      params.append('timeframe', filters.timeframe);
      params.append('page', filters.page.toString());
      params.append('limit', filters.limit.toString());
      params.append('sortBy', filters.sortBy);
      params.append('sortOrder', filters.sortOrder);

      const response = await fetch(`/api/market/user/explorer?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, debouncedSearchQuery]);

  // Fetch users when filters change
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const updateFilter = useCallback((key: keyof Filters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      // Reset page to 1 when filters change (except page itself)
      page: key === 'page' ? value : 1,
    }));
  }, []);

  const updateFilters = useCallback((updates: Partial<Filters>) => {
    setFilters(prev => ({
      ...prev,
      ...updates,
      // Reset page to 1 when filters change (except page itself)
      page: updates.page || 1,
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const refreshData = useCallback(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    error,
    pagination,
    filters,
    updateFilter,
    updateFilters,
    resetFilters,
    refreshData,
  };
}


export function useUserDetails(address: string | null) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) {
      setUser(null);
      return;
    }

    const fetchUserDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/users/analytics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ address }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user details');
        }

        const data = await response.json();
        setUser(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching user details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [address]);

  return { user, loading, error };
}
