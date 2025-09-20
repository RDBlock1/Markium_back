// app/users/explorer/page.tsx or components/UserExplorer.tsx
"use client"

import { useState, useCallback, JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search,
  Filter,
  Copy,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  Percent,
  PieChart,
  LineChart,
  BarChart3,
  Users,
  Wallet,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useUserAnalytics, useUserDetails } from "@/hooks/useUserAnalytics"
import {toast} from 'sonner'
import Link from "next/link"
import { useRouter } from "next/dist/client/components/navigation"

// Your existing component helper components remain the same
type FilterRowProps = {
  label: string
  value: number[]
  onChange: (value: number[]) => void
  min?: number
  max?: number
  step?: number
  showDollar?: boolean
}

const FilterRow = ({ label, value, onChange, min = 0, max = 100, step = 1, showDollar = false }: FilterRowProps) => (
  <div className="space-y-3">
    <div className="flex justify-between items-center">
      <label className="text-sm font-medium text-primary">{label}</label>
      <span className="text-sm font-semibold text-primary">
        {showDollar ? "$" : ""}
        {value[0]}
        {step < 1 ? "k" : ""} - {showDollar ? "$" : ""}
        {value[1]}
        {step < 1 ? "k" : ""}
      </span>
    </div>
    <Slider value={value} onValueChange={onChange} min={min} max={max} step={step} className="w-full" />
  </div>
)

type SummaryCardProps = {
  title: string
  value: string | number
  icon: React.ElementType
  trend?: "up" | "down"
  subtitle?: string
  variant?: "default" | "success" | "warning" | "destructive"
}

const SummaryCard = ({ title, value, icon: Icon, trend, subtitle, variant = "default" }: SummaryCardProps) => {
  const getVariantStyles = () => {
    switch (variant) {
      case "success":
        return "text-success"
      case "warning":
        return "text-warning"
      case "destructive":
        return "text-destructive"
      default:
        return "text-primary"
    }
  }

  return (
    <Card className="bg-surface border-border shadow-sm hover:shadow-md transition-all duration-200">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-secondary">{title}</p>
            <motion.p
              className={`text-2xl font-bold ${getVariantStyles()}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {value}
            </motion.p>
            {subtitle && <p className="text-xs text-tertiary">{subtitle}</p>}
          </div>
          <div className="flex flex-col items-center space-y-1">
            <div className="p-2 rounded-lg bg-surface-secondary">
              <Icon className="h-5 w-5 text-secondary" />
            </div>
            {trend && (
              <div className={`flex items-center ${trend === "up" ? "text-success" : "text-destructive"}`}>
                {trend === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

type UsersTableRowProps = {
  user: any
  isExpanded: boolean
  onToggle: () => void
  onSelect: () => void
}

const UsersTableRow = ({ user, isExpanded, onToggle, onSelect }: UsersTableRowProps) => {
  const router = useRouter();
  return (
 <>
     <TableRow className="hover:bg-surface-secondary cursor-pointer transition-colors border-border" >
    <Link href={`/user-profile/${user.address}`} className="contents">
      <TableCell className="font-mono text-emerald-400 font-medium">
        {user.address}
      </TableCell>
      <TableCell className="text-primary font-semibold">${user.tradingVolume.toLocaleString()}</TableCell>
      <TableCell className="text-success font-semibold">{user.winRate.toFixed(1)}%</TableCell>
      <TableCell className="text-primary font-semibold">{user.avgReturn.toFixed(1)}%</TableCell>
      <TableCell className="text-primary font-semibold">{user.trades}</TableCell>
      <TableCell className="text-destructive font-semibold">{user.largestLoss.toFixed(1)}%</TableCell>
      <TableCell className="text-success font-semibold">{user.highestProfit.toFixed(1)}%</TableCell>
      <TableCell className="flex items-start justify-start ">
        <Button
          variant="secondary"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            router.push(`/user-profile/${user.address}`)
          }}
          className="hover:bg-surface-secondary"
        >
          View Profile
        </Button>
      </TableCell>
    </Link>
    </TableRow>
    <AnimatePresence>
      {isExpanded && (
        <TableRow>
          <TableCell colSpan={8} className="p-0">
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="p-6 bg-surface-secondary space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center space-y-1">
                    <p className="text-sm font-medium text-secondary">Buy/Sell Ratio</p>
                    <p className="text-lg font-bold text-primary">
                      {user.buyPercentage}% / {user.sellPercentage}%
                    </p>
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-sm font-medium text-secondary">Wallet Age</p>
                    <p className="text-lg font-bold text-primary">{user.walletAge} days</p>
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-sm font-medium text-secondary">Avg Trade Size</p>
                    <p className="text-lg font-bold text-primary">
                      ${user.trades > 0 ? (user.tradingVolume / user.trades).toFixed(0) : 0}
                    </p>
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-sm font-medium text-secondary">Risk Profile</p>
                    <Badge variant="outline" className="text-warning border-warning bg-warning/10">
                      {user.riskProfile || "Medium"}
                    </Badge>
                  </div>
                </div>
                <div className="h-32 bg-surface rounded-xl border border-border flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <BarChart3 className="h-8 w-8 text-secondary mx-auto" />
                    <p className="text-sm text-secondary">Performance Chart</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </TableCell>
        </TableRow>
      )}
    </AnimatePresence>
  </>
)
}

export default function UserExplorer() {

  const {
    users,
    loading,
    error,
    pagination,
    filters,
    updateFilter,
    updateFilters,
    resetFilters,
    refreshData,
  } = useUserAnalytics()

  const [selectedUserAddress, setSelectedUserAddress] = useState<string | null>(null)
  const { user: selectedUser, loading: userLoading } = useUserDetails(selectedUserAddress)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)
  const [showDollarValues, setShowDollarValues] = useState(true)

  const toggleRowExpansion = (address: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(address)) {
      newExpanded.delete(address)
    } else {
      newExpanded.add(address)
    }
    setExpandedRows(newExpanded)
  }

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address)
    toast.success("Address copied", { 
      description: "Wallet address has been copied to clipboard",
    })
  }

  const handleUserSelect = useCallback((user: any) => {
    setSelectedUserAddress(user.address)
  }, [])

  const handleBackToList = useCallback(() => {
    setSelectedUserAddress(null)
  }, [])

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    updateFilter('page', newPage)
  }

  return (
    <TooltipProvider>
      <motion.div
        className="min-h-screen bg-background text-foreground p-6 md:p-8 w-full mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-balance text-primary leading-tight">
              Wallet Explorer
            </h1>
            <p className="text-lg text-primary max-w-2xl text-pretty">
              Discover and analyze trading patterns across proxy wallets with advanced analytics and insights
            </p>
          </motion.div>
        </div>

        {/* Search and Filters Section */}
        <Card className="bg-surface border-border shadow-sm mb-8">
          <CardContent className="p-8">
            {/* Search Bar */}
            <div className="relative mb-6">
              <Search className="absolute left-4 top-4 h-5 w-5 text-primary" />
              <Input
                placeholder="Search by address (0x...)"
                value={filters.searchQuery}
                onChange={(e) => updateFilter('searchQuery', e.target.value)}
                className="pl-12 h-12 bg-surface-secondary border-border text-primary placeholder-tertiary text-base"
              />
            </div>

            {/* Timeframe Tabs and Filter Button */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
              <Tabs value={filters.timeframe} onValueChange={(value) => updateFilter('timeframe', value)}>
                <TabsList className="bg-surface-secondary border border-border">
                  <TabsTrigger value="daily" className="data-[state=active]:bg-surface">
                    Daily
                  </TabsTrigger>
                  <TabsTrigger value="weekly" className="data-[state=active]:bg-surface">
                    Weekly
                  </TabsTrigger>
                  <TabsTrigger value="monthly" className="data-[state=active]:bg-surface">
                    Monthly
                  </TabsTrigger>
                  <TabsTrigger value="all" className="data-[state=active]:bg-surface">
                    All Time
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={resetFilters}
                  className="border-border text-primary hover:bg-surface-secondary h-10"
                >
                  Reset Filters
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="border-border text-primary hover:bg-surface-secondary h-10"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Advanced Filters
                  {showFilters ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
                </Button>
              </div>
            </div>

            {/* Filters Panel */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-border pt-8 space-y-8">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-semibold text-primary">Filter Options</h3>
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-primary">$</span>
                        <Switch checked={showDollarValues} onCheckedChange={setShowDollarValues} />
                        <span className="text-sm font-medium text-primary">%</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      <FilterRow
                        label="Trading Volume"
                        value={filters.volumeRange}
                        onChange={(value: any) => updateFilter('volumeRange', value)}
                        max={500}
                        step={10}
                        showDollar={showDollarValues}
                      />
                      <FilterRow
                        label="Wallet Age (days)"
                        value={filters.ageRange}
                        onChange={(value: any) => updateFilter('ageRange', value)}
                        max={365}
                      />
                      <FilterRow
                        label="Win Rate %"
                        value={filters.winRateRange}
                        onChange={(value: any) => updateFilter('winRateRange', value)}
                      />
                      <FilterRow
                        label="Buy Ratio %"
                        value={filters.buyRatioRange}
                        onChange={(value: any) => updateFilter('buyRatioRange', value)}
                      />
                      <FilterRow
                        label="Sell Ratio %"
                        value={filters.sellRatioRange}
                        onChange={(value: any) => updateFilter('sellRatioRange', value)}
                      />
                      <FilterRow
                        label="Largest Loss %"
                        value={filters.largestLossRange}
                        onChange={(value: any) => updateFilter('largestLossRange', value)}
                        min={-100}
                        max={0}
                      />
                      <FilterRow
                        label="Highest Profit %"
                        value={filters.highestProfitRange}
                        onChange={(value: any) => updateFilter('highestProfitRange', value)}
                      />
                      <FilterRow
                        label="Average Return %"
                        value={filters.avgReturnRange}
                        onChange={(value: any) => updateFilter('avgReturnRange', value)}
                        max={50}
                      />
                    </div>

                    <div className="bg-surface-secondary rounded-xl">
                   
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Error State */}
        {error && (
          <Alert className="mb-8 border-destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
              <Button variant="link" onClick={refreshData} className="ml-2">
                Try again
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {loading && !selectedUserAddress && (
          <Card className="bg-surface border-border shadow-sm mb-8">
            <CardContent className="p-12">
              <div className="flex flex-col items-center justify-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-secondary">Loading users...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Users Table */}
        {!selectedUserAddress && !loading && (
          <Card className="bg-surface border-border shadow-sm mb-8">
            <CardContent>
              {users.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border hover:bg-transparent">
                          <TableHead className="text-primary font-semibold">Address</TableHead>
                          <TableHead className="text-primary font-semibold">Trading Volume</TableHead>
                          <TableHead className="text-primary font-semibold">Win Rate</TableHead>
                          <TableHead className="text-primary font-semibold">Avg Return</TableHead>
                          <TableHead className="text-primary font-semibold">Trades</TableHead>
                          <TableHead className="text-primary font-semibold">Largest Loss</TableHead>
                          <TableHead className="text-primary font-semibold">Highest Profit</TableHead>
                          <TableHead className="text-primary font-semibold translate-x-4">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user: any) => (
                          <UsersTableRow
                            key={user.address}
                            user={user}
                            isExpanded={expandedRows.has(user.address)}
                            onToggle={() => toggleRowExpansion(user.address)}
                            onSelect={() => handleUserSelect(user)}
                          />
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  <div className="flex items-center justify-between mt-6">
                    <p className="text-sm text-primary">
                      Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                      {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
                    </p>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-primary">
                        Page {pagination.page} of {pagination.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-secondary">No users found matching your filters</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* User Detail View */}
        {selectedUserAddress && selectedUser && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            {/* User Header */}
            <Card className="bg-surface border-border shadow-sm mb-8">
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 rounded-xl bg-surface-secondary">
                      <Wallet className="h-8 w-8 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3">
                        <h2 className="text-2xl font-bold font-mono text-primary">{selectedUser.address}</h2>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyAddress(selectedUser.address)}
                              className="hover:bg-surface-secondary"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Copy address</TooltipContent>
                        </Tooltip>
                      </div>
                      <Badge variant="outline" className="text-primary border-primary bg-primary/10">
                        Proxy Wallet
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleBackToList}
                    className="border-border text-secondary hover:bg-surface-secondary"
                  >
                    Back to List
                  </Button>
                </div>
              </CardContent>
            </Card>


       
          </motion.div>
        )}
      </motion.div>
    </TooltipProvider>
  )
}
