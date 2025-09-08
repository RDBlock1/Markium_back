import { create } from 'zustand';
import { MarketSlug } from '@/types/market';

interface MarketSelectionState {
  // Current selected market for trading
  selectedMarket: MarketSlug | null;
  
  // Previous market (for comparison/history)
  previousMarket: MarketSlug | null;
  
  // Loading state for market switch
  isLoadingMarket: boolean;
  
  // Error state
  marketError: string | null;
  
  // Actions
  selectMarket: (market: MarketSlug) => void;
  clearSelectedMarket: () => void;
  setLoadingMarket: (loading: boolean) => void;
  setMarketError: (error: string | null) => void;
}

const useMarketSelectionStore = create<MarketSelectionState>((set) => ({
  // Initial state
  selectedMarket: null,
  previousMarket: null,
  isLoadingMarket: false,
  marketError: null,
  
  // Actions
  selectMarket: (market) => 
    set((state) => ({
      selectedMarket: market,
      previousMarket: state.selectedMarket,
      marketError: null,
    })),
  
  clearSelectedMarket: () => 
    set((state) => ({
      selectedMarket: null,
      previousMarket: state.selectedMarket,
      marketError: null,
    })),
  
  setLoadingMarket: (loading) => 
    set({ isLoadingMarket: loading }),
  
  setMarketError: (error) => 
    set({ marketError: error }),
}));

export default useMarketSelectionStore;