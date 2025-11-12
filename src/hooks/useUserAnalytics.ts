/* eslint-disable @typescript-eslint/no-explicit-any */
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
  
  const isSearchingAddress = useRef(false);
  const debouncedSearchQuery = useDebounce(filters.searchQuery, 500);

  // Check if input is a valid Ethereum address
  const isValidAddress = (input: string): boolean => {
    return input.startsWith('0x') && input.length === 42;
  };

  // Function to search by username
  const searchUserByUsername = useCallback(async (username: string) => {
    setLoading(true);
    setError(null);
    isSearchingAddress.current = true;

    try {
      const response = await fetch(`/api/polymarket/user?username=${encodeURIComponent(username)}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('User not found');
          setUsers([]);
          toast.error('User not found on Polymarket');
          return;
        }
        throw new Error('Failed to fetch user');
      }

      const userData = await response.json();
      
      // Get the proxy wallet address from the username search
      const proxyWallet = userData.proxyWallet;
      
      if (!proxyWallet) {
        setError('No proxy wallet found for this user');
        setUsers([]);
        toast.error('No proxy wallet found for this user');
        return;
      }

      // Now fetch the user's trading data using the proxy wallet address
      const userDataResponse = await fetch(`/api/polymarket/user-search?address=${proxyWallet}`);
      
      if (!userDataResponse.ok) {
        throw new Error('Failed to fetch user trading data');
      }

      const tradingData = await userDataResponse.json();
      
      setUsers([tradingData.user]);
      setPagination({
        page: 1,
        limit: 1,
        total: 1,
        totalPages: 1,
      });

      if (tradingData.fromDatabase) {
        toast.success('User found in database');
      } else if (tradingData.newUser) {
        toast.success('New user fetched from Polymarket');
      }

    } catch (err) {
      console.error('Error searching user by username:', err);
      setError(err instanceof Error ? err.message : 'Failed to search user');
      setUsers([]);
      toast.error('Failed to fetch user data');
    } finally {
      setLoading(false);
      isSearchingAddress.current = false;
    }
  }, []);

  // Function to search by address
  const searchUserByAddress = useCallback(async (address: string) => {
    setLoading(true);
    setError(null);
    isSearchingAddress.current = true;

    try {
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
      
      setUsers([data.user]);
      setPagination({
        page: 1,
        limit: 1,
        total: 1,
        totalPages: 1,
      });

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

  // Memoized function to fetch all users from database
  const fetchAllUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      
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
  ]);

  // Main effect to handle fetching based on DEBOUNCED search query
  useEffect(() => {
    if (!debouncedSearchQuery || debouncedSearchQuery.length === 0) {
      // No search query, fetch all users
      fetchAllUsers();
      return;
    }

    // Check if it's an address or username
    if (isValidAddress(debouncedSearchQuery)) {
      // Search by address
      searchUserByAddress(debouncedSearchQuery);
    } else {
      // Search by username
      searchUserByUsername(debouncedSearchQuery);
    }
  }, [debouncedSearchQuery, searchUserByAddress, searchUserByUsername, fetchAllUsers]);

  // Effect to handle filter changes (excluding search query and page)
  useEffect(() => {
    // Only fetch if there's no search query and we're not currently searching
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
      page: key === 'page' ? value : 1,
    }));
  }, []);

  const updateFilters = useCallback((updates: Partial<Filters>) => {
    setFilters(prev => ({
      ...prev,
      ...updates,
      page: updates.page || 1,
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const refreshData = useCallback(() => {
    if (!filters.searchQuery) {
      fetchAllUsers();
      return;
    }

    if (isValidAddress(filters.searchQuery)) {
      searchUserByAddress(filters.searchQuery);
    } else {
      searchUserByUsername(filters.searchQuery);
    }
  }, [filters.searchQuery, searchUserByAddress, searchUserByUsername, fetchAllUsers]);

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