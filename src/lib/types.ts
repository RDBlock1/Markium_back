export type SearchMode = "keyword" | "event"

export interface Transcript {
  id: string
  timestamp: string // ISO date string
  videoTitle: string
  videoUrl: string
  snippet: string // The highlighted text with [keyword]
  fullText: string // Complete sentence text
  sentenceNumber: number
  speaker: string
  source: string // transcript file name
  context: {
    before: string
    keyword: string
    after: string
  }
  occurrences: number
}

export interface SearchResults {
  transcripts: Transcript[]
  totalCount: number
  currentPage: number
  totalPages: number
  analytics?: {
    totalOccurrences: number
    transcriptsSearched: number
    transcriptsWithMatches: number
  }
  resultsByTranscript?: TranscriptResult[]
}

export interface TranscriptResult {
  transcript_file: string
  metadata: {
    title: string
    published: string
    formatted_date: string
    youtube_url: string
    video_id: string
    source: string | null
  }
  analytics: {
    total_occurrences: number
    sentences_with_keyword: number
    total_sentences: number
    percentage: number
    positions: number[]
    average_per_sentence: number
  }
  matching_sentences: MatchingSentence[]
}

export interface MatchingSentence {
  sentence_number: number
  text: string
  occurrences: number
  context: {
    before: string
    keyword: string
    after: string
  }
  highlighted: string
}

export interface AnalyticsData {
  mentionsBySpeaker: { speaker: string; count: number }[]
  mentionsBySource: { source: string; count: number }[]
  topicDistribution: { topic: string; value: number }[]
  mentionsOverTime: { date: string; count: number }[]
}

export interface PolymarketEvent {
  id: string
  title: string
  markets: PolymarketMarket[]
}

export interface PolymarketMarket {
  id: string
  title: string
  eventId: string
}