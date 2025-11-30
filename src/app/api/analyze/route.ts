/* eslint-disable @typescript-eslint/no-explicit-any */
import { generateText } from "ai"

export async function POST(req: Request) {
  try {
    const { transcripts, query } = await req.json()

    if (!transcripts || !Array.isArray(transcripts)) {
      return Response.json({ error: "Invalid transcripts data" }, { status: 400 })
    }

    // Use Gemini 3 to analyze the transcripts
    const { text } = await generateText({
      model: "google/gemini-3-pro",
      prompt: `Analyze the following transcripts related to "${query}". 
      
Provide insights on:
1. Key themes and topics discussed
2. Sentiment analysis
3. Notable speakers and their perspectives
4. Trends over time

Transcripts:
${transcripts.map((t: any) => `- ${t.speaker} (${t.source}): ${t.snippet}`).join("\n")}

Please provide a comprehensive analysis.`,
      maxOutputTokens: 2000,
    })

    return Response.json({
      analysis: text,
      usage: "gemini-3-pro",
    })
  } catch (error) {
    console.error("[v0] Analysis error:", error)
    return Response.json({ error: "Failed to analyze transcripts" }, { status: 500 })
  }
}
