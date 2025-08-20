"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { AlertTriangle, RefreshCw } from "lucide-react"

interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  showRetry?: boolean
}

export function ErrorState({
  title = "Something went wrong",
  message = "We encountered an error while loading this content.",
  onRetry,
  showRetry = true,
}: ErrorStateProps) {
  return (
    <Card className="bg-[#12161C] border-[#1E2329] p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="p-3 bg-[#FF3B69]/10 rounded-full">
            <AlertTriangle className="w-8 h-8 text-[#FF3B69]" />
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
          <p className="text-[#94A3B8] text-sm max-w-md mx-auto">{message}</p>
        </div>
        {showRetry && onRetry && (
          <Button
            onClick={onRetry}
            variant="outline"
            className="border-[#1E2329] text-[#94A3B8] hover:text-white bg-transparent"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        )}
      </motion.div>
    </Card>
  )
}
