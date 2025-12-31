/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/purity */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { TrendingUp } from "lucide-react";
import Image from "next/image";
import MultiHistoryChart from "./multi-market-chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PolymarketEvent } from "@/types";
import OrderBookTable from "./order-book-table";
import SingleMarketHistoryChart from "./single-market-chart";
import { TradingPanel } from "./trading-panel";
import { MarketSlug } from "@/types/market";
import { formatVolume, toLocalString } from "@/utils";
import { AIBotButton } from "./ai-bot-button";
import useMarketSelectionStore from "@/store/marketSelectionStore";
import { TopHolders } from "./top-holders";
import { NewsFeed } from "./news/news-feed";
import TabContentSkeleton from "@/components/ui/tabs-content-skeleton";
import { watchlistAPI } from "@/lib/watchlist-api";
import { useSession } from "@/lib/auth-client";


interface MarketOption {
    [x: string]: string;
    name: string;
    image: string;
    assetId: string;
    trending: 'up' | 'down' | 'neutral';
}

interface MarketPageProps {
    params: {
        slug: string
    },
    marketData: PolymarketEvent
}

export default function SpecificMarketMain({ params, marketData }: MarketPageProps) {
    const [openMarketId, setOpenMarketId] = useState<string | null>(null);
    const [isMoreMarketOpen, setIsMoreMarketOpen] = useState(false)
    const [selectedMarketData, setSelectedMarketData] = useState<any>(null);
    const { selectedMarket, setSelectedMarket } = useMarketSelectionStore();

    const [isChartDataReady, setIsChartDataReady] = useState(false);
    const { data: session } = useSession();

    // Watchlist state
    const [watchedMarketIds, setWatchedMarketIds] = useState<Set<string>>(new Set());
    const [isLoadingWatchlist, setIsLoadingWatchlist] = useState(true);

    // Process market data in useMemo
    const { top3Markets, top4Markets, otherMarkets, top4ClobTokenIds } = useMemo(() => {
        if (!marketData?.markets || marketData.markets.length === 0) {
            return {
                top3Markets: [] as MarketOption[],
                top4Markets: [] as MarketOption[],
                otherMarkets: [] as MarketOption[],
                top4ClobTokenIds: [] as string[]
            };
        }

        const parsed = marketData.markets.map((m) => {
            const prices = (() => {
                try {
                    return JSON.parse(m.outcomePrices || "[]") as string[];
                } catch {
                    const s = String(m.outcomePrices || "[]").replace(/[\[\]\s"']+/g, "");
                    return s.split(",").filter(Boolean);
                }
            })();

            const yesPrice = Number.parseFloat(prices[0] ?? "0");
            const noPrice = Number.parseFloat(prices[1] ?? "0");
            const name = m.groupItemTitle || m.question || "Market";

            // Parse clobTokenIds
            let clobTokenIds: any = (m as any).clobTokenIds;
            try {
                clobTokenIds = typeof clobTokenIds === "string" ? JSON.parse(clobTokenIds) : clobTokenIds;
            } catch {
                // Keep original value
            }

            const assetId = Array.isArray(clobTokenIds) && clobTokenIds[0]
                ? clobTokenIds[0]
                : (Array.isArray((m as any).clobTokenIds) ? (m as any).clobTokenIds[0] : String(clobTokenIds).split(",")[0]) ?? "";

            const chance = Math.round((yesPrice || 0) * 100);
            const trending: MarketOption['trending'] = yesPrice > noPrice ? 'up' : yesPrice < noPrice ? 'down' : 'neutral';

            return {
                market: m,
                yesPrice,
                option: {
                    name,
                    assetId,
                    chance,
                    trending,
                    ...(m as MarketSlug),
                } as unknown as MarketOption,
            };
        });

        // Sort by descending yesPrice
        const sorted = parsed.slice().sort((a, b) => b.yesPrice - a.yesPrice);

        // Get top 3 and top 4
        const top3 = sorted.slice(0, 3).map(p => p.option);
        const top4 = sorted.slice(0, 4).map(p => p.option);

        // Build top4ClobTokenIds array properly
        const top4TokenIds: string[] = [];
        top4.forEach((m: any) => {
            try {
                const raw = m?.clobTokenIds;
                const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
                if (Array.isArray(parsed) && parsed[0]) {
                    top4TokenIds.push(parsed[0]);
                }
            } catch {
                // Ignore parse errors
            }
        });

        // Build other markets by excluding top3
        const top3Ids = new Set(top3.map(t => t.assetId));
        const others = parsed
            .filter(p => !top3Ids.has(p.option.assetId))
            .map(p => p.option);

        return {
            top3Markets: top3,
            top4Markets: top4,
            otherMarkets: others,
            top4ClobTokenIds: top4TokenIds
        };
    }, [marketData]);

    // Fetch watchlists on mount
    useEffect(() => {
        const fetchWatchlists = async () => {
            console.log('session',session);
            if (!session?.user?.email) {
                setIsLoadingWatchlist(false);
                console.log('return with nothin..');
                return;
            }

            try {
                setIsLoadingWatchlist(true);
                const watchlists = await watchlistAPI.getWatchlists(session.user.email);
                console.log('watchlist',watchlists);

                // Extract marketIds from watchlists and store in Set for O(1) lookup
                                const marketIds = new Set<string>(
                                    (watchlists.watchLists || [])
                                        .map((item: any) => String(item.marketId).trim())
                                        .filter(Boolean) as string[]
                                );
                
                                setWatchedMarketIds(marketIds);
                                console.log('Watched market IDs:', marketIds);
            } catch (err) {
                console.error('Failed to fetch watchlists', err);
            } finally {
                setIsLoadingWatchlist(false);
            }
        };

        fetchWatchlists();
    }, [session?.user?.email]);

    // Helper function to check if a market is watched
    const isMarketWatched = (marketId: string): boolean => {
        return watchedMarketIds.has(marketId);
    };

    // Handler to toggle watchlist
    const handleToggleWatchlist = async (market: any) => {
        if (!session?.user?.email) {
            // Handle unauthenticated user - maybe show a login prompt
            console.log('User must be logged in to use watchlist');
            return;
        }

        const marketId = market.id || market.assetId;
        const isWatched = isMarketWatched(marketId);

        try {
            if (isWatched) {
                // Remove from watchlist
                await watchlistAPI.deleteWatchlist(marketId, session.user.email);
                setWatchedMarketIds(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(marketId);
                    return newSet;
                });
            } else {
                // Add to watchlist
                await watchlistAPI.createWatchlist({
                    email: session.user.email,
                    marketId: marketId,
                    triggerType: 'price_change', // Default trigger type
                    isEmailNotification: true,
                });
                setWatchedMarketIds(prev => new Set(prev).add(marketId));
            }
        } catch (err) {
            console.error('Failed to toggle watchlist', err);
            // Optionally show error toast/notification
        }
    };

    // Helper function to get clobTokenIds from market
    const getClobTokenIds = (market: any): [string, string] | null => {
        try {
            const clobTokenIds = typeof market.clobTokenIds === 'string'
                ? JSON.parse(market.clobTokenIds)
                : market.clobTokenIds;

            if (Array.isArray(clobTokenIds) && clobTokenIds.length >= 2) {
                return [clobTokenIds[0], clobTokenIds[1]];
            }
            return null;
        } catch {
            return null;
        }
    };
    const startTimestamp = Math.floor(Date.now() / 1000) - 120 * 24 * 60 * 60;

    function formatClobTokenId(market: MarketSlug): string {
        const clobTokenIds = getClobTokenIds(market);
        return clobTokenIds ? clobTokenIds.join(", ") : "Unknown";
    }

    useEffect(() => {
        // Always set the first top market when component mounts or top3Markets changes
        if (top3Markets.length > 0) {
            setSelectedMarket(top3Markets[0] as unknown as MarketSlug);
            setIsChartDataReady(true);
        }

        // Cleanup: clear selection when component unmounts
        return () => {
            setSelectedMarket(null);
            setIsChartDataReady(false);
        };
    }, [top3Markets, setSelectedMarket]);

    // Render market row component
    const MarketRow = ({ market, index }: { market: any; index: number }) => {
        const prices = (() => {
            try {
                return JSON.parse(market.outcomePrices || "[]") as string[];
            } catch {
                const s = String(market.outcomePrices || "[]").replace(/[\[\]\s"']+/g, "");
                return s.split(",").filter(Boolean);
            }
        })();

        const yesPrice = Number.parseFloat(prices[0] ?? "0");
        const noPrice = Number.parseFloat(prices[1] ?? "0");
        const tokenIds = getClobTokenIds(market);

        const uniqueId = market.assetId || `${market.id}-${index}`;
        const isOpen = openMarketId === uniqueId;

        const marketId = market.id ;
        const isWatched = isMarketWatched(marketId);

        return (
            <div key={index}>
                {/* Desktop view */}
                <div
                    className="hidden md:block"
                    onClick={(e) => {
                        // Prevent toggle when clicking watch button
                        if ((e.target as HTMLElement).closest('button[data-watch-button]')) {
                            return;
                        }
                        setOpenMarketId(isOpen ? null : uniqueId);
                        setSelectedMarketData(market);
                        setSelectedMarket(market as unknown as MarketSlug);
                    }}
                >
                    <div className="grid grid-cols-3 w-full mt-6 px-2 border rounded-xl py-3 cursor-pointer hover:bg-accent/5 transition-colors">
                        <div className="flex items-center my-auto">
                            <Image
                                src={market.image}
                                alt={market.question}
                                width={40}
                                height={40}
                                loading="lazy"
                                className="inline-block mr-1 rounded-xl"
                            />
                            <div className="flex flex-col ml-2">
                                <h2 className="text-sm sm:text-lg font-semibold text-muted-foreground">
                                    {market.groupItemTitle}
                                </h2>
                                <div className="flex flex-col sm:flex-col text-sm sm:space-x-2">
                                    <span className="text-xs text-accent-foreground">
                                        Volume: {market?.volume ? formatVolume(Number(market.volume)) : "No detail available"}
                                    </span>
                                    <span className="text-xs text-accent-foreground">
                                        Created: {marketData?.startDate ? toLocalString(marketData.startDate) : "—"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-center my-auto">
                            <p className="text-lg sm:text-3xl font-bold">
                                {(yesPrice * 100).toFixed(0)}%
                            </p>
                            <span className="text-sm font-medium text-green-500">
                                <TrendingUp />
                            </span>
                        </div>

                        <div className="flex items-center justify-end my-auto">
                            <Button variant="default">
                                Yes {(yesPrice * 100).toFixed(0)}%
                            </Button>
                            <Button variant="outline" className="ml-2">
                                No {(noPrice * 100).toFixed(0)}%
                            </Button>
                            <Button
                                variant={isWatched ? "default" : "ghost"}
                                className="ml-2"
                                data-watch-button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleWatchlist(market);
                                }}
                                disabled={isLoadingWatchlist}
                            >
                                {isWatched ? "Watched" : "Watch"}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Mobile view */}
                <div
                    className="md:hidden"
                    onClick={(e) => {
                        if ((e.target as HTMLElement).closest('button[data-watch-button]')) {
                            return;
                        }
                        setOpenMarketId(isOpen ? null : uniqueId);
                        setSelectedMarketData(market);
                        setSelectedMarket(market as unknown as MarketSlug);
                    }}
                >
                    <div className="flex flex-col w-full mt-6 px-2 border rounded-xl py-3">
                        <div className="flex justify-between mb-4">
                            <div className="flex items-center my-auto">
                                <Image
                                    src={market.image}
                                    alt={"Verified Market Badge"}
                                    width={40}
                                    height={40}
                                    loading="lazy"
                                    className="inline-block mr-1 rounded-xl"
                                />
                                <div>
                                    <h2 className="text-sm sm:text-lg font-semibold text-muted-foreground">
                                        {market.groupItemTitle}
                                    </h2>

                                    <div>
                                        <span className="text-xs ml-1 text-accent-foreground">
                                            Volume: {market?.volume ? formatVolume(Number(market.volume)) : "No detail available"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center my-auto">
                                <p className="text-lg sm:text-3xl font-bold">
                                    {(yesPrice * 100).toFixed(0)}%
                                </p>
                                <span className="ml-2 text-sm font-medium text-green-500">
                                    <TrendingUp />
                                </span>
                            </div>
                        </div>

                        <div className="flex w-full gap-2">
                            <Button variant="default" className="flex-1 min-w-0">
                                Yes {(yesPrice * 100).toFixed(0)}%
                            </Button>
                            <Button variant="outline" className="flex-1 min-w-0">
                                No {(noPrice * 100).toFixed(0)}%
                            </Button>
                            <Button
                                variant={isWatched ? "default" : "ghost"}
                                className="flex-1 min-w-0"
                                data-watch-button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleWatchlist(market);
                                }}
                                disabled={isLoadingWatchlist}
                            >
                                {isWatched ? "Watched" : "Watch"}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Expanded details panel */}
                {isOpen && tokenIds && (
                    <div className="w-full bg-black p-4 md:p-6 rounded-lg mt-4">
                        <Tabs defaultValue="trade-order-book" className="w-full">
                            <TabsList className="w-full justify-start gap-0 gap-x-6 md:gap-x-10 bg-black border-b rounded-none p-0 h-auto md:gap-4">
                                <TabsTrigger
                                    value="trade-order-book"
                                    className="bg-transparent text-white px-0 rounded-none data-[state=active]:text-cyan-500 data-[state=active]:border-b-2 data-[state=active]:border-cyan-500 font-semibold text-sm md:text-base transition-colors"
                                >
                                    Order Book
                                </TabsTrigger>
                                <TabsTrigger
                                    value="graph"
                                    className="bg-transparent text-white px-0 rounded-none data-[state=active]:text-cyan-500 data-[state=active]:border-b-2 data-[state=active]:border-cyan-500 font-semibold text-sm md:text-base transition-colors"
                                >
                                    Graph
                                </TabsTrigger>
                            </TabsList>

                            {/* Order Book Tab Content */}
                            <TabsContent value="trade-order-book" className="mt-6 md:mt-8">
                                <div className="space-y-4 md:space-y-6">
                                    <OrderBookTable
                                        tokenId={tokenIds[0]}
                                        lastPrice={yesPrice.toFixed(2)}
                                    />
                                </div>
                            </TabsContent>

                            {/* Graph Tab Content */}
                            <TabsContent value="graph" className="mt-6 md:mt-8">
                                <div className="w-full flex items-center justify-center bg-gradient-to-br from-zinc-900 to-black rounded-lg border border-zinc-700">
                                    <SingleMarketHistoryChart
                                        clobIds={[tokenIds[0], tokenIds[1]]}
                                        marketNames={["Yes", "No"]}
                                    />
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                )}
            </div>
        );
    };

    if (!marketData) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-lg">Loading market data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="mt-10">
            {/* Chart and buy/sell trade card */}
            <div className=" grid grid-cols-1 md:grid-cols-3 gap-4 w-full sm:w-full sm:mx-auto sm:max-w-7xl">
                <div className="bg-gradient-to-br from-zinc-900 to-black border-zinc-800 md:col-span-2 border rounded-xl p-2 shadow-2xl">
                    <div className="w-full flex flex-col md:flex-row justify-between mb-4 px-2 gap-y-3">
                        <div className="w-full flex gap-x-2">
                            <div>
                                <Image
                                    src={marketData.image || "markium.jpg"}
                                    alt={"Presidential Election Market"}
                                    width={60}
                                    height={60}
                                    loading="lazy"
                                    className="hidden md:inline-block rounded-xl"
                                />
                            </div>
                            <div className="my-auto">
                                <h1 className="text-2xl sm:text-2xl sm:truncate font-bold my-auto">
                                    {marketData?.title || marketData?.ticker || 'Market Name'}
                                </h1>
                                <p className="flex flex-col sm:flex-row text-sm sm:space-x-2">
                                    <span className="text-sm text-muted-foreground">
                                        Created  {marketData?.startDate ? toLocalString(marketData.startDate) : "—"}
                                    </span>
                                    <span>
                                        Volume: {marketData?.volume ? formatVolume(Number(marketData.volume)) : "No detail available"}
                                    </span>
                                </p>
                            </div>
                        </div>

                        <div className="ml-auto sm:my-auto">
                            <AIBotButton market={selectedMarket?.question || marketData.ticker} />
                        </div>
                    </div>

                    {/* Chart Component */}
                    <div>
                        {isChartDataReady && top4ClobTokenIds.length > 0 ? (
                            <MultiHistoryChart
                                clobIds={top4ClobTokenIds}
                                marketNames={top4Markets.map((m: any) => m?.groupItemTitle || m?.name || "Market")}
                                startTs={startTimestamp}
                            />
                        ) : (
                            <div className="text-center text-zinc-400 py-6">Loading chart...</div>
                        )}
                    </div>

                    <div className="w-full">
                        <div className="flex justify-between mt-8 px-2 mx-auto text-muted-foreground/75 font-medium">
                            <p>Group Title</p>
                            <p>Chance</p>
                            <p>Trade</p>
                        </div>

                        {/* Top 3 Markets */}
                        {top3Markets.map((market: any, index) => (
                            <MarketRow key={`top3-${index}`} market={market} index={index} />
                        ))}

                        {/* More Markets toggle */}
                        {!isMoreMarketOpen && otherMarkets.length > 0 && (
                            <div
                                className="py-4 font-medium ml-1 cursor-pointer hover:text-primary transition-colors"
                                onClick={() => setIsMoreMarketOpen(!isMoreMarketOpen)}
                            >
                                More Markets ({otherMarkets.length})
                            </div>
                        )}

                        {/* Other Markets */}
                        {isMoreMarketOpen && otherMarkets.map((market: any, index) => (
                            <MarketRow key={`other-${index}`} market={market} index={index + top3Markets.length} />
                        ))}

                        {/* Show Less toggle */}
                        {isMoreMarketOpen && (
                            <div
                                className="py-4 font-medium ml-1 cursor-pointer hover:text-primary transition-colors"
                                onClick={() => setIsMoreMarketOpen(!isMoreMarketOpen)}
                            >
                                Show Less ^
                            </div>
                        )}
                    </div>

                    <div>
                        <div className="flex items-center justify-between mt-10 mb-4 px-2">
                            <h3 className="font-bold text-2xl sm:text-3xl mt-10 mb-4 text-white">
                                Rules and Information
                            </h3>

                            <div className="my-auto">
                                <AIBotButton isAnimated={false} market={selectedMarket?.question || marketData.ticker} />
                            </div>
                        </div>

                        <div>
                            <div className="mt-4 border p-2 bg-neutral-900 rounded-lg">
                                <p className="text-muted-foreground text-sm sm:text-base">
                                    {selectedMarket?.description || "No additional information available for this market."}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-2 mt-10">
                        {
                            selectedMarket && selectedMarket ? (
                                <NewsFeed
                                    key={`news-${selectedMarket.id}`}
                                    slug={selectedMarket.question || marketData.title || ""}
                                />
                            ) : (
                                <TabContentSkeleton />
                            )}
                    </div>
                </div>

                <div className="md:col-auto shadow-2xl mx-auto w-full md:w-auto flex flex-col gap-6">
                    {/* Buy/sell trade card */}
                    <TradingPanel market={marketData.markets[0]} />
                    {
                        selectedMarket && (
                            <TopHolders
                                yesHolderId={formatClobTokenId(selectedMarket)[0]}
                                noHolderId={formatClobTokenId(selectedMarket)[1]}
                                marketId={selectedMarket.conditionId}
                            />
                        )
                    }
                </div>
            </div>
        </div>
    );
}