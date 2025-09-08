"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Wallet, TrendingUp, TrendingDown, Settings, Info, ChevronUp, ChevronDown, AlertCircle } from "lucide-react"
import type { MarketSlug, PriceReturns } from "@/types/market"
import { cn } from "@/lib/utils"
import useClobAPIStore from "@/store/clobAPIState"
import useMarketSelectionStore from "@/store/marketSelectionStore"
import { ClobClient } from "@polymarket/clob-client"
import { useAccount, useReadContract } from "wagmi"
import { formatUnits } from "viem"
import BuyButton from "../buy"
import { OrderBook } from "./order-book"
import { MyOrdersTable } from "./my-orders-table"
import { RecentTrades } from "./recent-trades"
import React from "react"

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
  const [positionSize, setPositionSize] = useState([50])
  const [maxSlippage, setMaxSlippage] = useState([1])
  const [isExpanded, setIsExpanded] = useState(!isMobile)
  const [walletBalance] = useState(1250.75) // Mock wallet balance
  
  // Handle the case where market might be an array, single object, or null
  const currentMarket = React.useMemo(() => {
    if (!market) return null;
    if (Array.isArray(market)) {
      return market.length > 0 ? market[0] : null; // Use first market if array
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
        <Card className="bg-black border-[#1E2329] p-6 m-2">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="w-12 h-12 text-gray-500 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Market Selected</h3>
            <p className="text-sm text-gray-400">
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
  const {address} = useAccount()
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
    

  // Calculate estimated shares and returns
  const amountValue = Number.parseFloat(amount) || 0
  const estimatedShares = currentPrice > 0 ? amountValue / currentPrice : 0
  const potentialReturn = selectedOutcome === "Yes" ? estimatedShares * (1 - yesPrice) : estimatedShares * (1 - noPrice)
  const priceImpact = amountValue > 1000 ? (amountValue / 10000) * 2 : 0

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

  const handleTrade = () => {
    // Mock trade execution
    console.log("Executing trade:", {
      type: activeTab,
      outcome: selectedOutcome,
      amount: amountValue,
      shares: estimatedShares,
      slippage: maxSlippage[0],
      marketId: currentMarket.id,
    })
  }


  if (isMobile) {
    return (
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: isExpanded ? 0 : 60 }}
        className="bg-[#12161C] border-t border-[#1E2329] rounded-t-xl"
      >
        {/* Mobile Header */}
        <div
          className="flex items-center justify-between p-4 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${selectedOutcome === "Yes" ? "bg-[#00D395]" : "bg-[#FF3B69]"}`} />
            <span className="font-semibold text-white">
              {activeTab === "buy" ? "Buy" : "Sell"} {selectedOutcome}
            </span>
            <Badge variant="outline" className="text-xs">
              {(currentPrice * 100).toFixed(0)}¢
            </Badge>
          </div>
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-[#94A3B8]" />
          ) : (
            <ChevronUp className="w-5 h-5 text-[#94A3B8]" />
          )}
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 pb-4"
            >
              <TradingPanelContent
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                selectedOutcome={selectedOutcome}
                setSelectedOutcome={setSelectedOutcome}
                amount={amount}
                setAmount={setAmount}
                positionSize={positionSize}
                setPositionSize={setPositionSize}
                maxSlippage={maxSlippage}
                setMaxSlippage={setMaxSlippage}
                walletBalance={walletBalance}
                currentPrice={currentPrice}
                estimatedShares={estimatedShares}
                potentialReturn={potentialReturn}
                priceImpact={priceImpact}
                quickAmounts={quickAmounts}
                handleQuickAmount={handleQuickAmount}
                handleMaxAmount={handleMaxAmount}
                handleTrade={handleTrade}
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
    <div className="w-full lg:max-w-md">
      <Card className="bg-black border-[#1E2329] p-6 sticky top-24 mt-2 md:mt-0 mx-2">
        {/* Market info header */}
        {selectedMarket && (
          <div className="mb-4 p-3 bg-[#1E2329] rounded-lg">
            <div className="flex items-center gap-3">
              <img
                src={selectedMarket.image || "/placeholder.svg"}
                alt="Market"
                className="w-10 h-10 rounded-full"
              />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-white line-clamp-2">
                  {selectedMarket.question}
                </h3>
                <Badge variant="secondary" className="text-xs mt-1">
                  {selectedMarket.category}
                </Badge>
              </div>
            </div>
          </div>
        )}
        
        <TradingPanelContent
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          selectedOutcome={selectedOutcome}
          setSelectedOutcome={setSelectedOutcome}
          amount={amount}
          setAmount={setAmount}
          positionSize={positionSize}
          setPositionSize={setPositionSize}
          maxSlippage={maxSlippage}
          setMaxSlippage={setMaxSlippage}
          walletBalance={walletBalance}
          currentPrice={currentPrice}
          estimatedShares={estimatedShares}
          potentialReturn={potentialReturn}
          priceImpact={priceImpact}
          quickAmounts={quickAmounts}
          handleQuickAmount={handleQuickAmount}
          handleMaxAmount={handleMaxAmount}
          handleTrade={handleTrade}
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
  positionSize: number[]
  setPositionSize: (size: number[]) => void
  maxSlippage: number[]
  setMaxSlippage: (slippage: number[]) => void
  walletBalance: number
  currentPrice: number
  estimatedShares: number
  potentialReturn: number
  priceImpact: number
  quickAmounts: number[]
  handleQuickAmount: (value: number) => void
  handleMaxAmount: () => void
  handleTrade: () => void
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
  positionSize,
  setPositionSize,
  maxSlippage,
  setMaxSlippage,
  walletBalance,
  currentPrice,
  estimatedShares,
  potentialReturn,
  priceImpact,
  quickAmounts,
  handleQuickAmount,
  handleMaxAmount,
  handleTrade,
  market,
  yesTokenId,
  noTokenId,
  udscBalance,
  isLoadingMarket = false,
}: TradingPanelContentProps) {
  const outcomePrices = JSON.parse(market.outcomePrices); // now ["0.0015", "0.9985"]

  const [priceReturns, setPriceReturns] = useState<PriceReturns | null>(null);
  const { clobClient } = useClobAPIStore.getState();

  async function getPriceReturns(tokenId: string, clobClient: ClobClient, type: "BUY" | "SELL", investment_amount: number): Promise<PriceReturns | null> {
    try {

      console.log('called', tokenId);
      const priceData = await clobClient.getPrice(tokenId, type);
      const midPoint = await clobClient.getMidpoint(tokenId);

      let current_price;

      if (typeof priceData === 'object' && priceData !== null) {
        // Try different possible property names
        current_price = priceData.price || priceData.value || priceData.amount;

        // If still not found, log the object keys to see what's available
        if (current_price === undefined) {
          console.log('Available properties in price data:', Object.keys(priceData));
          // You might need to adjust this based on what you see in the logs
          current_price = Object.values(priceData)[0]; // Use first value as fallback
        }
      } else {
        current_price = priceData;
      }

      current_price = Number(current_price);

      if (isNaN(current_price) || current_price <= 0) {
        console.error(`Invalid price received: ${priceData}`);
        console.error(`Parsed price: ${current_price}`);
        return null;
      }

      // Calculate potential winnings
      const potential_payout = investment_amount / current_price;
      const profit = potential_payout - investment_amount;
      console.log(`\n=== Calculation Results ===`);
      console.log(`Investment Amount: ${investment_amount}`);
      console.log(`Share Price: ${current_price}`);
      console.log(`Potential Payout: ${potential_payout.toFixed(2)}`);
      console.log(`Profit: ${profit.toFixed(2)}`);
      console.log(`Profit Percentage: ${((profit / investment_amount) * 100).toFixed(2)}%`);

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
      console.log('hello');
      if (!clobClient) {
        console.error('CLOB client is not initialized');
        return;
      }

      if (activeTab === "buy") {
        console.log('buy');

        // if user yes
        if (selectedOutcome === "Yes") {
          console.log('yes');
          const result = await getPriceReturns(yesTokenId, clobClient, "BUY", Number(amount));
          setPriceReturns(result);
        }
        else if (selectedOutcome === "No") {
          console.log('no');
          const result = await getPriceReturns(noTokenId, clobClient, "BUY", Number(amount));
          setPriceReturns(result);
        }
      }
    };

    fetchPriceReturns();
  }, [market.id, activeTab, amount, selectedOutcome]);

  return (
    <div className="space-y-6 w-full lg:max-w-5xl">
      {/* Loading overlay */}
      {isLoadingMarket && (
        <Alert className="mb-4 bg-blue-500/10 border-blue-500/50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Loading market data...
          </AlertDescription>
        </Alert>
      )}
      
      {/* Buy/Sell Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "buy" | "sell")}>
        <TabsList className="grid w-full grid-cols-2 bg-[#1E2329] border border-[#2A2F36]">
          <TabsTrigger
            value="buy"
            className="data-[state=active]:bg-[#00D395] data-[state=active]:text-black font-semibold"
            disabled={isLoadingMarket}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Buy
          </TabsTrigger>
          <TabsTrigger
            value="sell"
            className="data-[state=active]:bg-[#FF3B69] data-[state=active]:text-white font-semibold"
            disabled={isLoadingMarket}
          >
            <TrendingDown className="w-4 h-4 mr-2" />
            Sell
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Outcome Selector */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-[#94A3B8]">Select Outcome</Label>
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant={selectedOutcome === "Yes" ? "default" : "outline"}
            onClick={() => setSelectedOutcome("Yes")}
            disabled={isLoadingMarket}
            className={cn(
              "h-12 font-semibold transition-all",
              selectedOutcome === "Yes"
                ? "bg-[#00D395] text-black hover:bg-[#00D395]/90"
                : "border-[#1E2329] text-[#94A3B8] hover:border-[#00D395]/50 hover:text-[#00D395]",
            )}
          >
            <div className="w-3 h-3 bg-[#00D395] rounded-full mr-2" />
            YES {(Number.parseFloat(outcomePrices[0]) * 100).toFixed(0)}¢
          </Button>
          <Button
            variant={selectedOutcome === "No" ? "default" : "outline"}
            onClick={() => setSelectedOutcome("No")}
            disabled={isLoadingMarket}
            className={cn(
              "h-12 font-semibold transition-all",
              selectedOutcome === "No"
                ? "bg-[#FF3B69] text-white hover:bg-[#FF3B69]/90"
                : "border-[#1E2329] text-[#94A3B8] hover:border-[#FF3B69]/50 hover:text-[#FF3B69]",
            )}
          >
            <div className="w-3 h-3 bg-[#FF3B69] rounded-full mr-2" />
            NO {(Number.parseFloat(outcomePrices[1]) * 100).toFixed(0)}¢
          </Button>
        </div>
      </div>

      {/* Amount Input */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-[#94A3B8]">Amount</Label>
          <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
            <Wallet className="w-3 h-3" />
            Balance: ${udscBalance}
          </div>
        </div>
        <div className="relative">
          <Input
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={isLoadingMarket}
            className="h-12 pl-8 pr-16 bg-[#1E2329] border-[#2A2F36] text-white placeholder:text-[#94A3B8] text-lg font-medium"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]">$</div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMaxAmount}
            disabled={isLoadingMarket}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 px-2 text-xs text-[#6366F1] hover:text-[#6366F1]/80"
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
              className="h-8 text-xs border-[#1E2329] text-[#94A3B8] hover:border-[#6366F1]/50 hover:text-[#6366F1]"
            >
              ${value}
            </Button>
          ))}
        </div>
      </div>

      {/* Trading Summary */}
      <div className="space-y-3 p-4 bg-[#1E2329] rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#94A3B8]">Price per share</span>
          <span className="text-white font-medium">${priceReturns?.current_price?.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#94A3B8]">Estimated shares</span>
          <span className="text-white font-medium">{priceReturns?.profit?.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#94A3B8]">Potential return</span>
          <span className="text-[#00D395] font-medium">+${priceReturns?.potential_payout?.toFixed(2)}</span>
        </div>
        {priceImpact > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#94A3B8]">Price impact</span>
            <span className="text-[#FF3B69] font-medium">{priceImpact.toFixed(2)}%</span>
          </div>
        )}
      </div>

      <Separator className="bg-[#1E2329]" />

      {/* Trade Button */}
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        {activeTab === "buy" ? (
          selectedOutcome === "Yes" ? 
            <BuyButton tokenID={yesTokenId} amount={amount} type="Buy" outcome="Yes" />
          :
            <BuyButton tokenID={noTokenId} amount={amount} type="Buy" outcome="No" />
        ) : (
          <BuyButton tokenID={noTokenId} amount={amount} type="Sell" outcome="No" />
        )}
      </motion.div>
    </div>
  )
}