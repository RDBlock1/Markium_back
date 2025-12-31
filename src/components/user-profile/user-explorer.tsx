/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useState, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  SlidersHorizontal,
  Copy,
  TrendingUp,
  TrendingDown,
  LayoutGrid,
  LayoutList,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Wallet,
  Activity,
  Target,
  DollarSign,
  BarChart3,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  User,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserAnalytics } from "@/hooks/useUserAnalytics";
import { toast } from "sonner";
import Link from "next/link";

// Filter Slider Component
const FilterSlider = ({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  prefix = "",
  suffix = "",
}:any) => (
  <div className="space-y-3" data-testid={`filter-${label.toLowerCase().replace(/\s+/g, '-')}`}>
    <div className="flex justify-between items-center">
      <span className="text-sm font-medium text-slate-300">{label}</span>
      <span className="text-sm font-semibold text-white">
        {prefix}{value[0]}{suffix} - {prefix}{value[1]}{suffix}
      </span>
    </div>
    <Slider
      value={value}
      onValueChange={onChange}
      min={min}
      max={max}
      step={step}
      className="w-full"
    />
  </div>
);



// User Card Component
const UserCard = ({ user, onCopyAddress }:any) => {
  const isProfitable = user.avgReturn > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group relative"
      data-testid={`user-card-${user.address}`}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <Card className="relative bg-slate-800/80 border-slate-700/50 rounded-2xl overflow-hidden backdrop-blur-sm hover:border-cyan-500/50 transition-all duration-300">
        <CardContent className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                  <Wallet className="h-6 w-6 text-white" />
                </div>
                <div
                  className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-800 ${isProfitable ? "bg-emerald-500" : "bg-rose-500"
                    }`}
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-sm text-cyan-400 font-medium">
                    {user.address.slice(0, 6)}...{user.address.slice(-4)}
                  </p>
                  <button
                    onClick={() => onCopyAddress(user.address)}
                    className="p-1 hover:bg-slate-700/50 rounded transition-colors"
                  >
                    <Copy className="h-3.5 w-3.5 text-slate-400 hover:text-cyan-400" />
                  </button>
                </div>
                {user.username && (
                  <p className="text-xs text-slate-400">@{user.username}</p>
                )}
              </div>
            </div>
            <Badge
              variant="outline"
              className={`${user.riskProfile === "High"
                  ? "border-rose-500/50 text-rose-400 bg-rose-500/10"
                  : user.riskProfile === "Medium"
                    ? "border-amber-500/50 text-amber-400 bg-amber-500/10"
                    : "border-emerald-500/50 text-emerald-400 bg-emerald-500/10"
                }`}
            >
              {user.riskProfile}
            </Badge>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-slate-900/50 rounded-xl p-3">
              <p className="text-xs text-slate-400 mb-1">Volume</p>
              <p className="text-lg font-bold text-white">
                ${(user.tradingVolume / 1000).toFixed(1)}k
              </p>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-3">
              <p className="text-xs text-slate-400 mb-1">Win Rate</p>
              <p
                className={`text-lg font-bold ${user.winRate >= 50 ? "text-emerald-400" : "text-rose-400"
                  }`}
              >
                {user.winRate.toFixed(1)}%
              </p>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-3">
              <p className="text-xs text-slate-400 mb-1">Avg Return</p>
              <p
                className={`text-lg font-bold ${user.avgReturn >= 0 ? "text-emerald-400" : "text-rose-400"
                  }`}
              >
                {user.avgReturn >= 0 ? "+" : ""}
                {user.avgReturn.toFixed(1)}%
              </p>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-3">
              <p className="text-xs text-slate-400 mb-1">Total Trades</p>
              <p className="text-lg font-bold text-white">{user.trades}</p>
            </div>
          </div>

          {/* Performance Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-slate-400 mb-2">
              <span>Buy {user.buyPercentage}%</span>
              <span>Sell {user.sellPercentage}%</span>
            </div>
            <div className="h-2 bg-slate-900 rounded-full overflow-hidden flex">
              <div
                className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full transition-all"
                style={{ width: `${user.buyPercentage}%` }}
              />
              <div
                className="bg-gradient-to-r from-rose-400 to-rose-500 h-full transition-all"
                style={{ width: `${user.sellPercentage}%` }}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Clock className="h-3.5 w-3.5" />
              <span>{user.walletAge} days old</span>
            </div>
            <Button
              size="sm"
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white border-0 text-xs h-8"
              data-testid={`view-profile-${user.address}`}
            >
              View Profile
              <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// User Table Row Component
const UserTableRow = ({ user, onCopyAddress }:any) => {
  const isProfitable = user.avgReturn > 0;

  return (
    <TableRow
      className="border-slate-700/50 hover:bg-slate-800/50 transition-colors group"
      data-testid={`user-row-${user.address}`}
    >
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-lg bg-slate-500/50 flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
            <div
              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${isProfitable ? "bg-emerald-500" : "bg-rose-500"
                }`}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-cyan-400 font-medium">
                {user.address.slice(0, 6)}...{user.address.slice(-4)}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCopyAddress(user.address);
                }}
                className="p-1 opacity-0 group-hover:opacity-100 hover:bg-slate-700/50 rounded transition-all"
              >
                <Copy className="h-3 w-3 text-slate-400 hover:text-cyan-400" />
              </button>
            </div>
            {user.username && (
              <p className="text-xs text-slate-500">@{user.username}</p>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <span className="font-semibold text-white">
          ${user.tradingVolume.toLocaleString()}
        </span>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1.5">
          {user.winRate >= 50 ? (
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          ) : (
            <TrendingDown className="h-4 w-4 text-rose-400" />
          )}
          <span
            className={`font-semibold ${user.winRate >= 50 ? "text-emerald-400" : "text-rose-400"
              }`}
          >
            {user.winRate.toFixed(1)}%
          </span>
        </div>
      </TableCell>
      <TableCell>
        <span
          className={`font-semibold ${user.avgReturn >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
        >
          {user.avgReturn >= 0 ? "+" : ""}
          {user.avgReturn.toFixed(1)}%
        </span>
      </TableCell>
      <TableCell>
        <span className="text-slate-300 font-medium">{user.trades}</span>
      </TableCell>
      <TableCell>
        <span className="text-rose-400 font-semibold">
          {user.largestLoss.toFixed(1)}%
        </span>
      </TableCell>
      <TableCell>
        <span className="text-emerald-400 font-semibold">
          +{user.highestProfit.toFixed(1)}%
        </span>
      </TableCell>
      <TableCell>
        <Badge
          variant="outline"
          className={`${user.riskProfile === "High"
              ? "border-rose-500/50 text-rose-400 bg-rose-500/10"
              : user.riskProfile === "Medium"
                ? "border-amber-500/50 text-amber-400 bg-amber-500/10"
                : "border-emerald-500/50 text-emerald-400 bg-emerald-500/10"
            }`}
        >
          {user.riskProfile}
        </Badge>
      </TableCell>
      <TableCell>
        <Link href={`/user-profile/${user.address}`} className="text-cyan-400 hover:text-cyan-300">
          View Profile
        </Link>
      </TableCell>
    </TableRow>
  );
};

// Loading Skeleton Components
const CardSkeleton = () => (
  <Card className="bg-slate-800/80 border-slate-700/50 rounded-2xl overflow-hidden">
    <CardContent className="p-5">
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="w-12 h-12 rounded-xl bg-slate-700" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32 bg-slate-700" />
          <Skeleton className="h-3 w-20 bg-slate-700" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl bg-slate-700" />
        ))}
      </div>
      <Skeleton className="h-2 w-full rounded-full bg-slate-700 mb-4" />
      <div className="flex justify-between pt-3 border-t border-slate-700/50">
        <Skeleton className="h-4 w-24 bg-slate-700" />
        <Skeleton className="h-8 w-28 rounded-md bg-slate-700" />
      </div>
    </CardContent>
  </Card>
);

const TableRowSkeleton = () => (
  <TableRow className="border-slate-700/50">
    {[...Array(9)].map((_, i) => (
      <TableCell key={i}>
        <Skeleton className="h-4 w-full bg-slate-700" />
      </TableCell>
    ))}
  </TableRow>
);

// Main Component
export default function UserExplorer() {
  const {
    users,
    loading,
    error,
    pagination,
    filters,
    updateFilter,
    resetFilters,
    refreshData,
  } = useUserAnalytics();

  const [viewMode, setViewMode] = useState("table");
  const [pageInput, setPageInput] = useState("1");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Sync page input when pagination changes
  const currentPageString = pagination.page.toString();
  if (pageInput !== currentPageString && !document.activeElement?.matches('[data-testid="page-input"]')) {
    setPageInput(currentPageString);
  }

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.searchQuery) count++;
    if (filters.volumeRange[0] > 0 || filters.volumeRange[1] < 500) count++;
    if (filters.ageRange[0] > 0 || filters.ageRange[1] < 365) count++;
    if (filters.winRateRange[0] > 0 || filters.winRateRange[1] < 100) count++;
    if (filters.buyRatioRange[0] > 0 || filters.buyRatioRange[1] < 100) count++;
    if (filters.sellRatioRange[0] > 0 || filters.sellRatioRange[1] < 100) count++;
    if (filters.largestLossRange[0] > -100 || filters.largestLossRange[1] < 0) count++;
    if (filters.highestProfitRange[0] > 0 || filters.highestProfitRange[1] < 100) count++;
    if (filters.avgReturnRange[0] > 0 || filters.avgReturnRange[1] < 50) count++;
    return count;
  }, [filters]);

  const copyAddress = (address:string) => {
    navigator.clipboard.writeText(address);
    toast.success("Address copied!", {
      description: "Wallet address copied to clipboard",
    });
  };

  const handlePageChange = (newPage:any) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      updateFilter("page", newPage);
    }
  };

  const handlePageInputSubmit = () => {
    const page = parseInt(pageInput);
    if (page >= 1 && page <= pagination.totalPages) {
      handlePageChange(page);
    } else {
      setPageInput(pagination.page.toString());
    }
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen  text-white" data-testid="user-explorer">
        {/* Background Effects */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-white">
                <Sparkles className="h-6 w-6 text-black" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white via-cyan-200 to-blue-400 bg-clip-text text-transparent">
                Polymarket Explorer
              </h1>
            </div>
            <p className="text-slate-400 text-lg max-w-2xl">
              Discover top traders and analyze their trading patterns with
              advanced analytics
            </p>
          </motion.div>

  

          {/* Search and Controls */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className=" rounded-2xl mb-6 backdrop-blur-sm"
          >
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  placeholder="Search by address (0x...) or username"
                  value={filters.searchQuery}
                  onChange={(e) => updateFilter("searchQuery", e.target.value)}
                  className="pl-12 h-12 bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20 rounded-xl"
                  data-testid="search-input"
                />
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3">
            

                {/* Refresh Button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={refreshData}
                      className="h-12 w-12 border-slate-700 bg-slate-500/50 hover:bg-slate-700 rounded-xl"
                      data-testid="refresh-btn"
                    >
                      <RefreshCw
                        className={`h-5 w-5 text-slate-300 ${loading ? "animate-spin" : ""}`}
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Refresh Data</TooltipContent>
                </Tooltip>

                {/* Filters Sheet */}
                <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
                  <SheetTrigger asChild>
                    <Button
                      className="h-12  px-4 bg-slate-500/50 hover:bg-slate-700/50 text-white border-0 rounded-xl"
                      data-testid="filters-btn"
                    >
                      <SlidersHorizontal className="h-5 w-5 mr-2" />
                      Filters
                      {activeFiltersCount > 0 && (
                        <Badge className="ml-2 bg-white/20 text-white text-xs px-1.5 py-0">
                          {activeFiltersCount}
                        </Badge>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent
                    side="right"
                    className="w-full mt-20 px-4 sm:max-w-md bg-black border-slate-800 overflow-y-auto"
                  >
                    <SheetHeader className="mb-6">
                      <SheetTitle className="text-2xl font-bold text-white flex items-center gap-2">
                        <SlidersHorizontal className="h-6 w-6 text-white" />
                        Filter Traders
                      </SheetTitle>
                    </SheetHeader>

                    <div className="space-y-6">
                      {/* Trading Volume */}
                      <FilterSlider
                        label="Trading Volume"
                        value={filters.volumeRange}
                        onChange={(value:any) => updateFilter("volumeRange", value)}
                        min={0}
                        max={500}
                        step={10}
                        prefix="$"
                        suffix="k"
                      />

                      {/* Wallet Age */}
                      <FilterSlider
                        label="Wallet Age"
                        value={filters.ageRange}
                        onChange={(value:any) => updateFilter("ageRange", value)}
                        min={0}
                        max={365}
                        suffix=" days"
                      />

                      {/* Win Rate */}
                      <FilterSlider
                        label="Win Rate"
                        value={filters.winRateRange}
                        onChange={(value:any) => updateFilter("winRateRange", value)}
                        suffix="%"
                      />

                      {/* Buy Ratio */}
                      <FilterSlider
                        label="Buy Ratio"
                        value={filters.buyRatioRange}
                        onChange={(value:any) => updateFilter("buyRatioRange", value)}
                        suffix="%"
                      />

                      {/* Sell Ratio */}
                      <FilterSlider
                        label="Sell Ratio"
                        value={filters.sellRatioRange}
                        onChange={(value:any) => updateFilter("sellRatioRange", value)}
                        suffix="%"
                      />

                      {/* Largest Loss */}
                      <FilterSlider
                        label="Largest Loss"
                        value={filters.largestLossRange}
                        onChange={(value:any) => updateFilter("largestLossRange", value)}
                        min={-100}
                        max={0}
                        suffix="%"
                      />

                      {/* Highest Profit */}
                      <FilterSlider
                        label="Highest Profit"
                        value={filters.highestProfitRange}
                        onChange={(value:any) => updateFilter("highestProfitRange", value)}
                        suffix="%"
                      />

                      {/* Average Return */}
                      <FilterSlider
                        label="Average Return"
                        value={filters.avgReturnRange}
                        onChange={(value:any) => updateFilter("avgReturnRange", value)}
                        min={0}
                        max={50}
                        suffix="%"
                      />

                      {/* Action Buttons */}
                      <div className="flex gap-3 pt-4 border-t border-slate-800">
                        <Button
                          variant="outline"
                          onClick={resetFilters}
                          className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                          data-testid="reset-filters-btn"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Reset All
                        </Button>
                        <SheetClose asChild>
                          <Button
                            className="flex-1 bg-slate-500/70 hover:bg-slate-700/60 border-0 text-white"
                            data-testid="apply-filters-btn"
                          >
                            Apply Filters
                          </Button>
                        </SheetClose>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </motion.div>

          {/* Error State */}
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-rose-500/10 border border-rose-500/50 rounded-xl p-4 mb-6 flex items-center justify-between"
            >
              <p className="text-rose-400">{error}</p>
              <Button
                variant="ghost"
                onClick={refreshData}
                className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
              >
                Try Again
              </Button>
            </motion.div>
          )}

          {/* Content */}
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {viewMode === "grid" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                      <CardSkeleton key={i} />
                    ))}
                  </div>
                ) : (
                  <Card className="bg-black rounded-2xl overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-700/50 hover:bg-transparent">
                          <TableHead className="text-slate-300">Trader</TableHead>
                          <TableHead className="text-slate-300">Volume</TableHead>
                          <TableHead className="text-slate-300">Win Rate</TableHead>
                          <TableHead className="text-slate-300">Avg Return</TableHead>
                          <TableHead className="text-slate-300">Trades</TableHead>
                          <TableHead className="text-slate-300">Max Loss</TableHead>
                          <TableHead className="text-slate-300">Max Profit</TableHead>
                          <TableHead className="text-slate-300">Risk</TableHead>
                          <TableHead className="text-slate-300">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[...Array(10)].map((_, i) => (
                          <TableRowSkeleton key={i} />
                        ))}
                      </TableBody>
                    </Table>
                  </Card>
                )}
              </motion.div>
            ) : users.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
                  <Search className="h-8 w-8 text-slate-500" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  No traders found
                </h3>
                <p className="text-slate-400 mb-4">
                  Try adjusting your filters to see more results
                </p>
                <Button
                  variant="outline"
                  onClick={resetFilters}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Reset Filters
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {viewMode === "grid" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {users.map((user, index) => (
                      <motion.div
                        key={user.address}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <UserCard user={user} onCopyAddress={copyAddress} />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <Card className="bg-transparent border-slate-800 rounded-2xl overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-700/50 hover:bg-transparent">
                          <TableHead className="text-slate-300 font-semibold">
                            Trader
                          </TableHead>
                          <TableHead className="text-slate-300 font-semibold">
                            Volume
                          </TableHead>
                          <TableHead className="text-slate-300 font-semibold">
                            Win Rate
                          </TableHead>
                          <TableHead className="text-slate-300 font-semibold">
                            Avg Return
                          </TableHead>
                          <TableHead className="text-slate-300 font-semibold">
                            Trades
                          </TableHead>
                          <TableHead className="text-slate-300 font-semibold">
                            Max Loss
                          </TableHead>
                          <TableHead className="text-slate-300 font-semibold">
                            Max Profit
                          </TableHead>
                          <TableHead className="text-slate-300 font-semibold">
                            Risk
                          </TableHead>
                          <TableHead className="text-slate-300 font-semibold">
                            Action
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user, index) => (
                          <UserTableRow
                            key={user.address}
                            user={user}
                            onCopyAddress={copyAddress}
                          />
                        ))}
                      </TableBody>
                    </Table>
                  </Card>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pagination */}
          {!loading && users.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 bg border border-slate-800 rounded-2xl p-4"
            >
              <p className="text-sm text-slate-400">
                Showing{" "}
                <span className="text-white font-medium">
                  {(pagination.page - 1) * pagination.limit + 1}
                </span>{" "}
                to{" "}
                <span className="text-white font-medium">
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total
                  )}
                </span>{" "}
                of{" "}
                <span className="text-white font-medium">
                  {pagination.total}
                </span>{" "}
                traders
              </p>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="h-10 w-10 border-slate-700 bg-slate-800/50 hover:bg-slate-700 disabled:opacity-50"
                  data-testid="prev-page-btn"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>

                <div className="flex items-center gap-2 px-3">
                  <span className="text-sm text-slate-400">Page</span>
                  <Input
                    type="number"
                    min="1"
                    max={pagination.totalPages}
                    value={pageInput}
                    onChange={(e) => setPageInput(e.target.value)}
                    onBlur={handlePageInputSubmit}
                    onKeyPress={(e) => e.key === "Enter" && handlePageInputSubmit()}
                    className="w-16 h-10 text-center bg-slate-800/50 border-slate-700 text-white rounded-lg"
                    data-testid="page-input"
                  />
                  <span className="text-sm text-slate-400">
                    of {pagination.totalPages}
                  </span>
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="h-10 w-10 border-slate-700 bg-slate-800/50 hover:bg-slate-700 disabled:opacity-50"
                  data-testid="next-page-btn"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
