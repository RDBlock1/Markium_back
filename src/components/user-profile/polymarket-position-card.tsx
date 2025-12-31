/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'

export interface PositionCard {
    id: string
    conditionId?: string
    market: string
    slug: string
    eventSlug: string
    icon: string
    outcome: string
    outcomeIndex: number
    oppositeOutcome: string
    shares: number
    totalBought: number
    totalSold?: number
    avgPrice: number
    avgBuyPrice?: number
    avgSellPrice?: number
    currentPrice: number
    closePrice?: number
    initialValue: number
    currentValue: number
    closeValue?: number
    pnl: number
    realizedPnl: number
    unrealizedPnl?: number
    percentPnl: number
    percentRealizedPnl: number
    redeemable: boolean
    mergeable: boolean
    resolved?: boolean
    negativeRisk: boolean
    endDate: string
    closedAt?: string
    status: 'open' | 'closed'
    label: 'WON' | 'LOST' | 'BREAK-EVEN'
}

// Sample open position
const sampleOpenPosition: PositionCard = {
    id: "0xf19ddb374327a507aaaa7066d025354b78806b0246cb4646fd607d9f0f5659ab",
    market: "Hawks vs. Clippers",
    slug: "nba-atl-lac-2025-11-11",
    eventSlug: "nba-atl-lac-2025-11-11",
    icon: "https://polymarket-upload.s3.us-east-2.amazonaws.com/super+cool+basketball+in+red+and+blue+wow.png",
    outcome: "Hawks",
    outcomeIndex: 0,
    oppositeOutcome: "Clippers",
    shares: 39839.247846,
    avgPrice: 0.739035,
    currentPrice: 0.995,
    initialValue: 29442.598531868607,
    currentValue: 39640.051606769994,
    pnl: 10197.453074901387,
    percentPnl: 34.63503081721433,
    realizedPnl: -7905.44073,
    percentRealizedPnl: -59.682305346496,
    redeemable: false,
    mergeable: true,
    endDate: "2025-11-11",
    negativeRisk: false,
    totalBought: 133037.301311,
    status: "open",
    label:'WON'
}

export default function PolymarketPositionCard({ position = sampleOpenPosition }: { position?: PositionCard }) {
    const cardRef = useRef<HTMLDivElement>(null)
    const [isDownloading, setIsDownloading] = useState(false)

    const isOpen = position.status === 'open'
    const isClosed = position.status === 'closed'

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value)
    }

    const generateCardWithCanvas = async () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) return null

        canvas.width = 600
        canvas.height = 800

        // Draw gradient background
        const gradient = ctx.createLinearGradient(0, 0, 600, 800)
        gradient.addColorStop(0, '#0a0a0a')
        gradient.addColorStop(1, '#1a1a2e')
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, 600, 800)

        // Add glow effects
        ctx.shadowColor = isOpen ? '#10b981' : '#9333ea'
        ctx.shadowBlur = 100
        ctx.fillStyle = isOpen ? 'rgba(16, 185, 129, 0.3)' : 'rgba(147, 51, 234, 0.3)'
        ctx.beginPath()
        ctx.arc(100, 100, 150, 0, Math.PI * 2)
        ctx.fill()

        ctx.shadowColor = '#2563eb'
        ctx.fillStyle = 'rgba(37, 99, 235, 0.3)'
        ctx.beginPath()
        ctx.arc(500, 700, 150, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0

        // Draw text content
        ctx.fillStyle = '#9ca3af'
        ctx.font = '14px Inter, sans-serif'
        ctx.fillText('POLYMARKET POSITION', 32, 50)

        // Draw status badge
        if (isOpen) {
            ctx.fillStyle = 'rgba(16, 185, 129, 0.2)'
            ctx.fillRect(32, 65, 80, 28)
            ctx.fillStyle = '#86efac'
        } else {
            ctx.fillStyle = 'rgba(147, 51, 234, 0.2)'
            ctx.fillRect(32, 65, 80, 28)
            ctx.fillStyle = '#c084fc'
        }
        ctx.font = 'bold 12px Inter, sans-serif'
        ctx.fillText(isOpen ? 'ACTIVE' : 'CLOSED', 45, 83)

        // Draw market question
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 22px Inter, sans-serif'
        const words = position.market.split(' ')
        let line = ''
        let y = 150
        for (let i = 0; i < words.length; i++) {
            const testLine = line + words[i] + ' '
            const metrics = ctx.measureText(testLine)
            if (metrics.width > 536 && i > 0) {
                ctx.fillText(line, 32, y)
                line = words[i] + ' '
                y += 28
            } else {
                line = testLine
            }
        }
        ctx.fillText(line, 32, y)

        // Draw outcome
        y += 55
        ctx.fillStyle = 'rgba(147, 51, 234, 0.2)'
        ctx.fillRect(32, y - 25, 200, 40)
        ctx.fillStyle = '#c084fc'
        ctx.font = '14px Inter, sans-serif'
        ctx.fillText('Position:', 45, y)
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 18px Inter, sans-serif'
        ctx.fillText(position.outcome, 120, y)

        // Draw stats grid
        y += 70
        let stats: Array<{ label: string; value: string; highlight?: boolean }> = []

        if (isOpen) {
            const unrealizedPnl = position.unrealizedPnl !== undefined ? position.unrealizedPnl : position.pnl
            const isProfitable = unrealizedPnl > 0
            
            stats = [
                { label: 'CURRENT VALUE', value: formatCurrency(position.currentValue), highlight: true },
                { label: 'UNREALIZED P&L', value: formatCurrency(unrealizedPnl), highlight: true },
                { label: 'ENTRY PRICE', value: `${(position.avgPrice * 100).toFixed(1)}¢` },
                { label: 'CURRENT PRICE', value: `${(position.currentPrice * 100).toFixed(1)}¢` },
                { label: 'SHARES HELD', value: position.shares.toFixed(0) },
                { label: 'PERCENT P&L', value: `${position.percentPnl.toFixed(1)}%` }
            ]
        } else {
            stats = [
                { label: 'REALIZED P&L', value: formatCurrency(position.realizedPnl), highlight: true },
                { label: 'TOTAL BOUGHT', value: formatCurrency(position.totalBought) },
                { label: 'ENTRY PRICE', value: `${(position.avgPrice * 100).toFixed(1)}¢` },
                { label: 'EXIT PRICE', value: `${(position.closePrice || position.currentPrice) * 100}¢` }
            ]
        }

        stats.forEach((stat, index) => {
            const x = (index % 2) * 284 + 32
            const statY = y + Math.floor(index / 2) * 110

            if (stat.highlight) {
                const pnlValue = isOpen ? (position.unrealizedPnl !== undefined ? position.unrealizedPnl : position.pnl) : position.realizedPnl
                ctx.fillStyle = pnlValue > 0
                    ? 'rgba(16, 185, 129, 0.1)'
                    : 'rgba(239, 68, 68, 0.1)'
            } else {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'
            }
            ctx.fillRect(x, statY, 252, 90)

            ctx.fillStyle = '#9ca3af'
            ctx.font = '11px Inter, sans-serif'
            ctx.fillText(stat.label, x + 16, statY + 28)

            if (stat.highlight) {
                const pnlValue = isOpen ? (position.unrealizedPnl !== undefined ? position.unrealizedPnl : position.pnl) : position.realizedPnl
                ctx.fillStyle = pnlValue > 0 ? '#86efac' : '#fca5a5'
            } else {
                ctx.fillStyle = '#ffffff'
            }
            ctx.font = 'bold 24px Inter, sans-serif'
            ctx.fillText(stat.value, x + 16, statY + 65)
        })

        // Draw footer separator line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(32, 700)
        ctx.lineTo(568, 700)
        ctx.stroke()

        // Draw branding (left side)
        ctx.fillStyle = '#c084fc'
        ctx.font = 'bold 24px Inter, sans-serif'
        ctx.fillText('markiumpro.com', 32, 740)

        ctx.fillStyle = '#6b7280'
        ctx.font = '12px Inter, sans-serif'
        ctx.fillText('Professional Trading Analytics', 32, 760)

        // Draw X handle (right side)
        ctx.textAlign = 'right'
        ctx.fillStyle = '#9ca3af'
        ctx.font = '11px Inter, sans-serif'
        ctx.fillText('Track your positions', 568, 740)

        ctx.fillStyle = '#c084fc'
        ctx.font = 'bold 13px Inter, sans-serif'
        ctx.fillText('@markiumpro', 568, 760)

        ctx.textAlign = 'left'

        return canvas.toDataURL('image/png')
    }

    const downloadCard = async () => {
        setIsDownloading(true)
        try {
            const dataUrl = await generateCardWithCanvas()
            if (dataUrl) {
                const link = document.createElement('a')
                link.download = `polymarket-position-${position.slug.slice(0, 20)}.png`
                link.href = dataUrl
                link.click()
            } else {
                alert('Failed to generate card. Please try again.')
            }
        } catch (error) {
            console.error('Error downloading card:', error)
            alert('Error generating card. Please try again.')
        } finally {
            setIsDownloading(false)
        }
    }

    const shareOnX = async () => {
        setIsDownloading(true)
        try {
            const dataUrl = await generateCardWithCanvas()
            if (dataUrl) {
                const response = await fetch(dataUrl)
                const blob = await response.blob()
                const file = new File([blob], 'polymarket-position.png', { type: 'image/png' })

                if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                    try {
                        await navigator.share({
                            files: [file],
                            title: 'My Polymarket Position',
                            text: `Check out my ${isOpen ? 'open' : 'closed'} position on @Polymarket! 🚀\n\nTrack all my positions on @markiumpro markiumpro.com`
                        })
                    } catch (error) {
                        console.log('Share cancelled or failed:', error)
                        downloadFallback(dataUrl)
                    }
                } else {
                    downloadFallback(dataUrl)
                }
            } else {
                alert('Failed to generate card. Please try again.')
            }
        } catch (error) {
            console.error('Error sharing card:', error)
            alert('Error generating card. Please try again.')
        } finally {
            setIsDownloading(false)
        }
    }

    const downloadFallback = (dataUrl: string) => {
        const link = document.createElement('a')
        link.download = `polymarket-position-${Date.now()}.png`
        link.href = dataUrl
        link.click()

        setTimeout(() => {
            const text = `Check out my ${isOpen ? 'open' : 'closed'} @Polymarket position! 🚀\n\nTrack all my positions on @markiumpro markiumpro.com\n\n#Polymarket #Trading #Prediction`
            const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`
            window.open(url, '_blank')
            alert('Image downloaded! Please attach it to your tweet manually.')
        }, 500)
    }

    // Calculate unrealized PnL for open positions
    const unrealizedPnl = isOpen ? (position.unrealizedPnl !== undefined ? position.unrealizedPnl : position.pnl) : 0
    const displayPnl = isOpen ? unrealizedPnl : position.realizedPnl
    const isProfitable = displayPnl > 0

    return (
        <div className="flex items-center justify-center p-4">
            <div className="relative">
                <div
                    ref={cardRef}
                    id="position-card"
                    className="relative w-[500px] h-[660px] rounded-3xl overflow-hidden shadow-2xl"
                    style={{
                        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
                    }}
                >
                    {/* Animated Background Effects */}
                    <div className="absolute inset-0" style={{ opacity: 0.3 }}>
                        <div
                            className="absolute top-0 left-0 w-80 h-80 rounded-full"
                            style={{
                                background: isOpen ? '#10b981' : '#9333ea',
                                filter: 'blur(96px)',
                                animation: 'pulse 3s ease-in-out infinite'
                            }}
                        />
                        <div
                            className="absolute bottom-0 right-0 w-80 h-80 rounded-full"
                            style={{
                                background: '#2563eb',
                                filter: 'blur(96px)',
                                animation: 'pulse 3s ease-in-out infinite',
                                animationDelay: '1s'
                            }}
                        />
                    </div>

                    {/* Grid Pattern Overlay */}
                    <div
                        className="absolute inset-0"
                        style={{
                            opacity: 0.05,
                            backgroundImage: `linear-gradient(0deg, rgba(255,255,255,0.1) 1px, transparent 1px),
                               linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                            backgroundSize: '50px 50px'
                        }}
                    />

                    {/* Content */}
                    <div className="relative z-10 p-6 h-full flex flex-col">
                        {/* Header */}
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-sm font-medium mb-1 text-gray-400">POLYMARKET POSITION</h3>
                                <div className="flex items-center gap-2">
                                    <span className="px-3 py-1 rounded-full text-xs font-bold" style={{
                                        backgroundColor: isOpen ? 'rgba(16, 185, 129, 0.2)' : 'rgba(147, 51, 234, 0.2)',
                                        color: isOpen ? '#86efac' : '#c084fc',
                                        border: `1px solid ${isOpen ? 'rgba(16, 185, 129, 0.3)' : 'rgba(147, 51, 234, 0.3)'}`
                                    }}>
                                        {isOpen ? 'ACTIVE' : 'CLOSED'}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        {formatDate(position.closedAt || position.endDate)}
                                    </span>
                                </div>
                            </div>
                            <div className="w-12 h-12 rounded-2xl p-[1px]" style={{ 
                                background: `linear-gradient(135deg, ${isOpen ? '#10b981' : '#9333ea'} 0%, #2563eb 100%)` 
                            }}>
                                <div className="w-full h-full bg-black rounded-2xl flex items-center justify-center">
                                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ 
                                        background: `linear-gradient(135deg, ${isOpen ? '#10b981' : '#9333ea'} 0%, #2563eb 100%)` 
                                    }}>
                                        <span className="text-white font-bold text-sm">Ξ</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Market Question */}
                        <div className="mb-6">
                            <h1 className="text-xl font-bold leading-relaxed mb-4 text-white">
                                {position.market}
                            </h1>

                            {/* Outcome Badge */}
                            <div className="inline-flex items-center gap-3 rounded-2xl p-3" style={{
                                background: 'linear-gradient(to right, rgba(147, 51, 234, 0.2), rgba(37, 99, 235, 0.2))',
                                border: '1px solid rgba(147, 51, 234, 0.3)'
                            }}>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-400" style={{
                                        animation: isOpen ? 'pulse 2s ease-in-out infinite' : 'none',
                                        backgroundColor: isOpen ? '#86efac' : '#c084fc'
                                    }} />
                                    <span className="text-sm font-medium text-gray-300">Position:</span>
                                </div>
                                <span className="text-lg font-bold text-white">{position.outcome}</span>
                            </div>
                        </div>

                        {/* Position Details Grid */}
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            {isOpen ? (
                                <>
                                    <div className="rounded-2xl p-3" style={{
                                        backgroundColor: isProfitable ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                        border: `1px solid ${isProfitable ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                                    }}>
                                        <p className="text-xs mb-1 text-gray-400">CURRENT VALUE</p>
                                        <p className="text-xl font-bold" style={{ color: isProfitable ? '#86efac' : '#fca5a5' }}>
                                            {formatCurrency(position.currentValue)}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl p-3" style={{
                                        backgroundColor: isProfitable ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                        border: `1px solid ${isProfitable ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                                    }}>
                                        <p className="text-xs mb-1 text-gray-400">UNREALIZED P&L</p>
                                        <p className="text-xl font-bold" style={{ color: isProfitable ? '#86efac' : '#fca5a5' }}>
                                            {formatCurrency(unrealizedPnl)}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl p-3" style={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)'
                                    }}>
                                        <p className="text-xs mb-1 text-gray-400">ENTRY PRICE</p>
                                        <p className="text-xl font-bold text-white">
                                            {(position.avgPrice * 100).toFixed(1)}¢
                                        </p>
                                    </div>
                                    <div className="rounded-2xl p-3" style={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)'
                                    }}>
                                        <p className="text-xs mb-1 text-gray-400">CURRENT PRICE</p>
                                        <p className="text-xl font-bold text-white">
                                            {(position.currentPrice * 100).toFixed(1)}¢
                                        </p>
                                    </div>
                                    <div className="rounded-2xl p-3" style={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)'
                                    }}>
                                        <p className="text-xs mb-1 text-gray-400">SHARES HELD</p>
                                        <p className="text-xl font-bold text-white">
                                            {position.shares.toFixed(0)}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl p-3" style={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)'
                                    }}>
                                        <p className="text-xs mb-1 text-gray-400">PERCENT P&L</p>
                                        <p className="text-xl font-bold" style={{ 
                                            color: isProfitable ? '#86efac' : '#fca5a5' 
                                        }}>
                                            {position.percentPnl.toFixed(1)}%
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="rounded-2xl p-3 col-span-2" style={{
                                        backgroundColor: isProfitable ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                        border: `1px solid ${isProfitable ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                                    }}>
                                        <p className="text-xs mb-1 text-gray-400">REALIZED P&L</p>
                                        <p className="text-2xl font-bold" style={{ color: isProfitable ? '#86efac' : '#fca5a5' }}>
                                            {formatCurrency(position.realizedPnl)}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl p-3" style={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)'
                                    }}>
                                        <p className="text-xs mb-1 text-gray-400">TOTAL BOUGHT</p>
                                        <p className="text-xl font-bold text-white">
                                            {formatCurrency(position.totalBought)}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl p-3" style={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)'
                                    }}>
                                        <p className="text-xs mb-1 text-gray-400">ENTRY PRICE</p>
                                        <p className="text-xl font-bold text-white">
                                            {(position.avgPrice * 100).toFixed(1)}¢
                                        </p>
                                    </div>
                                    <div className="rounded-2xl p-3 col-span-2" style={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)'
                                    }}>
                                        <p className="text-xs mb-1 text-gray-400">EXIT PRICE</p>
                                        <p className="text-xl font-bold text-white">
                                            {((position.closePrice || position.currentPrice) * 100).toFixed(1)}¢
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Position ID */}
                        <div className="mb-auto">
                            <div className="rounded-xl p-3" style={{
                                background: 'linear-gradient(to right, rgba(147, 51, 234, 0.1), rgba(37, 99, 235, 0.1))',
                                border: '1px solid rgba(147, 51, 234, 0.2)'
                            }}>
                                <p className="text-xs mb-2 text-gray-400">POSITION ID</p>
                                <p className="text-xs font-mono break-all text-purple-300">
                                    {position.id.slice(0, 20)}...{position.id.slice(-20)}
                                </p>
                            </div>
                        </div>

                        {/* Footer Branding */}
                        <div className="mt-6 pt-4" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-bold" style={{
                                        background: 'linear-gradient(to right, #c084fc, #60a5fa)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        backgroundClip: 'text'
                                    }}>
                                        markiumpro.com
                                    </h2>
                                    <p className="text-xs mt-1 text-gray-500">Professional Trading Analytics</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{
                                        background: 'linear-gradient(135deg, #9333ea 0%, #2563eb 100%)'
                                    }}>
                                        <svg className="w-4 h-4" fill="white" viewBox="0 0 24 24">
                                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                        </svg>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-400">Track your positions</p>
                                        <p className="text-xs font-medium text-purple-300">#markiumpro</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Status Badge */}
                    <div className="absolute top-6 right-6" style={{ transform: 'rotate(12deg)' }}>
                        <div className="text-xs font-bold px-2 py-1 rounded-full" style={{
                            background: isOpen 
                                ? 'linear-gradient(to right, #10b981, #059669)' 
                                : 'linear-gradient(to right, #c084fc, #9333ea)',
                            color: '#ffffff'
                        }}>
                            {isOpen ? 'LIVE' : 'SETTLED'}
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-6 justify-center">
                    <Button
                        onClick={downloadCard}
                        disabled={isDownloading}
                        className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50"
                    >
                        {isDownloading ? 'Generating...' : 'Download Card'}
                    </Button>
                    <Button
                        onClick={shareOnX}
                        disabled={isDownloading}
                        variant="outline"
                        className="px-6 py-2 bg-black text-white font-semibold rounded-xl hover:bg-gray-900 transition-all duration-200 border border-gray-800 disabled:opacity-50"
                    >
                        {isDownloading ? 'Generating...' : 'Share on X'}
                    </Button>
                </div>
            </div>

            <style jsx global>{`
                @keyframes pulse {
                    0%, 100% {
                        opacity: 0.3;
                    }
                    50% {
                        opacity: 0.5;
                    }
                }
            `}</style>
        </div>
    )
}