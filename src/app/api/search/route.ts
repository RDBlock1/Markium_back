import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const type = searchParams.get("type")
  const query = searchParams.get("q")

  if (!type || !query) {
    return Response.json({ error: "Missing parameters" }, { status: 400 })
  }

  // Mock response - replace with actual API integration
  const mockResults = {
    transcripts: [
      {
        id: "1",
        timestamp: new Date().toISOString(),
        videoTitle: `Results for: ${query}`,
        videoUrl: "https://youtube.com/watch?v=example",
        snippet: `This is a sample transcript mentioning ${query}. In production, this would come from your real API.`,
        speaker: "Sample Speaker",
        source: "Sample Source",
      },
    ],
    totalCount: 1,
    currentPage: 1,
    totalPages: 1,
  }

  return Response.json(mockResults)
}
