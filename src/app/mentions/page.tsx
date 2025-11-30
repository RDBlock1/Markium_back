"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { SearchBar } from "@/components/mentions-explorer/search-bar"
import { ResultsPanel } from "@/components/mentions-explorer/results-panel"
import { AnalyticsCharts } from "@/components/mentions-explorer/analytics-chart"
import { ApiService } from "@/lib/api-service"
import type { SearchMode, SearchResults, AnalyticsData } from "@/lib/types"

export default function MentionsExplorer() {
    const [searchMode, setSearchMode] = useState<SearchMode>("keyword")
    const [results, setResults] = useState<SearchResults | null>(null)
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [selectedSpeaker, setSelectedSpeaker] = useState<string>("all")
    const [error, setError] = useState<string | null>(null)

    const handleSearch = async (query: string, mode: SearchMode) => {
        setIsLoading(true)
        setError(null)

        try {
            if (mode === "keyword") {
                // Fetch search results
                const searchResults = await ApiService.searchKeyword(query, 1, 50, 4)
                setResults(searchResults)

                // Fetch analytics data
                const analyticsData = await ApiService.getAnalytics(query)
                setAnalytics(analyticsData)
            } else {
                // Handle event mode (you can implement this later)
                console.log("Event mode not implemented yet")
            }
        } catch (err) {
            console.error("Search error:", err)
            setError(err instanceof Error ? err.message : "An error occurred")
        } finally {
            setIsLoading(false)
        }
    }

    const filteredResults = results
        ? {
            ...results,
            transcripts:
                selectedSpeaker === "all"
                    ? results.transcripts
                    : results.transcripts.filter((t) => t.speaker === selectedSpeaker),
            totalCount:
                selectedSpeaker === "all"
                    ? results.totalCount
                    : results.transcripts.filter((t) => t.speaker === selectedSpeaker).length,
        }
        : null

    const speakers = results
        ? Array.from(new Set(results.transcripts.map((t) => t.speaker))).sort()
        : []

    return (
        <div className="min-h-screen bg-background">
            <motion.div
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="container mx-auto px-4 py-10 max-w-7xl"
            >
                <header className="mb-12">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="space-y-2"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-3 h-3 bg-primary rounded-full"></div>
                            <span className="text-sm font-semibold text-primary uppercase tracking-widest">
                                Analytics Platform
                            </span>
                        </div>
                        <h1 className="text-6xl md:text-7xl font-bold text-foreground text-balance tracking-tighter">
                            Mentions Explorer
                        </h1>
                    </motion.div>
                </header>

                <SearchBar
                    mode={searchMode}
                    onModeChange={setSearchMode}
                    onSearch={handleSearch}
                    isLoading={isLoading}
                />

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 p-4 bg-destructive/10 border border-destructive rounded-lg"
                    >
                        <p className="text-destructive font-medium">Error: {error}</p>
                    </motion.div>
                )}

                {results && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="mt-12 space-y-8"
                    >
                        {analytics && <AnalyticsCharts data={analytics} />}
                        <ResultsPanel
                            results={filteredResults!}
                            isLoading={isLoading}
                            speakers={speakers}
                            selectedSpeaker={selectedSpeaker}
                            onSpeakerChange={setSelectedSpeaker}
                        />
                    </motion.div>
                )}

                {!results && !isLoading && !error && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="mt-24"
                    >
                        <div className="glass-card rounded-2xl p-20 max-w-3xl mx-auto border border-border">
                            <div className="space-y-6 text-center">
                                <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center mx-auto border border-primary/20">
                                    <svg
                                        className="w-12 h-12 text-primary"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        aria-hidden="true"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={1.5}
                                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                        />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-4xl font-bold text-foreground mb-3">Start Exploring</h2>
                                    <p className="text-muted-foreground text-lg">
                                        Search for keywords to discover mentions across Trump transcripts
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </motion.div>
        </div>
    )
}