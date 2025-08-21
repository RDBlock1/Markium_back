import {Footer} from "@/components/footer"
import MarketsSection from "@/components/market/market-section"
import { Navbar } from "@/components/navbar"
import { div } from "framer-motion/client";
import { Suspense } from "react";
import Loading from "./loading";
import { baseUrl } from "@/utils";

// Main page layout
export default async function Page() {

  const response = await fetch(`${baseUrl}/api/market`, {
    // cache: 'no-store', // optional: disable caching for dynamic data
    //i have to enable caching for dynamic data
    cache: 'force-cache',
  });
  const data = await response.json();

  

  return (

      <main className="flex-1 overflow-y-auto ">
        <Suspense fallback={<Loading />}>
          <MarketsSection initialData={data.data} />
        </Suspense>
      </main>

  );
}