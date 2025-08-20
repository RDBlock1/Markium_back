import { Suspense } from "react";
import Loading from "@/app/loading";
import MarketSlugMainSection from "@/components/market/market-slug-main-section";
import { baseUrl } from "@/utils";
import MarketSmall from "@/components/market/market-small";

export default async function MarketPage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const res = await fetch(`${baseUrl}/api/slug-market`, {
    method: 'POST',
    body: JSON.stringify({ slug }),
    headers: { 'Content-Type': 'application/json' }
  });
  const marketData = await res.json();
  console.log('Response:', marketData.data[0]);

  

  return (
  <div className="overflow-y-auto">
      <Suspense fallback={<Loading />}>
         <MarketSlugMainSection params={{ slug }} marketData={marketData.data[0]} />
    </Suspense>
  </div>
  );
}


