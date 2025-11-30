/* eslint-disable @typescript-eslint/no-explicit-any */
import type { SearchResults, AnalyticsData } from "./types"

const API_BASE_URL = "https://cultyfi.com"

export class ApiService {
  /**
   * Search for keywords across all transcripts
   */
  static async searchKeyword(
    query: string,
    page = 1,
    perPage = 10,
    contextWords = 4
  ): Promise<SearchResults> {
    const response = await fetch(
      `${API_BASE_URL}/api/search?type=keyword&q=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}&context_words=${contextWords}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    )

    if (!response.ok) {
      const error = await response.json()
      console.log('error', error);
      throw new Error(error.message || "Failed to search keywords")
    }

    return response.json()
  }

  /**
   * Get analytics data for visualizations
   */
  static async getAnalytics(keyword: string): Promise<AnalyticsData> {
    const response = await fetch(
      `${API_BASE_URL}/api/analytics?keyword=${encodeURIComponent(keyword)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || "Failed to fetch analytics")
    }

    return response.json()
  }

  /**
   * Get list of all transcripts
   */
  static async getTranscripts(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/transcripts`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || "Failed to fetch transcripts")
    }

    const data = await response.json()
    return data.transcripts
  }

  /**
   * Get transcript statistics
   */
  static async getStats(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/stats`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || "Failed to fetch stats")
    }

    return response.json()
  }

  /**
   * Health check
   */
  static async healthCheck(): Promise<{ status: string; transcripts_loaded: number }> {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error("API health check failed")
    }

    return response.json()
  }
}