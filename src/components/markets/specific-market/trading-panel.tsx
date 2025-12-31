/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/rules-of-hooks */
"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
    Wallet,
    TrendingUp,
    TrendingDown,
    ChevronUp,
    ChevronDown,
    AlertCircle,
    Info,
    Loader2
} from "lucide-react"
import type { MarketSlug, PriceReturns } from "@/types/market"
import { cn } from "@/lib/utils"
import useClobAPIStore from "@/store/clobAPIState"
import useMarketSelectionStore from "@/store/marketSelectionStore"
import { ClobClient } from "@polymarket/clob-client"
import { useAccount, useReadContract } from "wagmi"
import { formatUnits } from "viem"
import BuyButton from "./buy-button"
import React from "react"
import Image from "next/image"

interface TradingPanelProps {
    market?: MarketSlug[] | MarketSlug | null
    isMobile?: boolean
}

// USDC Contract on Polygon
const USDC_CONTRACT = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174" as const;

// USDC ABI (only the functions we need)
const USDC_ABI = [
    {
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'owner', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }],
    },
    {
        name: 'allowance',
        type: 'function',
        stateMutability: 'view',
        inputs: [
            { name: 'owner', type: 'address' },
            { name: 'spender', type: 'address' },
        ],
        outputs: [{ name: '', type: 'uint256' }],
    },
    {
        name: 'approve',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'spender', type: 'address' },
            { name: 'amount', type: 'uint256' },
        ],
        outputs: [{ name: '', type: 'bool' }],
    },
    {
        name: 'decimals',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint8' }],
    },
] as const;

export function TradingPanel({ market: propMarket, isMobile = false }: TradingPanelProps) {
    // Get selected market from global state
    const { selectedMarket, isLoadingMarket } = useMarketSelectionStore()

    // Use global selected market if available, otherwise fall back to prop
    const market = selectedMarket || propMarket

    const [activeTab, setActiveTab] = useState<"buy" | "sell">("buy")
    const [selectedOutcome, setSelectedOutcome] = useState<"Yes" | "No">("Yes")
    const [amount, setAmount] = useState("")
    const [isExpanded, setIsExpanded] = useState(!isMobile)

    // Handle the case where market might be an array, single object, or null
    const currentMarket = React.useMemo(() => {
        if (!market) return null;
        if (Array.isArray(market)) {
            return market.length > 0 ? market[0] : null;
        }
        return market;
    }, [market]);

    // Reset form when selected market changes
    useEffect(() => {
        if (selectedMarket) {
            setAmount("")
            setSelectedOutcome("Yes")
            setActiveTab("buy")
        }
    }, [selectedMarket?.id])

    // Add early return if no market data
    if (!currentMarket) {
        return (
            <div className="w-full lg:max-w-md">
                <Card className="bg-black border-[#1a1a1a] p-8 m-2">
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="rounded-full bg-[#1a1a1a] p-6 mb-6">
                            <AlertCircle className="w-12 h-12 text-gray-600" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">No Market Selected</h3>
                        <p className="text-sm text-gray-500 max-w-xs">
                            Please select a market from the list to start trading
                        </p>
                    </div>
                </Card>
            </div>
        );
    }

    const prices = Array.isArray(currentMarket.outcomePrices)
        ? currentMarket.outcomePrices.map((price: any) => Number.parseFloat(price))
        : typeof currentMarket.outcomePrices === "string"
            ? currentMarket.outcomePrices.split(",").map((price: any) => Number.parseFloat(price))
            : [0, 0];

    const yesPrice = prices[0] || 0;
    const noPrice = prices[1] || 0;
    const currentPrice = selectedOutcome === "Yes" ? yesPrice : noPrice
    const { address } = useAccount()
    const { data: usdcBalance, refetch: refetchBalance } = useReadContract({
        address: USDC_CONTRACT,
        abi: USDC_ABI,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
        query: {
            enabled: !!address,
        }
    });

    const formattedBalance = usdcBalance ? formatUnits(usdcBalance, 6) : "0";

    const quickAmounts = [10, 50, 100, 500]

    // Handle clobTokenIds safely
    const cloudIds = React.useMemo(() => {
        try {
            return JSON.parse(currentMarket.clobTokenIds || "[]") as string[];
        } catch {
            return [] as string[];
        }
    }, [currentMarket.clobTokenIds]);

    const handleQuickAmount = (value: number) => {
        setAmount(value.toString())
    }

    const handleMaxAmount = () => {
        setAmount(formattedBalance.toString())
    }

    useEffect(() => {
        const checkAndScrollToPanel = () => {
            if (window.location.hash === '#trading-panel') {
                const element = document.getElementById('trading-panel');
                if (element) {
                    const headerOffset = 100;
                    const elementPosition = element.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });

                    element.classList.add('ring-2', 'ring-[#FF8C42]', 'ring-opacity-50');
                    setTimeout(() => {
                        element.classList.remove('ring-2', 'ring-[#FF8C42]', 'ring-opacity-50');
                    }, 2000);
                }
            }
        };

        const timeoutId = setTimeout(checkAndScrollToPanel, 300);
        window.addEventListener('hashchange', checkAndScrollToPanel);

        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener('hashchange', checkAndScrollToPanel);
        };
    }, [selectedMarket?.id]);

    if (isMobile) {
        return (
            <motion.div
                initial={{ y: 100 }}
                animate={{ y: isExpanded ? 0 : 60 }}
                id="trading-panel"
                className="bg-black border-t border-[#1a1a1a] rounded-t-2xl"
            >
                {/* Mobile Header */}
                <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#0a0a0a] transition-colors"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "w-2 h-2 rounded-full",
                            selectedOutcome === "Yes" ? "bg-[#FF8C42]" : "bg-[#4A9FFF]"
                        )} />
                        <span className="font-semibold text-white">
                            {activeTab === "buy" ? "Buy" : "Sell"} {selectedOutcome}
                        </span>
                        <Badge variant="outline" className="text-xs border-[#2a2a2a] bg-[#1a1a1a] text-gray-400">
                            {(currentPrice * 100).toFixed(0)}¢
                        </Badge>
                    </div>
                    {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                    ) : (
                        <ChevronUp className="w-5 h-5 text-gray-500" />
                    )}
                </div>

                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="px-4 pb-6"
                        >
                            <TradingPanelContent
                                activeTab={activeTab}
                                setActiveTab={setActiveTab}
                                selectedOutcome={selectedOutcome}
                                setSelectedOutcome={setSelectedOutcome}
                                amount={amount}
                                setAmount={setAmount}
                                quickAmounts={quickAmounts}
                                handleQuickAmount={handleQuickAmount}
                                handleMaxAmount={handleMaxAmount}
                                market={currentMarket}
                                yesTokenId={cloudIds[1]}
                                noTokenId={cloudIds[0]}
                                udscBalance={formattedBalance}
                                isLoadingMarket={isLoadingMarket}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        )
    }

    return (
        <div className="w-full lg:max-w-md " id="trading-panel">
            <Card className="bg-gradient-to-br from-zinc-900 to-black border-zinc-800 p-6 sticky top-24 mt-2 md:mt-0 mx-2">
                {/* Market info header */}
                {selectedMarket && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 p-4 bg-[#0a0a0a] rounded-lg border border-[#1a1a1a]"
                    >
                        <div className="flex items-start gap-3">
                            <div className="relative">
                                <Image
                                    src={selectedMarket.image || "/placeholder.svg"}
                                    alt="Market"
                                    width={48}
                                    height={48}
                                    className="w-12 h-12 rounded-lg border border-[#1a1a1a]"
                                />
                            </div>
                            <div className="flex-1 min-w-0 my-auto">
                                <h3 className="text-xl sm:text-2xl my-auto font-semibold text-white  ">
                                    {selectedMarket.groupItemTitle}
                                </h3>
                            </div>
                        </div>
                    </motion.div>
                )}

                <TradingPanelContent
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    selectedOutcome={selectedOutcome}
                    setSelectedOutcome={setSelectedOutcome}
                    amount={amount}
                    setAmount={setAmount}
                    quickAmounts={quickAmounts}
                    handleQuickAmount={handleQuickAmount}
                    handleMaxAmount={handleMaxAmount}
                    market={currentMarket}
                    yesTokenId={cloudIds[0]}
                    noTokenId={cloudIds[1]}
                    udscBalance={formattedBalance}
                    isLoadingMarket={isLoadingMarket}
                />
            </Card>
        </div>
    )
}

interface TradingPanelContentProps {
    activeTab: "buy" | "sell"
    setActiveTab: (tab: "buy" | "sell") => void
    selectedOutcome: "Yes" | "No"
    setSelectedOutcome: (outcome: "Yes" | "No") => void
    amount: string
    setAmount: (amount: string) => void
    quickAmounts: number[]
    handleQuickAmount: (value: number) => void
    handleMaxAmount: () => void
    market: MarketSlug
    yesTokenId: string
    noTokenId: string
    udscBalance: string
    isLoadingMarket?: boolean
}

function TradingPanelContent({
    activeTab,
    setActiveTab,
    selectedOutcome,
    setSelectedOutcome,
    amount,
    setAmount,
    quickAmounts,
    handleQuickAmount,
    handleMaxAmount,
    market,
    yesTokenId,
    noTokenId,
    udscBalance,
    isLoadingMarket = false,
}: TradingPanelContentProps) {
    const outcomePrices = JSON.parse(market.outcomePrices);
    const [priceReturns, setPriceReturns] = useState<PriceReturns | null>(null);
    const [isCalculating, setIsCalculating] = useState(false);
    const { clobClient } = useClobAPIStore.getState();

    async function getPriceReturns(
        tokenId: string,
        clobClient: ClobClient,
        type: "BUY" | "SELL",
        investment_amount: number
    ): Promise<PriceReturns | null> {
        try {
            const priceData = await clobClient.getPrice(tokenId, type);

            let current_price;

            if (typeof priceData === 'object' && priceData !== null) {
                current_price = priceData.price || priceData.value || priceData.amount;

                if (current_price === undefined) {
                    console.log('Available properties in price data:', Object.keys(priceData));
                    current_price = Object.values(priceData)[0];
                }
            } else {
                current_price = priceData;
            }

            current_price = Number(current_price);

            if (isNaN(current_price) || current_price <= 0) {
                console.error(`Invalid price received: ${priceData}`);
                return null;
            }

            const potential_payout = investment_amount / current_price;
            const profit = potential_payout - investment_amount;

            return {
                investment_amount,
                current_price,
                potential_payout,
                profit,
                profit_percentage: ((profit / investment_amount) * 100).toFixed(2)
            };

        } catch (error) {
            console.error('Error fetching price returns:', error);
            return null;
        }
    }

    useEffect(() => {
        const fetchPriceReturns = async () => {
            if (!clobClient || !amount || Number(amount) <= 0) {
                setPriceReturns(null);
                return;
            }

            setIsCalculating(true);

            if (activeTab === "buy") {
                const tokenId = selectedOutcome === "Yes" ? yesTokenId : noTokenId;
                const result = await getPriceReturns(tokenId, clobClient, "BUY", Number(amount));
                setPriceReturns(result);
            }

            setIsCalculating(false);
        };

        const debounceTimer = setTimeout(fetchPriceReturns, 500);
        return () => clearTimeout(debounceTimer);
    }, [market.id, activeTab, amount, selectedOutcome]);

    const priceImpact = priceReturns && Number(amount) > 1000
        ? (Number(amount) / 10000) * 2
        : 0;

    return (
        <div className="space-y-5 w-full ">
            {/* Loading overlay */}
            {isLoadingMarket && (
                <Alert className="mb-4 bg-[#4A9FFF]/10 border-[#4A9FFF]/30">
                    <Loader2 className="h-4 w-4 animate-spin text-[#4A9FFF]" />
                    <AlertDescription className="text-[#4A9FFF] text-sm">
                        Loading market data...
                    </AlertDescription>
                </Alert>
            )}

            {/* Buy/Sell Tabs */}
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "buy" | "sell")}>
                <TabsList className="grid w-full grid-cols-2 bg-[#0a0a0a] border border-[#1a1a1a] p-1 rounded-lg h-auto">
                    <TabsTrigger
                        value="buy"
                        className={cn(
                            "flex items-center justify-center gap-2 py-3 rounded-md transition-all font-semibold",
                            "data-[state=active]:bg-[#1a1a1a] data-[state=active]:text-white",
                            "text-gray-500 hover:text-gray-300"
                        )}
                        disabled={isLoadingMarket}
                    >
                        <TrendingUp className="w-4 h-4" />
                        <span>Buy</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="sell"
                        className={cn(
                            "flex items-center justify-center gap-2 py-3 rounded-md transition-all font-semibold",
                            "data-[state=active]:bg-[#1a1a1a] data-[state=active]:text-white",
                            "text-gray-500 hover:text-gray-300"
                        )}
                        disabled={isLoadingMarket}
                    >
                        <TrendingDown className="w-4 h-4" />
                        <span>Sell</span>
                    </TabsTrigger>
                </TabsList>
            </Tabs>

            {/* Outcome Selector */}
            <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-400">Select Outcome</Label>
                <div className="grid grid-cols-2 gap-3">
                    <Button
                        variant={selectedOutcome === "Yes" ? "default" : "outline"}
                        onClick={() => setSelectedOutcome("Yes")}
                        disabled={isLoadingMarket}
                        className={cn(
                            "w-full h-12 font-semibold transition-all",
                            selectedOutcome === "Yes"
                                ? "bg-[#FF8C42] text-white hover:bg-[#FF8C42]/90 border-0"
                                : "border-[#2a2a2a] bg-[#0a0a0a] text-gray-400 hover:border-[#FF8C42]/50 hover:text-[#FF8C42] hover:bg-[#1a1a1a]"
                        )}
                    >
                        <div className="flex items-center gap-2">
                            <div className={cn(
                                "w-2 h-2 rounded-full",
                                selectedOutcome === "Yes" ? "bg-white" : "bg-[#FF8C42]"
                            )} />
                            <span>YES</span>
                            <span className="text-xs opacity-80">
                                {(Number.parseFloat(outcomePrices[0]) * 100).toFixed(0)}¢
                            </span>
                        </div>
                    </Button>

                    <Button
                        variant={selectedOutcome === "No" ? "default" : "outline"}
                        onClick={() => setSelectedOutcome("No")}
                        disabled={isLoadingMarket}
                        className={cn(
                            "w-full h-12 font-semibold transition-all",
                            selectedOutcome === "No"
                                ? "bg-[#4A9FFF] text-white hover:bg-[#4A9FFF]/90 border-0"
                                : "border-[#2a2a2a] bg-[#0a0a0a] text-gray-400 hover:border-[#4A9FFF]/50 hover:text-[#4A9FFF] hover:bg-[#1a1a1a]"
                        )}
                    >
                        <div className="flex items-center gap-2">
                            <div className={cn(
                                "w-2 h-2 rounded-full",
                                selectedOutcome === "No" ? "bg-white" : "bg-[#4A9FFF]"
                            )} />
                            <span>NO</span>
                            <span className="text-xs opacity-80">
                                {(Number.parseFloat(outcomePrices[1]) * 100).toFixed(0)}¢
                            </span>
                        </div>
                    </Button>
                </div>
            </div>

            {/* Amount Input */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-gray-400">Amount (USDC)</Label>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Wallet className="w-3.5 h-3.5" />
                        <span>{Number(udscBalance).toFixed(2)}</span>
                    </div>
                </div>
                <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                        $
                    </div>
                    <Input
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        disabled={isLoadingMarket}
                        className={cn(
                            "h-12 pl-9 pr-16 bg-[#0a0a0a] border-[#2a2a2a] text-white",
                            "placeholder:text-gray-600 text-base font-medium rounded-lg",
                            "focus:ring-1 focus:ring-[#FF8C42] focus:border-[#FF8C42]",
                            "transition-all"
                        )}
                    />
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleMaxAmount}
                        disabled={isLoadingMarket}
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 px-3 text-xs font-medium text-[#FF8C42] hover:text-[#FF8C42]/80 hover:bg-[#FF8C42]/10"
                    >
                        MAX
                    </Button>
                </div>

                {/* Quick Amount Buttons */}
                <div className="grid grid-cols-4 gap-2">
                    {quickAmounts.map((value) => (
                        <Button
                            key={value}
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuickAmount(value)}
                            disabled={isLoadingMarket}
                            className={cn(
                                "w-full h-9 text-xs font-medium rounded-lg transition-all",
                                "border-[#2a2a2a] bg-[#0a0a0a] text-gray-400",
                                "hover:border-[#FF8C42]/50 hover:text-[#FF8C42] hover:bg-[#1a1a1a]"
                            )}
                        >
                            ${value}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Trading Summary */}
            <div className="space-y-3 p-4 bg-[#0a0a0a] rounded-lg border border-[#1a1a1a]">
                <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 font-medium">Order Summary</span>
                    {isCalculating && (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FF8C42]" />
                    )}
                </div>

                <Separator className="bg-[#1a1a1a]" />

                <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Price per share</span>
                        <span className="text-white font-medium">
                            ${priceReturns?.current_price?.toFixed(4) || "0.00"}
                        </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Estimated shares</span>
                        <span className="text-white font-medium">
                            {priceReturns?.profit?.toFixed(2) || "0.00"}
                        </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Potential payout</span>
                        <span className="text-[#00D395] font-medium flex items-center gap-1">
                            <TrendingUp className="w-3.5 h-3.5" />
                            ${priceReturns?.potential_payout?.toFixed(2) || "0.00"}
                        </span>
                    </div>
                    {priceImpact > 0 && (
                        <div className="flex items-center justify-between text-sm pt-2 border-t border-[#1a1a1a]">
                            <span className="text-gray-500 flex items-center gap-1.5">
                                <AlertCircle className="w-3.5 h-3.5" />
                                Price impact
                            </span>
                            <span className="text-[#FF8C42] font-medium">
                                {priceImpact.toFixed(2)}%
                            </span>
                        </div>
                    )}
                </div>

                {priceReturns && (
                    <div className="pt-3 border-t border-[#1a1a1a]">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">Potential profit</span>
                            <span className="text-sm text-[#00D395] font-bold">
                                +{priceReturns.profit_percentage}%
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Trade Button */}
            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                {activeTab === "buy" ? (
                    selectedOutcome === "Yes" ?
                        <BuyButton tokenID={yesTokenId} amount={amount} type="Buy" outcome="Yes" />
                        :
                        <BuyButton tokenID={noTokenId} amount={amount} type="Buy" outcome="No" />
                ) : (
                    <BuyButton tokenID={noTokenId} amount={amount} type="Sell" outcome="No" />
                )}
            </motion.div>

            {/* Info Alert */}
            <Alert className="bg-[#0a0a0a] border-[#1a1a1a]">
                <Info className="h-4 w-4 text-gray-600" />
                <AlertDescription className="text-xs text-gray-500">
                    Prices update in real-time based on market liquidity
                </AlertDescription>
            </Alert>
        </div>
    )
}