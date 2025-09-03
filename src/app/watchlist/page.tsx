'use client'
import WatchListCards from "@/components/watchlist/watchlist-cards";
import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";



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



export default function WatchListPage(){
    const {address,isConnected} = useAccount()
    const [watchlist, setWatchlist] = useState<WatchlistWithMarketData[]>([]);
    const [isLoadingWatchlist, setIsLoadingWatchlist] = useState(false);
    const router = useRouter();
    const {data:session} = useSession()

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
      <h1 className="text-4xl mb-4">Watchlist</h1>
      {
        isLoadingWatchlist ? (
                    <p>Loading...</p>
                ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3  gap-4">
                 {
                       watchlist.length > 0 ? (
                        watchlist.map(item => (
                            <WatchListCards
                                key={item.id}
                                watchlist_id={item.id}
                                market_id={item.marketId}
                                question={item.marketData?.question || ''}
                                exp_data={item.marketData?.endDate || ''}
                                liquidity={item.marketData?.liquidity || ''}
                                volume24h={item.marketData?.volume24hr || ''}
                                email={session?.user?.email || ""}
                                onDelete={() => onDelete(item.id)}
                            />
                        ))
                    ) : (
                        <p>No items found in your watchlist.</p>
                    )
                }
                 </div>
                )
            }
        </div>
    )
}