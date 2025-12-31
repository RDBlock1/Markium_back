/* eslint-disable react-hooks/exhaustive-deps */
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
const debouncedFilters = useDebounce(
  {
    volumeRange: filters.volumeRange,
    ageRange: filters.ageRange,
    winRateRange: filters.winRateRange,
    buyRatioRange: filters.buyRatioRange,
    sellRatioRange: filters.sellRatioRange,
    largestLossRange: filters.largestLossRange,
    highestProfitRange: filters.highestProfitRange,
    avgReturnRange: filters.avgReturnRange,
    timeframe: filters.timeframe,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  },
  1000 // 500ms delay
);

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
    
    if (debouncedFilters.volumeRange[0] !== 0 || debouncedFilters.volumeRange[1] !== 500) {
      params.append('volumeRange', JSON.stringify(debouncedFilters.volumeRange));
    }
    
    if (debouncedFilters.ageRange[0] !== 0 || debouncedFilters.ageRange[1] !== 365) {
      params.append('ageRange', JSON.stringify(debouncedFilters.ageRange));
    }
    
    if (debouncedFilters.winRateRange[0] !== 0 || debouncedFilters.winRateRange[1] !== 100) {
      params.append('winRateRange', JSON.stringify(debouncedFilters.winRateRange));
    }
    
    if (debouncedFilters.buyRatioRange[0] !== 0 || debouncedFilters.buyRatioRange[1] !== 100) {
      params.append('buyRatioRange', JSON.stringify(debouncedFilters.buyRatioRange));
    }
    
    if (debouncedFilters.sellRatioRange[0] !== 0 || debouncedFilters.sellRatioRange[1] !== 100) {
      params.append('sellRatioRange', JSON.stringify(debouncedFilters.sellRatioRange));
    }
    
    if (debouncedFilters.largestLossRange[0] !== -100 || debouncedFilters.largestLossRange[1] !== 0) {
      params.append('largestLossRange', JSON.stringify(debouncedFilters.largestLossRange));
    }
    
    if (debouncedFilters.highestProfitRange[0] !== 0 || debouncedFilters.highestProfitRange[1] !== 100) {
      params.append('highestProfitRange', JSON.stringify(debouncedFilters.highestProfitRange));
    }
    
    if (debouncedFilters.avgReturnRange[0] !== 0 || debouncedFilters.avgReturnRange[1] !== 50) {
      params.append('avgReturnRange', JSON.stringify(debouncedFilters.avgReturnRange));
    }

    params.append('timeframe', debouncedFilters.timeframe);
    params.append('page', filters.page.toString());
    params.append('limit', filters.limit.toString());
    params.append('sortBy', debouncedFilters.sortBy);
    params.append('sortOrder', debouncedFilters.sortOrder);

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
  debouncedFilters.volumeRange,
  debouncedFilters.ageRange,
  debouncedFilters.winRateRange,
  debouncedFilters.buyRatioRange,
  debouncedFilters.sellRatioRange,
  debouncedFilters.largestLossRange,
  debouncedFilters.highestProfitRange,
  debouncedFilters.avgReturnRange,
  debouncedFilters.timeframe,
  debouncedFilters.sortBy,
  debouncedFilters.sortOrder,
  filters.page,
  filters.limit,
]);

const debouncedSearchQuery = useDebounce(filters.searchQuery, 300);

useEffect(() => {
  if (!debouncedSearchQuery || debouncedSearchQuery.length === 0) {
    // No search query, fetch all users
    if (!isSearchingAddress.current) {
      fetchAllUsers();
    }
    return;
  }

  // Check if it's an address or username
  if (isValidAddress(debouncedSearchQuery)) {
    searchUserByAddress(debouncedSearchQuery);
  } else {
    searchUserByUsername(debouncedSearchQuery);
  }
}, [
  debouncedSearchQuery,
  debouncedFilters.volumeRange,
  debouncedFilters.ageRange,
  debouncedFilters.winRateRange,
  debouncedFilters.buyRatioRange,
  debouncedFilters.sellRatioRange,
  debouncedFilters.largestLossRange,
  debouncedFilters.highestProfitRange,
  debouncedFilters.avgReturnRange,
  debouncedFilters.timeframe,
  debouncedFilters.sortBy,
  debouncedFilters.sortOrder,
  filters.page,
  searchUserByAddress,
  searchUserByUsername,
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