// hooks/useUserAnalytics.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { toast } from 'sonner';

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
  
  // Use a ref to track if we're searching for a specific address
  const isSearchingAddress = useRef(false);

  // Debounce search query
  const debouncedSearchQuery = useDebounce(filters.searchQuery, 500);

  // Function to search for a specific user address
  const searchUserByAddress = useCallback(async (address: string) => {
    setLoading(true);
    setError(null);
    isSearchingAddress.current = true;

    try {
      // Call the user-search endpoint for specific address lookup
      const response = await fetch(`/api/polymarket/user-search?address=${address}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('User not found');
          setUsers([]);
          toast.error('User not found on Polymarket');
          return;
        }
        throw new Error('Failed to fetch user');
      }

      const data = await response.json();
      
      // Set single user in the table
      setUsers([data.user]);
      setPagination({
        page: 1,
        limit: 1,
        total: 1,
        totalPages: 1,
      });

      // Show notification based on data source
      if (data.fromDatabase) {
        toast.success('User found in database');
      } else if (data.newUser) {
        toast.success('New user fetched from Polymarket');
      }

    } catch (err) {
      console.error('Error searching user:', err);
      setError(err instanceof Error ? err.message : 'Failed to search user');
      setUsers([]);
      toast.error('Failed to fetch user data');
    } finally {
      setLoading(false);
      isSearchingAddress.current = false;
    }
  }, []);

  // Function to fetch all users from database
  const fetchAllUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Build query parameters
      const params = new URLSearchParams();
      
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

      // Use the correct endpoint for fetching all users
      const response = await fetch(`/api/market/user/explorer?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users || []);
      setPagination(data.pagination || {
        page: filters.page,
        limit: 30,
        total: 0,
        totalPages: 0
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Main effect to handle fetching based on search query
  useEffect(() => {
    // Check if the debounced search query is a valid Ethereum address
    const isValidAddress = debouncedSearchQuery && 
                          debouncedSearchQuery.startsWith('0x') && 
                          debouncedSearchQuery.length === 42;

    if (isValidAddress) {
      // Search for specific user address
      searchUserByAddress(debouncedSearchQuery);
    } else if (!debouncedSearchQuery || debouncedSearchQuery.length === 0) {
      // No search query or cleared search, fetch all users
      fetchAllUsers();
    }
    // If search query exists but is not a valid address, don't fetch anything
    // This prevents unnecessary API calls while user is typing
  }, [debouncedSearchQuery, searchUserByAddress, fetchAllUsers]);

  // Effect to handle filter changes (excluding search query)
  useEffect(() => {
    // Only fetch if we're not currently searching for an address
    // and the search query is empty
    if (!filters.searchQuery && !isSearchingAddress.current) {
      fetchAllUsers();
    }
  }, [
    filters.volumeRange,
    filters.ageRange,
    filters.winRateRange,
    filters.buyRatioRange,
    filters.sellRatioRange,
    filters.largestLossRange,
    filters.highestProfitRange,
    filters.avgReturnRange,
    filters.timeframe,
    filters.page,
    filters.sortBy,
    filters.sortOrder,
    fetchAllUsers
  ]);

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
    const isValidAddress = filters.searchQuery && 
                          filters.searchQuery.startsWith('0x') && 
                          filters.searchQuery.length === 42;
    
    if (isValidAddress) {
      searchUserByAddress(filters.searchQuery);
    } else {
      fetchAllUsers();
    }
  }, [filters.searchQuery, searchUserByAddress, fetchAllUsers]);

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
  const [user, setUser] = useState<any | null>(null);
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
        // Use the user-search endpoint for detailed data
        const response = await fetch(`/api/polymarket/user-search?address=${address}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch user details');
        }

        const data = await response.json();
        setUser(data.user);
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