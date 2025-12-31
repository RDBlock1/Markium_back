/* eslint-disable @typescript-eslint/no-explicit-any */
// components/markets/SearchAndFilters.tsx
"use client"

import { Search, Filter, ChevronDown, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState, useRef, useEffect } from "react"
import { useEventSearch, useSearchSuggestions } from "@/hooks/polymarket/useEventSearch"
import { useRouter } from "next/navigation"
import { useFilterStore, useActiveFilterCount } from "@/store/filterStore"
import { motion, AnimatePresence } from "framer-motion"
import { categories, tags, sortOptions } from "@/utils/categories"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"

export function SearchAndFilters() {
    const [searchQuery, setSearchQuery] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // ⭐ Zustand store
    const {
        activeCategory,
        setActiveCategory,
        activeTag,
        setActiveTag,
        sortBy,
        setSortBy,
        filters,
        toggleFilter,
        resetFilters,
    } = useFilterStore();

    const activeFilterCount = useActiveFilterCount();

    const { data: searchResults, isLoading } = useEventSearch(searchQuery);
    const { data: suggestions } = useSearchSuggestions(searchQuery);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        setShowSuggestions(true);
    };

    const handleSelectSuggestion = (slug: string) => {
        router.push(`/market/${slug}`);
        setShowSuggestions(false);
        setSearchQuery("");
    };

    return (
        <div className="space-y-4 mb-6">
            {/* ⭐ Categories with Icons */}
            <div className="flex gap-x-2 overflow-x-auto scrollbar-hide pb-2">
                {categories.map((category) => {
                    const Icon = category.icon;
                    const isActive = activeCategory === category.id;

                    return (
                        <motion.button
                            key={category.id}
                            onClick={() => setActiveCategory(category.id)}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${isActive
                                ? 'bg-accent shadow-lg shadow-primary/20'
                                : 'text-gray-400 hover:text-white hover:bg-gray-800 border border-transparent hover:border-gray-700'
                                }`}
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 400, damping: 17 }}
                        >
                            <Icon className={`w-4 h-4 ${isActive ? 'animate-pulse' : ''}`} />
                            {category.name}
                        </motion.button>
                    );
                })}
            </div>

            {/* Search + Tags + Filters */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
                {/* ⭐ Search - Full width on mobile */}
                <div ref={searchRef} className="relative w-full lg:w-96 flex-shrink-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 z-10" />
                    <Input
                        placeholder="Search events..."
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        onFocus={() => setShowSuggestions(true)}
                        className="pl-10 bg-[#161b22] border-gray-700 text-white placeholder:text-gray-500 rounded-lg w-full h-10"
                    />

                    {/* Suggestions Dropdown */}
                    <AnimatePresence>
                        {showSuggestions && searchQuery.length >= 2 && suggestions && suggestions.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="absolute top-full mt-2 w-full bg-neutral-950 border border-neutral-700 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto"
                            >
                                {!isLoading && suggestions.map((suggestion: any, idx: number) => (
                                    <motion.button
                                        key={suggestion.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        onClick={() => handleSelectSuggestion(suggestion.slug)}
                                        className="w-full px-4 py-3 text-left hover:bg-stone-900 border-b border-neutral-800 last:border-b-0"
                                    >
                                        <div className="flex gap-x-3">
                                            <img
                                                src={suggestion.image}
                                                alt={suggestion.title}
                                                className="w-14 h-10 rounded-md object-cover"
                                            />
                                            <div className="flex flex-col">
                                                <div className="font-medium text-white text-sm">
                                                    {suggestion.title}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {suggestion.ticker}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.button>
                                ))}

                                {searchResults && searchResults.pagination.total > suggestions.length && (
                                    <button
                                        onClick={() => router.push(`/search?q=${encodeURIComponent(searchQuery)}`)}
                                        className="w-full px-4 py-3 text-center text-sm text-primary hover:bg-[#161b22] border-t border-gray-700"
                                    >
                                        View all {searchResults.pagination.total} results →
                                    </button>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* No Results */}
                    {showSuggestions && searchQuery.length >= 2 && !isLoading && suggestions && suggestions.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute top-full mt-2 w-full bg-[#0d1117] border border-gray-700 rounded-lg shadow-xl z-50 p-4 text-center text-gray-500 text-sm"
                        >
                            No results found for &quot;{searchQuery}&quot;
                        </motion.div>
                    )}
                </div>

                {/* ⭐ Tags - Scrollable on mobile */}
                <div className="flex gap-x-2 overflow-x-auto scrollbar-hide flex-1 lg:flex-initial">
                    {tags.slice(0, 8).map((tag) => {
                        const isActive = activeTag === tag.id;

                        return (
                            <motion.button
                                key={tag.id}
                                onClick={() => setActiveTag(tag.id)}
                                className={`px-3 py-1.5 text-sm rounded-lg whitespace-nowrap transition-colors flex-shrink-0 ${isActive
                                    ? 'bg-gray-700 text-white'
                                    : 'text-gray-500 hover:text-white hover:bg-gray-800'
                                    }`}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                {tag.name}
                            </motion.button>
                        );
                    })}
                </div>

                {/* ⭐ Controls - Stack on mobile */}
                <div className="flex gap-2 flex-shrink-0">
                    {/* ⭐ Sort Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                className="border-gray-700 text-gray-300 hover:bg-gray-800 gap-2 bg-transparent flex-1 lg:flex-initial"
                            >
                                <span className="hidden sm:inline">Sort:</span>
                                <span className="truncate">{sortOptions.find(opt => opt.value === sortBy)?.label}</span>
                                <ChevronDown className="w-4 h-4 flex-shrink-0" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-[#0d1117] border-gray-700">
                            {sortOptions.map((option) => (
                                <DropdownMenuItem
                                    key={option.value}
                                    onClick={() => setSortBy(option.value)}
                                    className={`cursor-pointer ${sortBy === option.value ? 'bg-gray-800 text-white' : 'text-gray-300'}`}
                                >
                                    {option.label}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* ⭐ Filters Dropdown */}
                    <DropdownMenu open={showFilterMenu} onOpenChange={setShowFilterMenu}>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                className="border-gray-700 text-gray-300 hover:bg-gray-800 gap-2 bg-transparent relative flex-1 lg:flex-initial"
                            >
                                <Filter className="w-4 h-4 flex-shrink-0" />
                                <span className="hidden sm:inline">Filters</span>
                                <AnimatePresence>
                                    {activeFilterCount > 0 && (
                                        <motion.span
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            exit={{ scale: 0 }}
                                            className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold"
                                        >
                                            {activeFilterCount}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-[#0d1117] border-gray-700 w-56">
                            <DropdownMenuCheckboxItem
                                checked={filters.hideCrypto}
                                onCheckedChange={() => toggleFilter('hideCrypto')}
                                className="cursor-pointer text-gray-300"
                            >
                                Hide Crypto Markets
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                                checked={filters.hideSports}
                                onCheckedChange={() => toggleFilter('hideSports')}
                                className="cursor-pointer text-gray-300"
                            >
                                Hide Sports Markets
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                                checked={filters.hideMentions}
                                onCheckedChange={() => toggleFilter('hideMentions')}
                                className="cursor-pointer text-gray-300"
                            >
                                Hide Mentions
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                                checked={filters.hideTrump}
                                onCheckedChange={() => toggleFilter('hideTrump')}
                                className="cursor-pointer text-gray-300"
                            >
                                Hide Trump
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                                checked={filters.hidePolitics}
                                onCheckedChange={() => toggleFilter('hidePolitics')}
                                className="cursor-pointer text-gray-300"
                            >
                                Hide Politics
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                                checked={filters.hideElections}
                                onCheckedChange={() => toggleFilter('hideElections')}
                                className="cursor-pointer text-gray-300"
                            >
                                Hide Elections
                            </DropdownMenuCheckboxItem>

                            {activeFilterCount > 0 && (
                                <>
                                    <DropdownMenuSeparator className="bg-gray-700" />
                                    <DropdownMenuItem
                                        onClick={resetFilters}
                                        className="cursor-pointer text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                    >
                                        <X className="w-4 h-4 mr-2" />
                                        Reset Filters
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>
    );
}