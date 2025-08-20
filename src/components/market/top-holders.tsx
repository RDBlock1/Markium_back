"use client"

import type React from "react"
import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowUpDown, ArrowUp, ArrowDown, Copy, User } from "lucide-react"
import { toast, Toaster } from "sonner"
import type { HolderData, TokenHolders } from "@/types/holder"
import { cn } from "@/lib/utils"

interface YesNoHoldersProps {
  data: TokenHolders[]
}

type SortField = "amount" | "name"
type SortDirection = "asc" | "desc"

export function YesNoHolders({ data }: YesNoHoldersProps) {
  const [sortField, setSortField] = useState<SortField>("amount")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const [activeTab, setActiveTab] = useState("yes")
  const itemsPerPage = 10

  const { yesHolders, noHolders } = useMemo(() => {
  const allHolders = (data ?? []).flatMap((tokenData) =>
    (tokenData.holdersYes ?? []).concat(tokenData.holdersNo ?? [])
  );

  return {
    yesHolders: allHolders.filter((holder) => holder.outcomeIndex === 1),
    noHolders: allHolders.filter((holder) => holder.outcomeIndex === 0),
  };
}, [data]);


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

  const getCurrentHolders = () => {
    return activeTab === "yes" ? yesHolders : noHolders
  }

  const sortedHolders = sortHolders(getCurrentHolders())
  const paginatedHolders = sortedHolders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  const totalPages = Math.ceil(sortedHolders.length / itemsPerPage)

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address)
    toast.success("Address copied to clipboard!")
  }

  const getDisplayName = (holder: HolderData) => {
    if (!holder.displayUsernamePublic) return "Anonymous"
    const name = holder.name || holder.pseudonym || "Anonymous"
    return name.length > 12 ? `${name.slice(0, 12)}...` : name
  }

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleSort(field)}
      className="h-auto p-1 text-[#94A3B8] hover:text-white font-medium"
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field ? (
          sortDirection === "asc" ? (
            <ArrowDown className="w-3 h-3" />
          ) : (
            <ArrowUp className="w-3 h-3" />
          )
        ) : (
          <ArrowUpDown className="w-3 h-3 opacity-50" />
        )}
      </div>
    </Button>
  )

  const HoldersTable = ({ holders }: { holders: HolderData[] }) => (
    <div className="space-y-4">
      <div className="hidden md:grid md:grid-cols-4 gap-4 pb-2 border-b border-[#1E2329]">
        <div className="text-sm font-medium text-[#94A3B8]">User</div>
        <div className="text-sm font-medium text-[#94A3B8]">Address</div>
<div className="">
          <SortButton field="amount">Amount Held</SortButton>
</div>        <div className="text-sm font-medium text-[#94A3B8]">Bio</div>
      </div>

      <div className="space-y-2">
        {holders.map((holder, index) => (
          <motion.div
            key={holder.proxyWallet}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="p-4 rounded-lg bg-[#1E2329]/30 hover:bg-[#1E2329]/50 transition-colors"
          >
            {/* Mobile Layout */}
            <div className="md:hidden space-y-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={holder.profileImage || holder.profileImageOptimized} />
                  <AvatarFallback className="bg-[#6366F1] text-white">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white">{getDisplayName(holder)}</div>
                </div>
                <div className="text-sm text-[#94A3B8] truncate">
                  {truncateAddress(holder.proxyWallet)}
                </div>
                <div className="text-right">
                  <div className="font-semibold text-white text-lg">
                    {holder.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-[#94A3B8]">tokens held</div>
                </div>
              </div>

              {holder.bio && <div className="text-sm text-[#94A3B8] line-clamp-2">{holder.bio}</div>}

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyAddress(holder.proxyWallet)}
                  className="h-8 px-3 text-[#6366F1] hover:text-[#6366F1]/80"
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copy Address
                </Button>
              </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden md:grid md:grid-cols-4 gap-4 items-center">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={holder.profileImage || holder.profileImageOptimized} />
                  <AvatarFallback className="bg-[#6366F1] text-white text-xs">
                    <User className="h-3 w-3" />
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-white">{getDisplayName(holder)}</span>
              </div>


            <div>
              <div className="text-sm text-[#94A3B8] truncate">
                {truncateAddress(holder.proxyWallet)}
              </div>
            </div>
              <div className="flex flex-col">
                <div className="font-semibold text-white">
                  {holder.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-[#94A3B8]">tokens held</div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-[#94A3B8] truncate flex-1 mr-2">{holder.bio || "No bio"}</div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>{
                    copyAddress(holder.proxyWallet)
                    toast.success("Address copied to clipboard!")
                  }}
                  className="h-6 w-6 p-0 text-[#6366F1] hover:text-[#6366F1]/80 flex-shrink-0"
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-[#1E2329]">
          <div className="text-sm text-[#94A3B8]">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, sortedHolders.length)} of {sortedHolders.length} holders
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="border-[#1E2329] text-[#94A3B8] hover:text-white"
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
                      "h-8 w-8 p-0",
                      currentPage === page ? "bg-[#6366F1] text-white" : "text-[#94A3B8] hover:text-white",
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
              className="border-[#1E2329] text-[#94A3B8] hover:text-white"
            >
              Next
            </Button>
          </div>
        </div>
      )}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
        }}
      />

    </div>
  )

  return (
    <Card className="bg-[#12161C] border-[#1E2329] p-4 md:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h3 className="text-lg font-semibold text-white">Position Holders</h3>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[#00D395] border-[#00D395] bg-[#00D395]/10">
            Yes: {yesHolders.length}
          </Badge>
          <Badge variant="outline" className="text-[#FF3B69] border-[#FF3B69] bg-[#FF3B69]/10">
            No: {noHolders.length}
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-[#1E2329]">
          <TabsTrigger value="yes" className="data-[state=active]:bg-[#00D395] data-[state=active]:text-white">
            Yes Holders ({yesHolders.length})
          </TabsTrigger>
          <TabsTrigger value="no" className="data-[state=active]:bg-[#FF3B69] data-[state=active]:text-white">
            No Holders ({noHolders.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="yes" className="mt-6">
          <HoldersTable holders={paginatedHolders} />
        </TabsContent>

        <TabsContent value="no" className="mt-6">
          <HoldersTable holders={paginatedHolders} />
        </TabsContent>
      </Tabs>
    </Card>
  )
}
