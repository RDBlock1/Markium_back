"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { SearchResults } from "@/lib/types"

interface ResultsPanelProps {
    results: SearchResults
    isLoading: boolean
    speakers: string[]
    selectedSpeaker: string
    onSpeakerChange: (speaker: string) => void
}

export function ResultsPanel({ results, isLoading, speakers, selectedSpeaker, onSpeakerChange }: ResultsPanelProps) {
    if (isLoading) {
        return (
            <div className="glass-card rounded-xl p-8 border border-border">
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
            </div>
        )
    }

    // Group results by video/transcript
    const groupedResults = results.resultsByTranscript || []

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="space-y-6"
        >
            {/* Header */}
            <div className="glass-card rounded-xl p-6 border border-border">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-foreground">Search Results</h2>
                        <p className="text-muted-foreground mt-1">
                            Found {results.totalCount} mentions across {results.analytics?.transcriptsWithMatches || 0} transcripts
                        </p>
                    </div>

                    {speakers.length > 1 && (
                        <Select value={selectedSpeaker} onValueChange={onSpeakerChange}>
                            <SelectTrigger className="w-[200px] bg-secondary/30 border-border/50">
                                <SelectValue placeholder="Filter by speaker" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Speakers</SelectItem>
                                {speakers.map((speaker) => (
                                    <SelectItem key={speaker} value={speaker}>
                                        {speaker}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>
            </div>

            {/* Grouped Results by Transcript */}
            {groupedResults.map((transcriptResult, index) => (
                <motion.div
                    key={transcriptResult.transcript_file}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index, duration: 0.4 }}
                >
                    <Card className="glass-card border border-border bg-gradient-to-br from-card/40 to-card/20">
                        <CardContent className="p-6 space-y-4">
                            {/* Transcript Header */}
                            <div className="space-y-3 pb-4 border-b border-border/50">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-foreground mb-2">
                                            {transcriptResult.metadata.title}
                                        </h3>
                                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                            <span>{transcriptResult.metadata.formatted_date}</span>
                                        </div>
                                    </div>
                                    {transcriptResult.metadata.youtube_url && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            asChild
                                            className="shrink-0"
                                        >
                                            <a
                                                href={transcriptResult.metadata.youtube_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                Watch Video
                                            </a>
                                        </Button>
                                    )}
                                </div>

                                {/* Analytics Badges */}
                                <div className="flex flex-wrap gap-2">
                                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                                        {transcriptResult.analytics.total_occurrences} mentions
                                    </Badge>
                                    <Badge variant="outline" className="border-border/50">
                                        {transcriptResult.analytics.percentage}% coverage
                                    </Badge>
                                    <Badge variant="outline" className="border-border/50">
                                        {transcriptResult.analytics.sentences_with_keyword} sentences
                                    </Badge>
                                </div>
                            </div>

                            {/* Matching Sentences */}
                            <div className="space-y-3">
                                {transcriptResult.matching_sentences.slice(0, 5).map((match, matchIndex) => (
                                    <motion.div
                                        key={`${transcriptResult.transcript_file}-${match.sentence_number}`}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.05 * matchIndex, duration: 0.3 }}
                                        className="p-4 rounded-lg bg-secondary/20 border border-border/30 hover:border-primary/30 transition-colors"
                                    >
                                        <div className="flex items-start gap-3">
                                            
                                            <div className="flex-1 space-y-2">
                                                <p className="text-foreground leading-relaxed">
                                                    <span>{match.text}</span>
                                                </p>
                                                {match.text.length > 200 && (
                                                    <details className="text-sm text-muted-foreground">
                                                        <summary className="cursor-pointer hover:text-foreground transition-colors">
                                                            View full sentence
                                                        </summary>
                                                        <p className="mt-2 pl-4 border-l-2 border-border/50">{match.text}</p>
                                                    </details>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}

                                {transcriptResult.matching_sentences.length > 5 && (
                                    <Button
                                        variant="ghost"
                                        className="w-full text-muted-foreground hover:text-foreground"
                                    >
                                        Show {transcriptResult.matching_sentences.length - 5} more mentions
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            ))}

            {groupedResults.length === 0 && (
                <Card className="glass-card border border-border">
                    <CardContent className="p-12 text-center">
                        <p className="text-muted-foreground text-lg">No results found</p>
                    </CardContent>
                </Card>
            )}
        </motion.div>
    )
}