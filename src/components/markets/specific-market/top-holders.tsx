"use client"

import type React from "react"
import { useState, useMemo, useEffect } from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowUpDown, ArrowUp, ArrowDown, Copy, User, Loader2 } from "lucide-react"
import { toast, Toaster } from "sonner"
import type { HolderData, TokenHolders } from "@/types/holder"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface TopHoldersProps {
    yesHolderId: string
    noHolderId: string
    marketId: string
}

type SortField = "amount" | "name"
type SortDirection = "asc" | "desc"

export function TopHolders({ yesHolderId, noHolderId, marketId }: TopHoldersProps) {
    const [sortField, setSortField] = useState<SortField>("amount")
    const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
    const [currentPage, setCurrentPage] = useState(1)
    const [activeTab, setActiveTab] = useState("yes")
    const [data, setData] = useState<TokenHolders[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const itemsPerPage = 10

    useEffect(() => {
        const fetchHolders = async () => {
            setIsLoading(true)
            setError(null)
            try {
                const response = await fetch(`/api/market/top-holders?marketId=${marketId}`)
                if (!response.ok) throw new Error('Failed to fetch holders')
                const result = await response.json()
                setData(result.data || [])
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred')
                console.error('Error fetching holders:', err)
            } finally {
                setIsLoading(false)
            }
        }

        if (marketId) fetchHolders()
    }, [marketId])

    const { yesHolders, noHolders } = useMemo(() => {
        const allHolders = (data ?? []).flatMap((tokenData) =>
            (tokenData.holdersYes ?? []).concat(tokenData.holdersNo ?? [])
        )
        return {
            yesHolders: allHolders.filter((holder) => holder.outcomeIndex === 0),
            noHolders: allHolders.filter((holder) => holder.outcomeIndex === 1),
        }
    }, [data])

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc")
        } else {
            setSortField(field)
            setSortDirection("desc")
        }
    }

    const sortHolders = (holders: HolderData[]) => {
        return [...holders].sort((a, b) => {
            const aValue = a[sortField]
            const bValue = b[sortField]
            const multiplier = sortDirection === "asc" ? 1 : -1

            if (typeof aValue === "number" && typeof bValue === "number") {
                return (aValue - bValue) * multiplier
            }
            if (typeof aValue === "string" && typeof bValue === "string") {
                return aValue.localeCompare(bValue) * multiplier
            }
            return 0
        })
    }

    const getCurrentHolders = () => activeTab === "yes" ? yesHolders : noHolders
    const sortedHolders = sortHolders(getCurrentHolders())
    const paginatedHolders = sortedHolders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    const totalPages = Math.ceil(sortedHolders.length / itemsPerPage)

    const copyAddress = (address: string) => {
        navigator.clipboard.writeText(address)
        toast.success("Address copied!")
    }

    const getDisplayName = (holder: HolderData) => {
        if (!holder.displayUsernamePublic) return "Anonymous"
        const name = holder.name || holder.pseudonym || "Anonymous"
        return name.length > 20 ? `${name.slice(0, 20)}...` : name
    }

    if (isLoading) {
        return (
            <Card className="bg-gradient-to-br from-zinc-900 to-black border-zinc-800 p-8">
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-cyan-500" />
                    <p className="text-zinc-400 text-sm">Loading holders data...</p>
                </div>
            </Card>
        )
    }

    if (error) {
        return (
            <Card className="bg-gradient-to-br from-zinc-900 to-black border-zinc-800 p-8">
                <div className="text-center py-16">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 mb-4">
                        <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <p className="text-red-400 font-medium mb-2">Failed to load holders</p>
                    <p className="text-zinc-500 text-sm">{error}</p>
                </div>
            </Card>
        )
    }

    if (yesHolders.length === 0 && noHolders.length === 0) {
        return (
            <Card className="bg-gradient-to-br from-zinc-900 to-black border-zinc-800 p-8">
                <div className="text-center py-16">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-800 mb-4">
                        <User className="w-8 h-8 text-zinc-600" />
                    </div>
                    <p className="text-zinc-400">No holders data available</p>
                </div>
            </Card>
        )
    }

    const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
        <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSort(field)}
            className="h-auto p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 font-medium transition-colors"
        >
            <div className="flex items-center gap-1.5">
                {children}
                {sortField === field ? (
                    sortDirection === "asc" ? (
                        <ArrowUp className="w-3.5 h-3.5" />
                    ) : (
                        <ArrowDown className="w-3.5 h-3.5" />
                    )
                ) : (
                    <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />
                )}
            </div>
        </Button>
    )

    const HoldersTable = ({ holders }: { holders: HolderData[] }) => (
        <div className="space-y-3">
            {/* Desktop Header */}
            <div className="hidden md:grid md:grid-cols-2 gap-4 pb-3 px-4 border-b border-zinc-800">
                <div className=" text-sm font-medium text-zinc-500">Holder</div>
                <div className="">
                    <SortButton field="amount">Amount</SortButton>
                </div>
            </div>

            {/* Holders List */}
            <div className="space-y-2">
                {holders.map((holder, index) => (
                    <motion.div
                        key={holder.proxyWallet}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="group relative rounded-lg bg-zinc-900/40 hover:bg-zinc-900/80 border border-zinc-800/50 hover:border-zinc-700 transition-all duration-200"
                    >
                        {/* Mobile Layout */}
                        <div className="md:hidden p-4 space-y-3">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <Avatar className="h-10 w-10 ring-2 ring-zinc-800">
                                        <AvatarImage src={holder.profileImage || holder.profileImageOptimized} />
                                        <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white text-sm">
                                            <User className="h-4 w-4" />
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <Link href={`/user-profile/${holder.proxyWallet}`} className="block">
                                            <p className="font-semibold text-white hover:text-cyan-400 transition-colors truncate">
                                                {getDisplayName(holder)}
                                            </p>
                                        </Link>
                                        <p className="text-xs text-zinc-500 truncate">{holder.proxyWallet.slice(0, 10)}...</p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyAddress(holder.proxyWallet)}
                                    className="h-8 w-8 p-0 text-zinc-400 hover:text-cyan-400 hover:bg-zinc-800"
                                >
                                    <Copy className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                                <div>
                                    <p className="text-xs text-zinc-500 mb-0.5">Amount Held</p>
                                    <p className="text-lg font-bold text-white">
                                        {holder.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                    </p>
                                </div>

                            </div>
                        </div>

                        {/* Desktop Layout */}
                        <div className="hidden md:grid md:grid-cols-2 gap-4 items-center p-4">

                            <div className="col-span-1 flex items-center gap-3 min-w-0">
                              <Link href={`/user-profile/${holder.proxyWallet}`} className="flex items-center gap-3 flex-1 min-w-0">
                                    <Avatar className="h-10 w-10 ring-2 ring-zinc-800 group-hover:ring-cyan-500/50 transition-all">
                                        <AvatarImage src={holder.profileImage || holder.profileImageOptimized} />
                                        <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white text-sm">
                                            <User className="h-4 w-4" />
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <Link href={`/user-profile/${holder.proxyWallet}`}>
                                            <p className="font-semibold text-white hover:text-cyan-400 transition-colors truncate">
                                                {getDisplayName(holder)}
                                            </p>
                                        </Link>
                                        <Link href={`/user-profile/${holder.proxyWallet}`}>
                                            <p className="text-xs text-zinc-500 hover:text-zinc-400 transition-colors truncate ">
                                                {holder.proxyWallet}
                                            </p>
                                        </Link>
                                    </div>
                              </Link>
                            </div>

                            <div className="col-span-1">
                                <Link href={`/user-profile/${holder.proxyWallet}`}>
                                    <p className="text-lg font-bold text-white hover:text-cyan-400 transition-colors">
                                        {holder.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                    </p>

                                </Link>
                            </div>

                         
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t border-zinc-800">
                    <div className="text-sm text-zinc-500">
                        Showing <span className="text-white font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
                        <span className="text-white font-medium">{Math.min(currentPage * itemsPerPage, sortedHolders.length)}</span> of{" "}
                        <span className="text-white font-medium">{sortedHolders.length}</span> holders
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30"
                        >
                            Previous
                        </Button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                const page = i + 1
                                return (
                                    <Button
                                        key={page}
                                        variant={currentPage === page ? "default" : "ghost"}
                                        size="sm"
                                        onClick={() => setCurrentPage(page)}
                                        className={cn(
                                            "h-9 w-9 p-0",
                                            currentPage === page
                                                ? "bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25"
                                                : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                                        )}
                                    >
                                        {page}
                                    </Button>
                                )
                            })}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className="border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30"
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )

    return (
        <Card className="bg-gradient-to-br from-zinc-900 to-black border-zinc-800 p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h3 className="text-xl font-bold text-white mb-1">Position Holders</h3>
                    <p className="text-sm text-zinc-500">Top traders in this market</p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20">
                        Yes: {yesHolders.length}
                    </Badge>
                    <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20">
                        No: {noHolders.length}
                    </Badge>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-zinc-900/50 p-1 h-8">
                    <TabsTrigger
                        value="yes"
                        className="bg-transparent flex items-center justify-center  text-white px-0 rounded-none data-[state=active]:text-cyan-500 data-[state=active]:border-b-2 data-[state=active]:border-cyan-500 font-semibold text-sm md:text-base transition-colors"
                    >
                        <span className="flex items-center gap-2">
                            Yes Holders
                            <Badge variant="secondary" className="ml-1 bg-white/10">
                                {yesHolders.length}
                            </Badge>
                        </span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="no"
                        className="bg-transparent flex items-center justify-center text-white px-0 rounded-none data-[state=active]:text-cyan-500 data-[state=active]:border-b-2 data-[state=active]:border-cyan-500 font-semibold text-sm md:text-base transition-colors"
                    >
                        <span className="flex items-center gap-2">
                            No Holders
                            <Badge variant="secondary" className="ml-1 bg-white/10">
                                {noHolders.length}
                            </Badge>
                        </span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="yes" className="mt-6">
                    <HoldersTable holders={paginatedHolders} />
                </TabsContent>

                <TabsContent value="no" className="mt-6">
                    <HoldersTable holders={paginatedHolders} />
                </TabsContent>
            </Tabs>

            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 2000,
                    style: {
                        background: '#18181b',
                        color: '#fff',
                        border: '1px solid #27272a'
                    }
                }}
            />
        </Card>
    )
}