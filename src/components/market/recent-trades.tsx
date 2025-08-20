"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, TrendingUp, TrendingDown, Clock, Wifi, WifiOff } from "lucide-react"
import { cn } from "@/lib/utils"

// Trade type based on Polymarket's WebSocket data
interface Trade {
  id: string
  type: "buy" | "sell"
  outcome: "Yes" | "No"
  price: number
  amount: number
  timestamp: string
  user: string
  transactionHash?: string
  market?: string
  asset_id?: string
}

interface WebSocketTradeEvent {
  event_type: 'last_trade_price'
  asset_id: string
  market: string
  price: string
  side: 'BUY' | 'SELL'
  size: string
  fee_rate_bps: string
  timestamp: string
}

interface RecentTradesProps {
  tokenId?: string // Optional: filter trades for specific market token
  marketId?: string // Optional: filter trades for specific market
}

export function RecentTrades({ tokenId, marketId }: RecentTradesProps) {
  const [trades, setTrades] = useState<Trade[]>([])
  const [newTradeIds, setNewTradeIds] = useState<Set<string>>(new Set())
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [totalTrades, setTotalTrades] = useState(0)
  const [avgPrice, setAvgPrice] = useState(0)
  
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Connect to Polymarket WebSocket
  const connectWebSocket = () => {
    try {

      
      // Polymarket's public WebSocket endpoint for market data
      const wsUrl = 'wss://ws-subscriptions-clob.polymarket.com/ws/market'
      const ws = new WebSocket(wsUrl)
      
      ws.onopen = () => {

        setIsConnected(true)
        setConnectionError(null)
        
        // Subscribe to market channel
        const subscribeMessage = {
          type: 'subscribe',
          channel: 'market',
          // If tokenId is provided, subscribe to specific market
          ...(tokenId && { assets: [tokenId] })
        }
        
        ws.send(JSON.stringify(subscribeMessage))

        
        // Keep connection alive with ping
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }))
          }
        }, 30000) // Ping every 30 seconds
      }
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          handleWebSocketMessage(data)
        } catch (error) {
          console.error("Error parsing WebSocket message:", error)
        }
      }
      
      ws.onerror = (error) => {
        console.error("WebSocket error:", error)
        setConnectionError("Connection error occurred")
      }
      
      ws.onclose = (event) => {

        setIsConnected(false)
        if (pingIntervalRef.current) {
          if (pingIntervalRef.current) {
            if (pingIntervalRef.current) {
              if (pingIntervalRef.current) {
                if (pingIntervalRef.current) {
                  if (pingIntervalRef.current) {
                    if (pingIntervalRef.current) {
                      if (pingIntervalRef.current) {
                        clearInterval(pingIntervalRef.current)
                      }
                    }
                  }
                }
              }
            }
          }
        }
        
        // Attempt to reconnect after 5 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket()
        }, 5000)
      }
      
      wsRef.current = ws
    } catch (error) {
      console.error("Failed to connect WebSocket:", error)
      setConnectionError("Failed to connect to real-time data")
    }
  }

  // Handle incoming WebSocket messages
  const handleWebSocketMessage = (data: any) => {
    // Handle trade events
    if (data.event_type === 'last_trade_price') {
      const tradeEvent = data as WebSocketTradeEvent
      
      // Filter by marketId if provided
      if (marketId && tradeEvent.market !== marketId) {
        return
      }
      
      // Create trade object from WebSocket data
      const newTrade: Trade = {
        id: `${tradeEvent.timestamp}-${Math.random().toString(36).substr(2, 9)}`,
        type: tradeEvent.side.toLowerCase() as 'buy' | 'sell',
        outcome: parseFloat(tradeEvent.price) > 0.5 ? "Yes" : "No", // Simplified logic
        price: parseFloat(tradeEvent.price),
        amount: parseFloat(tradeEvent.size),
        timestamp: new Date(parseInt(tradeEvent.timestamp)).toISOString(),
        user: formatAddress(tradeEvent.market), // Using market as placeholder
        market: tradeEvent.market,
        asset_id: tradeEvent.asset_id
      }
      
      // Add new trade to the list
      setTrades(prevTrades => {
        const updatedTrades = [newTrade, ...prevTrades.slice(0, 49)] // Keep last 50 trades
        
        // Calculate statistics
        updateTradeStats(updatedTrades)
        
        return updatedTrades
      })
      
      // Highlight new trade
      setNewTradeIds(new Set([newTrade.id]))
      setTimeout(() => {
        setNewTradeIds(new Set())
      }, 1000)
      
      // Increment total trades counter
      setTotalTrades(prev => prev + 1)
    }
    
    // Handle order book updates (optional - for additional context)
    if (data.event_type === 'book') {
      console.log("Order book update received:", data)
    }
  }

  // Fetch initial trades via REST API
  const fetchInitialTrades = async () => {
    try {
      const url = tokenId 
        ? `https://data-api.polymarket.com/trades?market=${tokenId}&limit=20`
        : `https://data-api.polymarket.com/trades?limit=20`
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (Array.isArray(data)) {
        const formattedTrades: Trade[] = data.map((trade: any) => ({
          id: trade.transactionHash || `${trade.timestamp}-${Math.random().toString(36).substr(2, 9)}`,
          type: trade.side?.toLowerCase() || 'buy',
          outcome: trade.outcome || (trade.outcomeIndex === 0 ? "Yes" : "No"),
          price: parseFloat(trade.price) || 0,
          amount: parseFloat(trade.size) || 0,
          timestamp: new Date(trade.timestamp * 1000).toISOString(),
          user: formatAddress(trade.maker || trade.taker || trade.proxyWallet),
          transactionHash: trade.transactionHash,
          market: trade.market,
          asset_id: trade.asset
        }))
        
        setTrades(formattedTrades)
        updateTradeStats(formattedTrades)
        setTotalTrades(formattedTrades.length)
      }
    } catch (error) {
      console.error("Error fetching initial trades:", error)
    }
  }

  // Update trade statistics
  const updateTradeStats = (tradesList: Trade[]) => {
    if (tradesList.length > 0) {
      const sum = tradesList.reduce((acc, trade) => acc + trade.price, 0)
      setAvgPrice(sum / tradesList.length)
    }
  }

  // Format wallet address
  const formatAddress = (address: string) => {
    if (!address) return "Unknown"
    if (address.length > 10) {
      return `${address.slice(0, 6)}...${address.slice(-4)}`
    }
    return address
  }

  // Format time ago
  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const tradeTime = new Date(timestamp)
    const diffInSeconds = Math.floor((now.getTime() - tradeTime.getTime()) / 1000)

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return `${Math.floor(diffInSeconds / 86400)}d ago`
  }

  // Handle trade click
  const handleTradeClick = (trade: Trade) => {
    console.log("Clicked trade:", trade)
    // Could open transaction on Polygonscan
    if (trade.transactionHash) {
      window.open(`https://polygonscan.com/tx/${trade.transactionHash}`, '_blank')
    }
  }

  // Initialize WebSocket connection
  useEffect(() => {
    // Fetch initial trades
    fetchInitialTrades()
    
    // Connect to WebSocket
    connectWebSocket()
    
    // Cleanup on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current)
      }
    }
  }, [tokenId, marketId])

  return (
    <Card className="bg-[#12161C] border-[#1E2329] p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Recent Trades</h3>
        <div className="flex items-center gap-3">
          {/* Connection Status */}
          <div className={cn(
            "flex items-center gap-2 text-xs px-2 py-1 rounded",
            isConnected 
              ? "text-[#00D395] bg-[#00D395]/10" 
              : "text-[#FF3B69] bg-[#FF3B69]/10"
          )}>
            {isConnected ? (
              <>
                <Wifi className="w-3 h-3" />
                Live
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3" />
                Connecting...
              </>
            )}
          </div>
          
          {/* Refresh Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchInitialTrades}
            className="h-7 px-2 text-[#94A3B8] hover:text-white"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {connectionError && (
        <div className="mb-4 p-3 bg-[#FF3B69]/10 border border-[#FF3B69]/20 rounded text-sm text-[#FF3B69]">
          {connectionError}
        </div>
      )}

      {/* Headers */}
      <div className="grid grid-cols-5 gap-2 mb-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wide">
        <div>Type</div>
        <div>Price</div>
        <div>Amount</div>
        <div>User</div>
        <div className="text-right">Time</div>
      </div>

      {/* Trades List */}
      <div className="space-y-1 max-h-96 overflow-y-auto">
        <AnimatePresence initial={false}>
          {trades.length === 0 ? (
            <div className="text-center py-8 text-[#94A3B8]">
              <p>Waiting for trades...</p>
              {!isConnected && <p className="text-xs mt-2">Connecting to real-time data...</p>}
            </div>
          ) : (
            trades.map((trade) => {
              const isNew = newTradeIds.has(trade.id)
              const isBuy = trade.type === "buy"
              const tradeColor = isBuy ? "#00D395" : "#FF3B69"

              return (
                <motion.div
                  key={trade.id}
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    backgroundColor: isNew ? `${tradeColor}15` : "transparent",
                  }}
                  exit={{ opacity: 0, y: 20, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className={cn(
                    "grid grid-cols-5 gap-2 p-2 rounded cursor-pointer transition-all hover:bg-[#1E2329]/50",
                    isNew && "ring-1 ring-opacity-30",
                    isBuy ? "ring-[#00D395]" : "ring-[#FF3B69]",
                  )}
                  onClick={() => handleTradeClick(trade)}
                >
                  {/* Type & Outcome */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {isBuy ? (
                        <TrendingUp className="w-3 h-3 text-[#00D395]" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-[#FF3B69]" />
                      )}
                      <span className={cn("text-xs font-medium", isBuy ? "text-[#00D395]" : "text-[#FF3B69]")}>
                        {trade.type.toUpperCase()}
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs px-1 py-0 h-4",
                        trade.outcome === "Yes" 
                          ? "border-[#00D395] text-[#00D395]" 
                          : "border-[#FF3B69] text-[#FF3B69]",
                      )}
                    >
                      {trade.outcome}
                    </Badge>
                  </div>

                  {/* Price */}
                  <div className="text-sm font-medium text-white">
                    ${trade.price.toFixed(3)}
                  </div>

                  {/* Amount */}
                  <div className="text-sm text-[#94A3B8]">
                    {trade.amount.toLocaleString()}
                  </div>

                  {/* User */}
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-[#94A3B8] font-mono">
                      {trade.user}
                    </span>
                    {trade.transactionHash && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 text-[#6366F1] hover:text-[#6366F1]/80"
                        onClick={(e) => {
                          e.stopPropagation()
                          window.open(`https://polygonscan.com/tx/${trade.transactionHash}`, '_blank')
                        }}
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    )}
                  </div>

                  {/* Time */}
                  <div className="text-xs text-[#94A3B8] text-right">
                    {formatTimeAgo(trade.timestamp)}
                  </div>
                </motion.div>
              )
            })
          )}
        </AnimatePresence>
      </div>

      {/* Trade Stats */}
      <div className="mt-6 pt-4 border-t border-[#1E2329]">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="text-[#94A3B8]">Total Trades</div>
            <div className="text-white font-semibold">{totalTrades.toLocaleString()}</div>
          </div>
          <div className="text-center">
            <div className="text-[#94A3B8]">Avg Price</div>
            <div className="text-white font-semibold">
              ${avgPrice.toFixed(3)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-[#94A3B8]">Last Price</div>
            <div className={cn(
              "font-semibold", 
              trades[0]?.type === "buy" ? "text-[#00D395]" : "text-[#FF3B69]"
            )}>
              ${trades[0]?.price.toFixed(3) || "0.000"}
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}