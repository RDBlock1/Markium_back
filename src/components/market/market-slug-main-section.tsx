"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Market, MarketSlug } from "@/types/market"
import { MarketHero } from "@/components/market/market-hero"
import { TradingPanel } from "@/components/market/trading-panel"
import { TradingChart } from "@/components/market/trading-chart"
import { OrderBook } from "@/components/market/order-book"
import { RecentTrades } from "@/components/market/recent-trades"
import { CommentsSection } from "@/components/market/commments-section"
import { LiveChat } from "@/components/market/live-chat"
import { MarketInfo } from "@/components/market/market-info"
import { WebSocketIndicator } from "@/components/ui/websocket-indicator"
import { LoadingSkeleton } from "@/components/ui/loading-skeleton"
import { ErrorState } from "@/components/ui/error-state"
import { YesNoHolders } from "./top-holders"
import { TokenHolders } from "@/types/holder"
import { getTopHolders } from "@/app/actions/market"
import { MyOrdersTable } from "./my-orders-table"

// // Mock data - in real app this would come from API
// const mockMarket: Market = {
//     id: "12",
//     question: "Will Joe Biden get Coronavirus before the election?",
//     slug: "will-joe-biden-get-coronavirus-before-the-election",
//     image: "https://polymarket-upload.s3.us-east-2.amazonaws.com/will-joe-biden-get-coronavirus-before-the-election-5a3d4c3b-0a73-419e-a686-be034d2c73ac.png",
//     description: "This is a market on if presidential candidate Joe Biden will test positive for COVID-19 before the 2020 US Presidential Election. The market will resolve to 'Yes' if Joe Biden tests positive for COVID-19 before November 3rd, 2020, 11:59 PM ET. Otherwise, it will resolve to 'No'.",
//     outcomes: ["Yes", "No"],
//     outcomePrices: ["0.45", "0.55"],
//     volume24hr: 32257.45,
//     liquidity: 15000,
//     endDate: "2020-11-04T00:00:00Z",
//     active: true,
//     category: "US-current-affairs",
//     name: "",
//     ticker: "",
//     logo: "",
//     price: 0,
//     marketCap: 0,
//     volume: 0,
//     change24h: 0,
//     sparklineData: [],
//     status: "active"
// }

interface MarketPageProps {
  params: {
    slug: string
  },
  marketData: MarketSlug | null

}

export default function MarketSlugMainSection({ params, marketData }: MarketPageProps) {
    console.log('MarketSlugMainSection mounted', marketData);
  const [market, setMarket] = useState<MarketSlug | null>(marketData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [topHolders, setTopHolders] = useState<TokenHolders[]>([])
  const [activeTab, setActiveTab] = useState<"buy" | "sell">("buy")


  const cloudIds = JSON.parse(marketData?.clobTokenIds || "[]") as string[];



  // useEffect(() => {
  //   let startY = 0
  //   let currentY = 0
  //   let isPulling = false

  //   const handleTouchStart = (e: TouchEvent) => {
  //     startY = e.touches[0].clientY
  //   }

  //   const handleTouchMove = (e: TouchEvent) => {
  //     currentY = e.touches[0].clientY
  //     if (currentY > startY && window.scrollY === 0) {
  //       isPulling = true
  //       e.preventDefault()
  //     }
  //   }

  //   const handleTouchEnd = () => {
  //     if (isPulling && currentY - startY > 100) {
  //       window.location.reload()
  //     }
  //     isPulling = false
  //   }

  //   document.addEventListener("touchstart", handleTouchStart)
  //   document.addEventListener("touchmove", handleTouchMove, { passive: false })
  //   document.addEventListener("touchend", handleTouchEnd)

  //   return () => {
  //     document.removeEventListener("touchstart", handleTouchStart)
  //     document.removeEventListener("touchmove", handleTouchMove)
  //     document.removeEventListener("touchend", handleTouchEnd)
  //   }
  // }, [])

  const fetchTopHolders = async () =>{
    try {
      if(!market?.conditionId) return;
      const holders = await getTopHolders(market?.conditionId);
      setTopHolders(holders);
    } catch (error) {
      console.error('Error fetching top holders:', error);
    }
  }


  useEffect(()=>{
    fetchTopHolders();
  }, [market?.conditionId])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0B0D]">
        <WebSocketIndicator />
        <div className="container mx-auto px-4 py-6">
          <LoadingSkeleton lines={3} className="mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-9 space-y-6">
              <LoadingSkeleton lines={5} />
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2">
                  <LoadingSkeleton lines={8} />
                </div>
                <div className="xl:col-span-1">
                  <LoadingSkeleton lines={6} />
                </div>
              </div>
            </div>
            <div className="lg:col-span-3">
              <LoadingSkeleton lines={4} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0A0B0D] flex items-center justify-center">
        <ErrorState title="Failed to Load Market" message={error} onRetry={() => window.location.reload()} />
      </div>
    )
  }

  if (!market) {
    return (
      <div className="min-h-screen bg-[#0A0B0D] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Market Not Found</h1>
          <p className="text-[#94A3B8]">The market you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0B0D] text-white">
      <WebSocketIndicator />

     

      <div className="container max-w-7xl mx-auto px-4 py-6">
        <div className=" gap-6">
          {/* Main Content */}
          <div className="lg:col-span-9 space-y-6">
            {/* Hero Section */}
            <MarketHero market={market} />

            {/* Chart and Trading */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2">
                
                  {topHolders && topHolders.length > 0 && topHolders[0].holdersYes && (
                    <TradingChart marketId={topHolders[0].tokenYes!} conditionId={market.conditionId} yesId={""} noId={""} />
                  )}
                
              </div>
              <div className="xl:col-span-1">
                <TradingPanel market={market} />
              </div>
            </div>

            {/* Order Book and Recent Trades */}
              <div className="mx-auto max-w-7xl">
        <MyOrdersTable yesTokenId={cloudIds[0]} noTokenId={cloudIds[1]} />
      </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <OrderBook />
              <RecentTrades tokenId="15974786252393396629980467963784550802583781222733347534844974829144359265969" marketId="0x8ee2f1640386310eb5e7ffa596ba9335f2d324e303d21b0dfea6998874445791" />
            </div>

            {/* Market Info Tabs */}
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-[#12161C] border border-[#1E2329]">
                <TabsTrigger value="info">Market Info</TabsTrigger>
                <TabsTrigger value="holders">Top Holders</TabsTrigger>
                <TabsTrigger value="comments">Comments</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>
              <TabsContent value="info" className="mt-6">
                <MarketInfo market={market} />
              </TabsContent>
              <TabsContent value="holders" className="mt-6">
                <YesNoHolders data={topHolders} />
              </TabsContent>
              <TabsContent value="comments" className="mt-6">
                <CommentsSection />
              </TabsContent>
              <TabsContent value="activity" className="mt-6">
                <div className="text-center py-12 text-[#94A3B8]">Activity feed coming soon...</div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          {/* <div className="lg:col-span-3">
            <div className={`transition-all duration-300 ${isChatOpen ? "block" : "hidden lg:block"}`}>
              <LiveChat />
            </div>
          </div> */}
        </div>
      </div>

      {/* Mobile Trading Panel */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40">
        <TradingPanel market={market} isMobile />
      </div>

    
    </div> 
  )
}
