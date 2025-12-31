'use client'
import WatchListCards from "@/components/watchlist/watchlist-cards";
import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/dist/client/link";
import LoginButton from "@/components/login-button";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";



interface PolymarketMarket {
    id: string;
    question: string;
    description?: string;
    outcomes: string[];
    outcomePrices: string[];
    volume: string;
    liquidity: string;
    endDate: string;
    startDate: string;
    image?: string;
    slug: string;
    tags: string[];
    volume24hr: string;
    active: boolean;
    closed: boolean;
    archived: boolean;
    resolvedOutcome?: string;
    createdAt: string;
    updatedAt: string;
}

interface WatchlistWithMarketData {
    id: string;
    userId: string;
    marketId: string;
    triggerType: string;
    triggerValue: number | null;
    frequency: string;
    isActive: boolean;
    isEmailNotification: boolean;
    isTelegramNotification: boolean;
    lastNotifiedAt: string | null;
    createdAt: string;
    updatedAt: string;
    marketData?: PolymarketMarket | null;
}



export default function WatchListPage() {
    const { address, isConnected } = useAccount()
    const [watchlist, setWatchlist] = useState<WatchlistWithMarketData[]>([]);
    const [isLoadingWatchlist, setIsLoadingWatchlist] = useState(false);
    const router = useRouter();
    const { data: session } = useSession()

    useEffect(() => {
        const fetchWatchlist = async () => {
            if (!session?.user || !session.user.email) {
                setWatchlist([]);
                return;
            }

            setIsLoadingWatchlist(true);
            try {
                const response = await fetch(`/api/watchlist?email=${session.user.email}&includeMarketData=true`);
                if (response.ok) {
                    const data = await response.json();
                    console.log('Fetched watchlist:', data);
                    // Ensure data is an array
                    setWatchlist(Array.isArray(data.watchLists) ? data.watchLists : []);
                } else {
                    console.error('Failed to fetch watchlist:', response.statusText);
                    setWatchlist([]);
                }
            } catch (error) {
                console.error('Error fetching watchlist:', error);
                setWatchlist([]);
            } finally {
                setIsLoadingWatchlist(false);
            }
        };

        fetchWatchlist();
    }, [session?.user?.email]);

    const onDelete = (watchlistId: string) => {
        setWatchlist(prevWatchlist =>
            prevWatchlist.filter(item => item.id !== watchlistId)
        );
    }

    return (
        <div className="min-h-screen mx-10 p-2">
            <h1 className="text-4xl mb-4 text-center mt-10 font-bold">Watchlist</h1>
            {session?.user?.email ? (
                isLoadingWatchlist ? (
                    <p>Loading...</p>
                ) : (
                    <div className=" w-full">
                        {watchlist.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3  gap-4 w-full">
                                {watchlist.map(item => (
                                    <WatchListCards
                                        key={item.id}
                                        watchlist_id={item.id}
                                        market_id={item.marketId}
                                        question={item.marketData?.question || ''}
                                        exp_data={item.marketData?.endDate || ''}
                                        liquidity={item.marketData?.liquidity || ''}
                                        volume24h={item.marketData?.volume24hr || ''}
                                        prices={item.marketData?.outcomePrices || []}
                                        email={session?.user?.email || ""}
                                        onDelete={() => onDelete(item.id)}
                                    />
                                ))}
                            </div>
                        ) : (

                                       <div className="flex flex-col items-center justify-center gap-y-4 mt-20">
                                        <p className="text-center w-full">No items found in your watchlist.</p>
                                        <Link href="/#markets" className="text-blue-500 hover:underline">
                                            <Button variant="link">

                                                Add some markets to your watchlist from the marketplace.

                                        </Button>
                                        </Link>

                                       </div>
                        )}
                    </div>
                )
            ) : (
                <div className="w-full flex flex-col items-center justify-center gap-y-10">
                    <p className="text-xl">Please log in to view your watchlist.</p>
                    <LoginButton callbackUrlArgs={'/watchlist'} />
                </div>
            )}
        </div>
    )
}