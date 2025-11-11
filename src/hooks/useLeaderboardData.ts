import { useState, useEffect } from 'react';

export interface LeaderboardEntry {
  id: string;
  rank: number;
  username: string;
  profileImage: string;
  walletAddress: string;
  volume?: number;
  profit?: number;
  change: number;
}

interface LeaderboardData {
  volume: LeaderboardEntry[];
  profit: LeaderboardEntry[];
}

type Period = 'day' | 'week' | 'month' | 'all';

const periodMap: Record<string, Period> = {
  'Today': 'day',
  'Weekly': 'week',
  'Monthly': 'month',
  'All': 'all'
};

export function useLeaderboardData(timePeriod: string, limit: number = 20,category:string='overall') {
  const [data, setData] = useState<LeaderboardData>({ volume: [], profit: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const period = periodMap[timePeriod] || 'week';
        const response = await fetch(`/api/leaderboard?type=both&period=${period}&limit=${limit}&category=${category}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.statusText}`);
        }
        
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch leaderboard data');
        console.error('Error fetching leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timePeriod, limit,category]);

  return { data, loading, error };
}