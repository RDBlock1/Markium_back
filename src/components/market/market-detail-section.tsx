'use client';

import { MarketSlug } from "@/types/market";
import { formatVolume, toLocalString } from "@/utils";
import Image from "next/image";
import { TradingChart } from "./trading-chart";
import { TradingPanel } from "./trading-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { YesNoHolders } from "./top-holders";
import { MarketInfo } from "./market-info";
import { CommentsSection } from "./commments-section";
import { TokenHolders } from "@/types/holder";
import { useEffect, useState, useMemo } from "react";
import { getTopHolders } from "@/app/actions/market";
import { NewsFeed } from "./news/news-feed";
import { PolymarketEvent } from "@/types";
import { SubMarketTable } from "./sub-markets";
import ClobMultiHistoryChart from "./multimarket-charts";
import useMarketSelectionStore from "@/store/marketSelectionStore";
import { Skeleton } from "@/components/ui/skeleton";

interface MarketPageProps {
  params: {
    slug: string
  },
  marketData: PolymarketEvent 
}

export default function MarketDetailSection({ params, marketData }: MarketPageProps){
  const [topHolders, setTopHolders] = useState<TokenHolders[]>([])
  const [market, setMarket] = useState<PolymarketEvent | null>(marketData)
  const [isHoldersLoading, setIsHoldersLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("info")
  const { selectedMarket, isLoadingMarket } = useMarketSelectionStore()

  // Use selectedMarket if available, otherwise use first market from marketData
  const activeMarket = useMemo(() => {
    return selectedMarket || market?.markets?.[0] || null;
  }, [selectedMarket, market?.markets]);

  // Check if we have the minimum required data
  const hasMarketData = marketData && marketData.markets && marketData.markets.length > 0;
  const hasActiveMarket = activeMarket !== null;
  
  // Dynamically extract highest volume markets' clobTokenIds and names
  const { topMarketClobIds, topMarketNames } = useMemo(() => {
    if (!marketData?.markets || marketData.markets.length === 0) {
      return { topMarketClobIds: [], topMarketNames: [] };
    }

    // Sort markets by volume (highest first)
    const sortedMarkets = [...marketData.markets]
      .filter(market => {
        // Ensure market has volume and clobTokenIds
        const volume = parseFloat(String(market.volume || "0"));
        const hasClobTokens = market.clobTokenIds && market.clobTokenIds !== "[]";
        return volume > 0 && hasClobTokens;
      })
      .sort((a, b) => {
        const volumeA = parseFloat(String(a.volume || "0"));
        const volumeB = parseFloat(String(b.volume || "0"));
        return volumeB - volumeA; // Sort descending
      })
      .slice(0, 4); // Take top 4 markets

    // Extract clobTokenIds (first token from each market's array)
    const clobIds = sortedMarkets.map(market => {
      try {
        const tokenIds = JSON.parse(market.clobTokenIds);
        return tokenIds[0]; // Get first token ID
      } catch {
        return null;
      }
    }).filter(Boolean) as string[];

    // Extract market questions/names
    const names = sortedMarkets.map(market => {
      // Shorten the question for display
      const question = market.question || market.groupItemTitle || "Unknown Market";
      // Remove common prefixes and make it shorter
      return question
        .replace(/^Fed (decreases|increases|no change in) interest rates by /, "")
        .replace(/ after September 2025 meeting\?$/, "")
        .replace(/^No change in Fed interest rates/, "No change")
        .replace(/\?$/, "");
    });

    return {
      topMarketClobIds: clobIds,
      topMarketNames: names
    };
  }, [marketData]);

  // Fetch top holders only when activeMarket changes and is valid
  const fetchTopHolders = async () => {
    if (!activeMarket?.id) {
      console.log('No active market ID, skipping holders fetch');
      return;
    }
    
    setIsHoldersLoading(true);
    try {
      console.log('Fetching holders for market:', activeMarket.id);
      const holders = await getTopHolders(activeMarket.conditionId);
      console.log('Fetched top holders:', holders);
      setTopHolders(holders);
    } catch (error) {
      console.error('Error fetching top holders:', error);
      setTopHolders([]);
    } finally {
      setIsHoldersLoading(false);
    }
  }
  
  // Re-fetch holders when activeMarket changes
  useEffect(() => {
    if (activeMarket?.id) {
      fetchTopHolders();
    } else {
      setTopHolders([]);
    }
  }, [activeMarket?.id])

  // Calculate start timestamp for chart (120 days ago)
  const startTimestamp = Math.floor(Date.now() / 1000) - 120 * 24 * 60 * 60;

  // Log the extracted data for debugging
  useEffect(() => {
    console.log('Top Market ClobIds:', topMarketClobIds);
    console.log('Top Market Names:', topMarketNames);
    console.log('Active Market:', activeMarket);
    console.log('Has Market Data:', hasMarketData);
  }, [topMarketClobIds, topMarketNames, activeMarket, hasMarketData]);

  // Loading skeleton for tabs content
  const TabContentSkeleton = () => (
    <div className="space-y-4">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-32 w-full" />
    </div>
  );

  return (
    <div>
      <div className="w-full md:max-w-[90%] mx-auto">
        <div className="w-full flex flex-col md:flex-row lg:justify-between space-x-4 p-4 border mt-4 rounded-md">
          <div className="flex gap-2 md:w-full">
            <Image
              src={marketData?.image || '/og-market-default.jpg'}
              alt={marketData?.id || 'Market Image'}
              width={70}
              height={70}
              className="rounded-md border"
            />
            
            <div className="w-full">
              <h1 className="font-semibold w-[160px] lg:w-full">
                {marketData?.title || marketData?.ticker || 'Market Name'}
              </h1>
              <div className="text-sm text-muted-foreground">
                {marketData?.startDate ? toLocalString(marketData.startDate) : "—"}
              </div>
            </div>
          </div>

          <div className="md:w-full lg:flex justify-end">
            <ul className="flex flex-wrap mt-10 md:mt-0 gap-x-5">
              <li className="flex flex-col">
                <span className="text-gray-400">Liquidity</span>
                <span>
                  {marketData?.liquidity ? formatVolume(Number(marketData.liquidity)) : "—"}
                </span>
              </li>
              <li className="flex flex-col">
                <span className="text-gray-400">Volume24hr</span>
                <span>
                  {marketData?.volume24hr ? formatVolume(Number(marketData.volume24hr)) : "No detail available"}
                </span>
              </li>
              <li className="flex flex-col">
                <span className="text-gray-400">Volume1wk</span>
                <span>
                  {marketData?.volume1wk ? formatVolume(Number(marketData.volume1wk)) : "No detail available"}
                </span>
              </li>
              <li className="flex flex-col">
                <span className="text-gray-400">Volume1mo</span>
                <span>
                  {marketData?.volume1mo ? formatVolume(Number(marketData.volume1mo)) : "No detail available"}
                </span>
              </li>
              <li className="flex flex-col">
                <span className="text-gray-400">End Date</span>
                <span>
                  {marketData?.endDate ? toLocalString(marketData.endDate) : "No detail available"}
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Dynamic Chart with highest volume markets */}
        {topMarketClobIds.length > 0 && (
          <div className="w-full flex flex-wrap md:flex-nowrap justify-start mt-4">
            <ClobMultiHistoryChart
              clobIds={topMarketClobIds}
              marketNames={topMarketNames}
              startTs={startTimestamp} 
            />
            <TradingPanel market={marketData?.markets?.[0]} />
          </div>
        )}

        <div className="w-full flex justify-start border mt-5">
          <SubMarketTable markets={marketData?.markets || []} />
        </div>

        {/* Market Info Tabs - Only render content when data is available */}
        <Tabs 
          defaultValue="info" 
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full mx-4 mt-4"
        >
          <TabsList className="grid w-full grid-cols-4 bg-black border border-[#1E2329]">
            <TabsTrigger value="info">Breaking News</TabsTrigger>
            <TabsTrigger value="holders">Market Info</TabsTrigger>
            <TabsTrigger value="comments">Top Holders</TabsTrigger>
            <TabsTrigger value="activity">Comments</TabsTrigger>
          </TabsList>
          
          <TabsContent value="info" className="mt-6">
            {hasActiveMarket && hasMarketData ? (
              <NewsFeed 
                key={`news-${activeMarket.id}`} // Force re-render with key
                slug={activeMarket.question || marketData.title || ""} 
              />
            ) : (
              <TabContentSkeleton />
            )}
          </TabsContent>
          
          <TabsContent value="holders" className="mt-6">
            {hasActiveMarket ? (
              <MarketInfo 
                key={`info-${activeMarket.id}`} // Force re-render with key
                market={activeMarket} 
              />
            ) : (
              <TabContentSkeleton />
            )}
          </TabsContent>
          
          <TabsContent value="comments" className="mt-6">
            {hasActiveMarket ? (
              isHoldersLoading ? (
                <TabContentSkeleton />
              ) : (
                <YesNoHolders 
                  key={`holders-${activeMarket.id}`} // Force re-render with key
                  data={topHolders} 
                />
              )
            ) : (
              <TabContentSkeleton />
            )}
          </TabsContent>
          
          <TabsContent value="activity" className="mt-6">
            {hasActiveMarket ? (
              <CommentsSection 
                key={`comments-${activeMarket.id}`} // Force re-render with key
              />
            ) : (
              <TabContentSkeleton />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}