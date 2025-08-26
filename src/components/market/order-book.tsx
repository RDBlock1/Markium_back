"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowUpDown } from "lucide-react"
import type { OrderBookEntry } from "@/types/market"
import { cn } from "@/lib/utils"

// Mock order book data
const generateOrderBookData = () => {
  const buyOrders: OrderBookEntry[] = []
  const sellOrders: OrderBookEntry[] = []

  // Generate buy orders (bids)
  let totalBuy = 0
  for (let i = 0; i < 8; i++) {
    const price = 0.45 - i * 0.005
    const size = Math.random() * 1000 + 100
    totalBuy += size
    buyOrders.push({
      price: Number(price.toFixed(3)),
      size: Math.round(size),
      total: Math.round(totalBuy),
    })
  }

  // Generate sell orders (asks)
  let totalSell = 0
  for (let i = 0; i < 8; i++) {
    const price = 0.46 + i * 0.005
    const size = Math.random() * 1000 + 100
    totalSell += size
    sellOrders.push({
      price: Number(price.toFixed(3)),
      size: Math.round(size),
      total: Math.round(totalSell),
    })
  }

  return { buyOrders, sellOrders }
}

export function OrderBook() {
  const [orderBook, setOrderBook] = useState(generateOrderBookData())
  const [selectedOutcome, setSelectedOutcome] = useState<"Yes" | "No">("Yes")
  const [animatingOrders, setAnimatingOrders] = useState<Set<string>>(new Set())

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setOrderBook(generateOrderBookData())
      // Add some random animations
      const randomOrderId = Math.random().toString()
      setAnimatingOrders(new Set([randomOrderId]))
      setTimeout(() => setAnimatingOrders(new Set()), 500)
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const { buyOrders, sellOrders } = orderBook
  const spread = sellOrders[0]?.price - buyOrders[0]?.price || 0
  const spreadPercent = (spread / buyOrders[0]?.price) * 100 || 0

  const maxBuyTotal = Math.max(...buyOrders.map((order) => order.total))
  const maxSellTotal = Math.max(...sellOrders.map((order) => order.total))

  const handleOrderClick = (price: number, type: "buy" | "sell") => {
    // In real app, this would populate the trading panel
    console.log(`Clicked ${type} order at $${price}`)
  }

  return (
    <Card className="bg-black border-[#1E2329] p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Order Book</h3>
        <div className="flex items-center gap-2">
          <Button
            variant={selectedOutcome === "Yes" ? "default" : "ghost"}
            size="sm"
            onClick={() => setSelectedOutcome("Yes")}
            className={cn("h-8 px-3 text-xs", selectedOutcome === "Yes" ? "bg-[#00D395] text-black" : "text-[#94A3B8]")}
          >
            YES
          </Button>
          <Button
            variant={selectedOutcome === "No" ? "default" : "ghost"}
            size="sm"
            onClick={() => setSelectedOutcome("No")}
            className={cn("h-8 px-3 text-xs", selectedOutcome === "No" ? "bg-[#FF3B69] text-white" : "text-[#94A3B8]")}
          >
            NO
          </Button>
        </div>
      </div>

      {/* Headers */}
      <div className="grid grid-cols-3 gap-4 mb-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wide">
        <div className="text-left">Price</div>
        <div className="text-center">Size</div>
        <div className="text-right">Total</div>
      </div>

      <div className="space-y-4">
        {/* Sell Orders (Asks) */}
        <div className="space-y-1">
          <AnimatePresence>
            {sellOrders
              .slice()
              .reverse()
              .map((order, index) => {
                const depthPercent = (order.total / maxSellTotal) * 100
                const isAnimating = animatingOrders.has(`sell-${index}`)

                return (
                  <motion.div
                    key={`sell-${order.price}-${index}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{
                      opacity: 1,
                      x: 0,
                      scale: isAnimating ? 1.02 : 1,
                    }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="relative cursor-pointer hover:bg-[#FF3B69]/5 rounded p-1 transition-colors"
                    onClick={() => handleOrderClick(order.price, "sell")}
                  >
                    {/* Depth Bar */}
                    <div
                      className="absolute inset-0 bg-[#FF3B69]/10 rounded transition-all duration-300"
                      style={{ width: `${depthPercent}%` }}
                    />

                    <div className="relative grid grid-cols-3 gap-4 text-sm">
                      <div className="text-[#FF3B69] font-medium">${order.price.toFixed(3)}</div>
                      <div className="text-center text-white">{order.size.toLocaleString()}</div>
                      <div className="text-right text-[#94A3B8]">{order.total.toLocaleString()}</div>
                    </div>
                  </motion.div>
                )
              })}
          </AnimatePresence>
        </div>

        {/* Spread Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center py-3 border-y border-[#1E2329]"
        >
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-[#94A3B8] border-[#1E2329]">
              <ArrowUpDown className="w-3 h-3 mr-1" />
              Spread: ${spread.toFixed(3)} ({spreadPercent.toFixed(2)}%)
            </Badge>
          </div>
        </motion.div>

        {/* Buy Orders (Bids) */}
        <div className="space-y-1">
          <AnimatePresence>
            {buyOrders.map((order, index) => {
              const depthPercent = (order.total / maxBuyTotal) * 100
              const isAnimating = animatingOrders.has(`buy-${index}`)

              return (
                <motion.div
                  key={`buy-${order.price}-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{
                    opacity: 1,
                    x: 0,
                    scale: isAnimating ? 1.02 : 1,
                  }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="relative cursor-pointer hover:bg-[#00D395]/5 rounded p-1 transition-colors"
                  onClick={() => handleOrderClick(order.price, "buy")}
                >
                  {/* Depth Bar */}
                  <div
                    className="absolute inset-0 bg-[#00D395]/10 rounded transition-all duration-300"
                    style={{ width: `${depthPercent}%` }}
                  />

                  <div className="relative grid grid-cols-3 gap-4 text-sm">
                    <div className="text-[#00D395] font-medium">${order.price.toFixed(3)}</div>
                    <div className="text-center text-white">{order.size.toLocaleString()}</div>
                    <div className="text-right text-[#94A3B8]">{order.total.toLocaleString()}</div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Order Book Stats */}
      <div className="mt-6 pt-4 border-t border-[#1E2329]">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-[#94A3B8]">Total Bids:</span>
            <span className="text-[#00D395] font-medium">
              {buyOrders[buyOrders.length - 1]?.total.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#94A3B8]">Total Asks:</span>
            <span className="text-[#FF3B69] font-medium">
              {sellOrders[sellOrders.length - 1]?.total.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </Card>
  )
}
