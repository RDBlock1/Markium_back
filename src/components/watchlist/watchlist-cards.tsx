// components/watchlist/watchlist-cards.tsx (Updated to use the new dialog)
"use client"

import { useEffect, useRef, useState } from "react"
import { Bell, Trash2, Loader2 } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { watchlistAPI } from "@/lib/watchlist-api"
import { toast } from "sonner"
import { WatchlistAlertDialog } from "./alert-dialog"
import { formatVolume } from "@/utils"
import { useRouter } from "next/navigation"
import ClobSingleHistoryChart from "./single-history-chart"


function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  )
}


const formatPercentage = (price: string | number) => {
  const p = Number.parseFloat(String(price || 0))
  if (Number.isNaN(p)) return "0%"
  return `${(p * 100).toFixed(0)}%`
}

type Props = {
  watchlist_id?: string
  market_id: string
  question: string
  exp_data: string
  liquidity: string
  volume24h: string
  email: string
  prices: string[]
  onDelete?: () => void
  existingAlert?: {
    triggerType: string
    triggerValue: number
    frequency: string
    isEmailNotification: boolean
    isTelegramNotification: boolean
  }
}

export default function WatchListCards(props: Props) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  
  // Responsive chart width
  const chartWrapRef = useRef<HTMLDivElement | null>(null)
  const [chartWidth, setChartWidth] = useState<number>(320)
  const router = useRouter()

  useEffect(() => {
    const update = () => {
      if (chartWrapRef.current) {
        setChartWidth(Math.max(200, Math.floor(chartWrapRef.current.clientWidth)))
      }
    }
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])

// In your handleDelete function in WatchListCards component
const handleDelete = async () => {
  if (!props.watchlist_id) return

  setDeleting(true)
  try {
    const response = await watchlistAPI.deleteWatchlist(props.watchlist_id, props.email)
    console.log('response:', response);
    if(response) {
      toast.success("Watchlist removed", {
        description: "The item has been removed from your watchlist",
      })

      // Call onDelete immediately to update UI
      if (props.onDelete) {
        props.onDelete()
      }
      
      // Optional: keep router.refresh() for server-side sync
      router.refresh()
    }
  } catch (error) {
    console.error("Error deleting watchlist:", error)
    toast.error("Failed to remove from watchlist. Please try again.")
  } finally {
    setDeleting(false)
  }
}

  const prices = (() => {
    try {
      if (Array.isArray(props.prices)) {
        return props.prices as string[]
      }
      return JSON.parse(String(props.prices || "[]")) as string[]
    } catch {
      const s = String(props.prices || "[]").replace(/[\[\]\s"']+/g, "")
      return s.split(",").filter(Boolean)
    }
  })()

  return (
    <>
      <Card className="w-full  rounded-2xl border bg-card text-card-foreground shadow-sm">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-balance text-lg sm:text-xl font-semibold leading-tight">
                {props.question}
              </h3>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  Chance
                </Badge>
                <span className="text-xl ">{formatPercentage(prices[0] ?? "0")}</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button 
                size="icon" 
                variant="secondary" 
                aria-label="Set alert"
                onClick={() => setDialogOpen(true)}
              >
                <Bell className="h-4 w-4" />
              </Button>

              <Button 
                size="icon" 
                variant="ghost" 
                aria-label="Remove from watchlist"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin opacity-70" />
                ) : (
                  <Trash2 className="h-4 w-4 opacity-70" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
            <div ref={chartWrapRef} className="w-full">
            <ClobSingleHistoryChart clobId={props.market_id} chance={formatPercentage(prices[0] ?? "0")} color="#10B981" isWatchlistCard={true} />
            </div>
          <Separator className="mb-2" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Stat label="Liquidity" value={formatVolume(Number(props.liquidity))} />
            <Stat label="Volume 24h" value={formatVolume(Number(props.volume24h))} />
          </div>
        </CardContent>

        <CardFooter>
          <div className="flex w-full items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {props.existingAlert ? "Alert active" : "Stay updated with alerts."}
            </p>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setDialogOpen(true)}
              className="gap-2"
              aria-label="Open alert settings"
            >
              <Bell className="h-4 w-4" />
              {props.watchlist_id ? "Edit Alert" : "Set Alert"}
            </Button>
          </div>
        </CardFooter>
      </Card>

      <WatchlistAlertDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        marketId={props.market_id}
        userEmail={props.email}
        watchlistId={props.watchlist_id}
        existingAlert={props.existingAlert}
        marketTitle={props.question}
        onSuccess={() => {
          // Optionally refresh data or show success state
          console.log("Alert saved successfully")
        }}
      />
    </>
  )
}