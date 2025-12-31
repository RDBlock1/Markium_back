/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { PolymarketEvent } from "@/types";
import {  TokenHolders, HolderData } from "@/types/holder";
import { baseUrl } from "@/utils";
import axios from 'axios';
import * as xml2js from 'xml2js';

export async function getTopHolders(marketId: string): Promise<TokenHolders[] | []> {
  try {
    const response = await fetch(`https://data-api.polymarket.com/holders?market=${marketId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      console.error('Error fetching top holders:', response.statusText);
      return [];
    }

    const rawData: { token: string; holders: HolderData[] }[] = await response.json();

    console.log('Fetched top holders:', rawData);

    if (rawData.length < 2) return [];

    // Map API output into your TokenHolders format
    const mappedData: TokenHolders = {
      tokenYes: rawData[0].token,
      holdersYes: rawData[0].holders,
      tokenNo: rawData[1].token,
      holdersNo: rawData[1].holders
    };

    return [mappedData]; // because your function returns TokenHolders[]
  } catch (error) {
    console.error('Error fetching top holders:', error);
    return [];
  }
}


interface MarketAPIResponse {
  data: PolymarketEvent;  // Changed from array to single object
  success: boolean;
  error?: string;
}

// API function for fetching market data
export async function fetchMarketData(slug: string): Promise<PolymarketEvent> {
  const response = await fetch(`${baseUrl}/api/slug-market`, {
    method: 'POST',
    body: JSON.stringify({ slug }),
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch market: ${response.status}`);
  }

  const result: MarketAPIResponse = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch market data');
  }

  if (!result.data) {
    throw new Error('Market not found');
  }

  return result.data;  // Return data directly, not data[0]
}



interface GoogleNewsArticle {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  description: string;
  guid: string;
  parsedDate: Date; // Add parsed date for sorting
  isRecent: boolean; // Flag for articles within 15 days
}

interface GoogleNewsResponse {
  articles: GoogleNewsArticle[];
  totalResults: number;
  query: string;
  filteredCount: number; // Count after date filtering
}

/**
 * Search Google News via RSS - Returns most recent articles first, max 15 days old
 */
async function searchGoogleNews(
  query: string,
  options: {
    language?: string;
    country?: string;
    timeframe?: 'h' | 'd' | 'w' | 'm'; // hour, day, week, month
    maxResults?: number;
    maxDaysOld?: number; // Maximum age in days
  } = {}
): Promise<GoogleNewsResponse> {
  try {
    const {
      timeframe = 'd',
      maxResults = 20, // Fetch more initially to filter by date
      language = 'en',
      country = 'US',
      maxDaysOld = 45
    } = options;

    // Google News RSS URL with better search parameters
    const baseUrl = 'https://news.google.com/rss/search';
    const params = new URLSearchParams({
      q: query,
      hl: language,
      gl: country,
      ceid: `${country}:${language}`,
      when: timeframe,
      num: Math.min(maxResults * 2, 100).toString() // Fetch more to account for filtering
    });

    const rssUrl = `${baseUrl}?${params.toString()}`;


    const response = await axios.get(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 15000
    });

    // Parse XML to JSON
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(response.data);
    
    const items = result.rss?.channel?.[0]?.item || [];
    
    // Calculate cutoff date (15 days ago)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxDaysOld);
    
    const articles: GoogleNewsArticle[] = items
      .map((item: any) => {
        // Extract source from title (Google News format: "Title - Source")
        const fullTitle = item.title?.[0] || '';
        const titleParts = fullTitle.split(' - ');
        const title = titleParts.slice(0, -1).join(' - ') || fullTitle;
        const source = titleParts[titleParts.length - 1] || 'Unknown';
        
        // Parse publication date
        const pubDateString = item.pubDate?.[0] || '';
        const parsedDate = new Date(pubDateString);
        
        // Check if date is valid and recent
        const isValidDate = !isNaN(parsedDate.getTime());
        const isRecent = isValidDate && parsedDate >= cutoffDate;


        return {
          title: title.trim(),
          link: item.link?.[0] || '',
          pubDate: pubDateString,
          source: source.trim(),
          description: item.description?.[0] || '',
          guid: item.guid?.[0]?.$?.isPermaLink === 'false' ? item.guid[0]._ : item.link?.[0],
          parsedDate: isValidDate ? parsedDate : new Date(0),
          isRecent: isRecent
        };
      })
      // Filter out articles older than maxDaysOld
      .filter((article: GoogleNewsArticle) => article.isRecent)
      // Sort by date - most recent first
      .sort((a: GoogleNewsArticle, b: GoogleNewsArticle) => 
        b.parsedDate.getTime() - a.parsedDate.getTime()
      )
      // Limit to requested number of results
      .slice(0, maxResults);

    return {
      articles,
      totalResults: items.length,
      filteredCount: articles.length,
      query
    };

  } catch (error) {
    console.error('Google News Error:', error);
    throw new Error(`Failed to fetch Google News: ${error}`);
  }
}

/**
 * Get most recent Google News articles (max 15 days old)
 */
export async function getGoogleNewsArticles(
  query: string, 
  maxResults: number = 10
): Promise<GoogleNewsResponse> {
  return await searchGoogleNews(query, {
    timeframe: 'd', // Use 'w' for better coverage if needed
    maxResults: maxResults,
    language: 'en',
    country: 'US',
    maxDaysOld: 15 // Hard limit: no articles older than 15 days
  });
}

/**
 * Get breaking news (last few hours)
 */
export async function getBreakingNews(
  query: string,
  maxResults: number = 5
): Promise<GoogleNewsResponse> {
  return await searchGoogleNews(query, {
    timeframe: 'h', // Last hour for breaking news
    maxResults: maxResults,
    language: 'en',
    country: 'US',
    maxDaysOld: 1 // Only today's news for breaking
  });
}

/**
 * Get recent news with flexible timeframe
 */
export async function getRecentNews(
  query: string,
  options: {
    maxResults?: number;
    maxDaysOld?: number;
    timeframe?: 'h' | 'd' | 'w' | 'm';
  } = {}
): Promise<GoogleNewsResponse> {
  const { maxResults = 20, maxDaysOld = 30, timeframe = 'w' } = options;
  
  return await searchGoogleNews(query, {
    timeframe,
    maxResults,
    language: 'en',
    country: 'US',
    maxDaysOld
  });
}

// Helper function to format publication date for display
export async function formatPublicationDate(pubDate: string): Promise<string> {
  const date = new Date(pubDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}
