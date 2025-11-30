"use client"

import type React from "react"
import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Command, CommandInput, CommandList, CommandItem, CommandEmpty } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { SearchMode } from "@/lib/types"

interface SearchBarProps {
    mode: SearchMode
    onModeChange: (mode: SearchMode) => void
    onSearch: (query: string, mode: SearchMode) => void
    isLoading: boolean
}

export function SearchBar({ mode, onModeChange, onSearch, isLoading }: SearchBarProps) {
    const [query, setQuery] = useState("")
    const [selectedEvent, setSelectedEvent] = useState("")
    const [selectedSpeaker, setSelectedSpeaker] = useState("")
    const [open, setOpen] = useState(false)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (mode === "keyword" && query.trim()) {
            onSearch(query, mode)
        } else if (mode === "event" && selectedEvent) {
            onSearch(selectedEvent, mode)
        }
    }

    const mockEvents = [
        "2024 Presidential Election",
        "Bitcoin Price by End of Year",
        "Super Bowl Winner",
        "AI Market Cap Prediction",
        "Climate Policy Changes",
    ]

    const mockSpeakers = ["John Smith", "Jane Doe", "Mike Johnson", "Sarah Williams", "Tom Brown"]

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="glass-card rounded-xl p-8 border border-border space-y-6"
        >
            <Tabs value={mode} onValueChange={(v) => onModeChange(v as SearchMode)} className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2 bg-secondary/30 border border-border/50 p-1">
                    <TabsTrigger
                        value="keyword"
                        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md transition-all"
                    >
                        Keyword Search
                    </TabsTrigger>
                    <TabsTrigger
                        value="event"
                        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md transition-all"
                    >
                        Event Search
                    </TabsTrigger>
                </TabsList>
            </Tabs>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1 flex gap-3">
                        {mode === "keyword" ? (
                            <Input
                                type="text"
                                placeholder="Enter keywords... (e.g., bitcoin, market volatility)"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="flex-1 bg-secondary/30 text-foreground border-border/50 focus-visible:ring-primary focus-visible:border-primary placeholder:text-muted-foreground text-base"
                                aria-label="Keyword search input"
                            />
                        ) : (
                            <Popover open={open} onOpenChange={setOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={open}
                                        aria-label="Select Polymarket event"
                                        className="flex-1 justify-between bg-secondary/30 text-foreground border-border/50 hover:border-primary/50 text-base"
                                    >
                                        {selectedEvent || "Select Polymarket event..."}
                                        <svg
                                            className="ml-2 h-4 w-4 shrink-0 opacity-50"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                            aria-hidden="true"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px] p-0 bg-popover border-border">
                                    <Command className="bg-transparent">
                                        <CommandInput placeholder="Search events..." className="text-foreground" />
                                        <CommandList>
                                            <CommandEmpty>No events found.</CommandEmpty>
                                            {mockEvents.map((event) => (
                                                <CommandItem
                                                    key={event}
                                                    value={event}
                                                    onSelect={() => {
                                                        setSelectedEvent(event)
                                                        setOpen(false)
                                                    }}
                                                    className="text-foreground hover:bg-accent/20"
                                                >
                                                    {event}
                                                </CommandItem>
                                            ))}
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        )}
                    </div>

                    <div className="flex gap-3 items-center lg:flex-row flex-col">
                        <label htmlFor="speaker-filter" className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                            Filter Speaker:
                        </label>
                        <Select value={selectedSpeaker} onValueChange={setSelectedSpeaker}>
                            <SelectTrigger
                                id="speaker-filter"
                                className="w-full lg:w-[200px] bg-secondary/30 border-border/50 text-foreground focus:ring-primary focus:border-primary"
                            >
                                <SelectValue placeholder="All Speakers" />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border">
                                <SelectItem value="all" className="text-foreground">
                                    All Speakers
                                </SelectItem>
                                {mockSpeakers.map((speaker) => (
                                    <SelectItem key={speaker} value={speaker} className="text-foreground">
                                        {speaker}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button
                        type="submit"
                        disabled={isLoading || (mode === "keyword" ? !query.trim() : !selectedEvent)}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 font-semibold px-8 lg:px-6"
                    >
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <span
                                    className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"
                                    aria-hidden="true"
                                />
                                Searching
                            </span>
                        ) : (
                            "Search"
                        )}
                    </Button>
                </div>
            </form>
        </motion.div>
    )
}
