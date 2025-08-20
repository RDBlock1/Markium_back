"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Wifi, WifiOff } from "lucide-react"

export function WebSocketIndicator() {
  const [isConnected, setIsConnected] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(new Date())

  // Simulate connection status changes
  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly simulate connection issues
      if (Math.random() > 0.95) {
        setIsConnected(false)
        setTimeout(() => setIsConnected(true), 2000)
      } else {
        setLastUpdate(new Date())
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="fixed top-4 right-4 z-50">
      <Badge
        variant={isConnected ? "default" : "destructive"}
        className={`flex items-center gap-2 ${isConnected ? "bg-[#00D395] text-black" : "bg-[#FF3B69] text-white"}`}
      >
        {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
        {isConnected ? "Live" : "Reconnecting..."}
      </Badge>
    </motion.div>
  )
}
