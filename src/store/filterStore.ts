// src/store/filterStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// ⭐ Types
export type SortOption = 
  | 'volume24hr' 
  | 'totalVolume' 
  | 'newest' 
  | 'liquidity' 
  | 'endingSoon' 
  | 'competitive';

export interface FilterOptions {
  hideCrypto: boolean;
  hideSports: boolean;
  hideMentions: boolean;
  hideTrump: boolean;
  hidePolitics: boolean;
  hideElections: boolean;
}

export interface FilterState {
  // State
  activeCategory: string;
  activeTag: string;
  sortBy: SortOption;
  filters: FilterOptions;
  
  // Actions
  setActiveCategory: (category: string) => void;
  setActiveTag: (tag: string) => void;
  setSortBy: (sort: SortOption) => void;
  setFilters: (filters: FilterOptions) => void;
  toggleFilter: (key: keyof FilterOptions) => void;
  resetFilters: () => void;
  resetAll: () => void;
}

const defaultFilters: FilterOptions = {
  hideCrypto: false,
  hideSports: false,
  hideMentions: false,
  hideTrump: false,
  hidePolitics: false,
  hideElections: false,
};

const initialState = {
  activeCategory: 'trending',
  activeTag: 'all',
  sortBy: 'newest' as SortOption,
  filters: defaultFilters,
};

// ⭐ Create Zustand Store with DevTools and Persist
export const useFilterStore = create<FilterState>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        // Set active category
        setActiveCategory: (category: string) => 
          set({ activeCategory: category }, false, 'setActiveCategory'),

        // Set active tag
        setActiveTag: (tag: string) => 
          set({ activeTag: tag }, false, 'setActiveTag'),

        // Set sort option
        setSortBy: (sort: SortOption) => 
          set({ sortBy: sort }, false, 'setSortBy'),

        // Set all filters
        setFilters: (filters: FilterOptions) => 
          set({ filters }, false, 'setFilters'),

        // Toggle individual filter
        toggleFilter: (key: keyof FilterOptions) =>
          set(
            (state) => ({
              filters: {
                ...state.filters,
                [key]: !state.filters[key],
              },
            }),
            false,
            'toggleFilter'
          ),

        // Reset only filters and sort
        resetFilters: () =>
          set(
            {
              filters: defaultFilters,
              sortBy: 'newest',
            },
            false,
            'resetFilters'
          ),

        // Reset everything
        resetAll: () => 
          set(initialState, false, 'resetAll'),
      }),
      {
        name: 'filter-storage', // LocalStorage key
        partialize: (state) => ({
          // Only persist these fields
          activeCategory: state.activeCategory,
          sortBy: state.sortBy,
        }),
      }
    ),
    {
      name: 'FilterStore', // DevTools name
    }
  )
);

// ⭐ Selectors (for optimized re-renders)
export const useActiveCategory = () => 
  useFilterStore((state) => state.activeCategory);

export const useActiveTag = () => 
  useFilterStore((state) => state.activeTag);

export const useSortBy = () => 
  useFilterStore((state) => state.sortBy);

export const useFilters = () => 
  useFilterStore((state) => state.filters);

export const useActiveFilterCount = () =>
  useFilterStore((state) => 
    Object.values(state.filters).filter(Boolean).length
  );