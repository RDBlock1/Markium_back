'use client'
import { useFilterStore } from "@/store/filterStore";
import { MentionsMarketGrid } from "./mentions-market-grid";
import { MarketGrid } from "./market-grid";

// Client component that switches between grids
export function MarketPageContent({ tagSlug }: { tagSlug?: string }) {
    const { activeCategory } = useFilterStore();

    // Show MentionsMarketGrid when category is 'mentions'
    if (activeCategory === 'mentions') {
        return <MentionsMarketGrid />;
    }

    // Show regular MarketGrid for all other categories
    return <MarketGrid tagSlug={tagSlug} />;
}