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
import { useEffect, useState } from "react";
import { getTopHolders } from "@/app/actions/market";

interface MarketPageProps {
  params: {
    slug: string
  },
  marketData: MarketSlug | null

}

export default function MarketDetailSection({ params, marketData }: MarketPageProps){
  const cloudIds = JSON.parse(marketData?.clobTokenIds || "[]") as string[];
  const [topHolders, setTopHolders] = useState<TokenHolders[]>([])
  const [market, setMarket] = useState<MarketSlug | null>(marketData)
   const fetchTopHolders = async () =>{
      try {
        if(!market?.conditionId) return;
        const holders = await getTopHolders(market?.conditionId);
        setTopHolders(holders);
      } catch (error) {
        console.error('Error fetching top holders:', error);
      }
    }
  
  
    useEffect(()=>{
      fetchTopHolders();
    }, [market?.conditionId])

    return (
        <div>


            <div className=" w-full">
                <div className="flex flex-col md:flex-row space-x-4 p-4 border mt-4 mx-4">
                   <div className="flex  gap-2">
                     <Image
                        src={marketData?.image || '/og-market-default.jpg'}
                        alt={marketData?.id || 'Market Image'}
                        width={70}
                        height={70}
                        className="rounded-md border"
                    />
                   
                    <div className="w-full">
                        <h1 className="font-semibold  w-[160px] lg:w-full">{marketData?.question || 'Market Name'}</h1>
                          <div className="text-sm text-muted-foreground">
                           {marketData?.startDate ? toLocalString(marketData.startDate) : "—"}
                         </div>
                    </div>
                   </div>

                    <div className= " md:w-full  ">
                        <ul className="flex flex-wrap mt-10 md:mt-0 gap-x-5">
                            <li className="flex flex-col">
                                <span className="text-gray-400">
                                    Liquidity
                                </span>
                                <span>
                                    {marketData?.liquidity ? formatVolume(Number(marketData.liquidity)) : "—"}
                                </span>
                            </li>
                            <li className="flex flex-col">
                                <span className="text-gray-400">
                                    Volume24hr
                                </span>
                                <span>
                                    {marketData?.volume24hr ? formatVolume(Number(marketData.volume24hr)) : "No detail available"}
                                </span>
                            </li>
                       <li className="flex flex-col">
                                <span className="text-gray-400">
                                    Volume1wk
                                </span>
                                <span>
                                    {marketData?.volume1wk ? formatVolume(Number(marketData.volume1wk)) : "No detail available"}
                                </span>
                            </li>
                    <li className="flex flex-col">
                                <span className="text-gray-400">
                                    Volume1mo
                                </span>
                                <span>
                                    {marketData?.volume1mo ? formatVolume(Number(marketData.volume1mo)) : "No detail available"}
                                </span>
                            </li>
                            <li className="flex flex-col">
                                <span className="text-gray-400">
                                    End Date
                                </span>
                                <span>
                                    {marketData?.endDate ? toLocalString(marketData.endDate) : "No detail available"}
                                </span>
                            </li>

                        </ul>
                    </div>
                </div>


                <div className=" w-full flex flex-col lg:flex-row  mt-4">
                    <TradingChart marketId={marketData?.id || ""} conditionId={marketData?.conditionId || ""} yesId={cloudIds[0]} noId={cloudIds[1]} />
                    {marketData && <TradingPanel market={marketData} />}
                </div>

                       {/* Market Info Tabs */}
            <Tabs defaultValue="info" className="w-full mx-4 mt-4">
              <TabsList className="grid w-full grid-cols-4 bg-black border border-[#1E2329]">
                <TabsTrigger value="info">Market Info</TabsTrigger>
                <TabsTrigger value="holders">Top Holders</TabsTrigger>
                <TabsTrigger value="comments">Comments</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>
              <TabsContent value="info" className="mt-6">
                <MarketInfo market={market!} />
              </TabsContent>
              <TabsContent value="holders" className="mt-6">
                <YesNoHolders data={topHolders} />
              </TabsContent>
              <TabsContent value="comments" className="mt-6">
                <CommentsSection />
              </TabsContent>
              <TabsContent value="activity" className="mt-6">
                <div className="text-center py-12 text-[#94A3B8]">Activity feed coming soon...</div>
              </TabsContent>
            </Tabs>
            </div>
        </div>
    )
}