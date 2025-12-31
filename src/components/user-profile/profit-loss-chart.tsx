'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Line, 
  LineChart, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Area, 
  AreaChart,
  TooltipProps
} from 'recharts';
import { TrendingUp, TrendingDown, Info } from 'lucide-react';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

// Type definitions
interface PolymarketDataPoint {
  t: number; // timestamp in seconds
  p: number; // profit/loss value
}

interface ChartDataPoint {
  timestamp: number;
  date: string;
  value: number;
  profit: number;
}

interface Interval {
  label: string;
  value: IntervalType;
}

interface CalculatedMetrics {
  currentValue: number;
  percentageChange: number;
  isProfit: boolean;
}

interface ApiErrorResponse {
  error: string;
}

type IntervalType = '1d' | '1w' | '1m' | 'all';
type Props = {
  userAddress: string;
}
const ProfitLossChart: React.FC<Props> = (props: Props) => {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedInterval, setSelectedInterval] = useState<IntervalType>('all');
  const [error, setError] = useState<string | null>(null);
  const userAddress = props.userAddress;
  
  const intervals: Interval[] = [
    { label: '1D', value: '1d' },
    { label: '1W', value: '1w' },
    { label: '1M', value: '1m' },
    { label: 'ALL', value: 'all' }
  ];

  const fetchData = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        user_address: userAddress,
        interval: selectedInterval,
        fidelity: '1d'
      });

      const response = await fetch(`/api/market/user/profit-stats?${params}`);
      
      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json().catch(() => ({
          error: 'Failed to parse error response'
        }));
        throw new Error(errorData.error || `Failed to fetch data (${response.status})`);
      }
      
      const result: PolymarketDataPoint[] = await response.json();
      
      // Validate the response structure
      if (!Array.isArray(result)) {
        throw new Error('Invalid data format received');
      }
      
      // Transform and validate data for the chart
      const transformedData: ChartDataPoint[] = result.map((item) => {
        if (typeof item.t !== 'number' || typeof item.p !== 'number') {
          throw new Error('Invalid data point structure');
        }
        
        return {
          timestamp: item.t * 1000, // Convert to milliseconds
          date: new Date(item.t * 1000).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          }),
          value: item.p,
          profit: item.p
        };
      });
      
      setData(transformedData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedInterval, userAddress]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const metrics: CalculatedMetrics = useMemo(() => {
    if (data.length === 0) {
      return { 
        currentValue: 0, 
        percentageChange: 0, 
        isProfit: true 
      };
    }
    
    const current = data[data.length - 1]?.value ?? 0;
    const initial = data[0]?.value ?? 0;
    const change = initial !== 0 
      ? ((current - initial) / Math.abs(initial)) * 100 
      : 0;
    
    return {
      currentValue: current,
      percentageChange: change,
      isProfit: current >= 0
    };
  }, [data]);

  const formatValue = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatAxisValue = (value: number): string => {
    if (value >= 1000 || value <= -1000) {
      return `$${(value / 1000).toFixed(1)}k`;
    }
    return `$${value}`;
  };

  interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{ payload?: ChartDataPoint }>;
    label?: string | number;
  }

  const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
    if (active && payload && payload.length > 0 && payload[0].payload) {
      const data = payload[0].payload as ChartDataPoint;
      return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-lg">
          <p className="text-slate-400 text-xs mb-1">{data.date}</p>
          <p className="text-white font-semibold">{formatValue(data.value)}</p>
        </div>
      );
    }
    return null;
  };

  const getIntervalLabel = (interval: IntervalType): string => {
    const labels: Record<IntervalType, string> = {
      '1d': 'Past Day',
      '1w': 'Past Week',
      '1m': 'Past Month',
      'all': 'All Time'
    };
    return labels[interval];
  };

  const gradientId = metrics.isProfit ? 'profitGradient' : 'lossGradient';

  return (
              <div className="bg-zinc-900/80 border rounded-2xl p-4 border-zinc-800 backdrop-blur-xl shadow-2xl shadow-black/50 hover:shadow-emerald-400/5 hover:border-emerald-400/20 transition-all duration-300">
      {/* Header Section */}
      <div className="">
        <div className="flex items-center gap-2 mb-2">
          <div className={`flex items-center gap-1 ${metrics.isProfit ? 'text-green-500' : 'text-red-500'}`}>
            {metrics.isProfit ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            <span className="text-sm font-medium">Profit/Loss</span>
          </div>
          <button 
            className="text-slate-500 hover:text-slate-400 transition-colors"
            aria-label="More information"
          >
            <Info size={16} />
          </button>
        </div>
        
        <div className="flex items-baseline gap-3">
          <h2 className="text-4xl font-bold text-white">
            {formatValue(metrics.currentValue)}
          </h2>
          {metrics.percentageChange !== 0 && (
            <span className={`text-sm font-medium ${metrics.isProfit ? 'text-green-400' : 'text-red-400'}`}>
              {metrics.percentageChange > 0 ? '+' : ''}{metrics.percentageChange.toFixed(2)}%
            </span>
          )}
        </div>
        
        <p className="text-slate-500 text-sm mt-1">
          {getIntervalLabel(selectedInterval)}
        </p>
      </div>

      {/* Time Interval Buttons */}
      <div className="flex gap-2 mb-6">
        {intervals.map((interval) => (
          <button
            key={interval.value}
            onClick={() => setSelectedInterval(interval.value)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              selectedInterval === interval.value
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300'
            }`}
            aria-pressed={selectedInterval === interval.value}
          >
            {interval.label}
          </button>
        ))}
      </div>

      {/* Chart Section */}
      <div className="h-64 w-full">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div 
              className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"
              role="status"
              aria-label="Loading"
            />
          </div>
        ) : error ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-red-400">Error loading data: {error}</p>
          </div>
        ) : data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart 
              data={data} 
              margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
                </linearGradient>
                <linearGradient id="lossGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05}/>
                </linearGradient>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#22d3ee" />
                  <stop offset="50%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#818cf8" />
                </linearGradient>
                <linearGradient id="lineGradientProfit" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="50%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#22c55e" />
                </linearGradient>
                <linearGradient id="lineGradientLoss" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#f87171" />
                  <stop offset="50%" stopColor="#ef4444" />
                  <stop offset="100%" stopColor="#fb923c" />
                </linearGradient>
              </defs>
              
              <CartesianGrid strokeDasharray="3 3" stroke="#475569" opacity={0.2} />
              
              <XAxis 
                dataKey="date" 
                stroke="#94a3b8"
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                axisLine={{ stroke: '#475569' }}
              />
              
              <YAxis 
                stroke="#94a3b8"
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                axisLine={{ stroke: '#475569' }}
                tickFormatter={formatAxisValue}
              />
              
              <Tooltip content={<CustomTooltip />} />
              
              <Area
                type="monotone"
                dataKey="profit"
                stroke="none"
                fill={`url(#${gradientId})`}
              />
              
              <Line
                type="monotone"
                dataKey="value"
                stroke={metrics.isProfit ? "url(#lineGradientProfit)" : "url(#lineGradientLoss)"}
                strokeWidth={10}
                dot={false}
                activeDot={{ r: 6, fill: metrics.isProfit ? '#10b981' : '#ef4444', stroke: '#1e293b', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-slate-400">No data available</p>
          </div>
        )}
      </div>


    </div>
  );
};

export default ProfitLossChart;