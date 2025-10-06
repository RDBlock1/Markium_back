// app/api/analyze-market/route.ts
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Allow caller to specify analysisType, otherwise default to 'deep'
    const { analysisType = 'deep', ...marketData } = body

    // Build the payload (description etc.) — keep your existing safeDescription logic
    const backendPayload = {
      description:
        (marketData.description && String(marketData.description).trim()) ||
        (marketData.question && String(marketData.question).trim()) ||
        JSON.stringify(marketData),
      question: marketData.question || '',
      marketId: marketData.marketId || marketData.id || null,
      currentPrices: Array.isArray(marketData.currentPrices)
        ? marketData.currentPrices
        : undefined,
      raw: marketData,
      analysisType,
      slug:
        marketData.slug ||
        String(marketData.marketId || marketData.id || '')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .substring(0, 50),
      outcomes: marketData.outcomes || ['Yes', 'No'],
      status: marketData.status || 'unknown',
    }

    // Use environment override or default to local analyze-rules backend
    const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000'
    const endpoint = '/api/analyze-rules'

    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(backendPayload),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Backend responded with ${response.status}`)
    }

    const data = await response.json()

    // NORMALIZE: support both shapes:
    // 1) { success: true, data: { marketId, analysis, metadata } }
    // 2) { success: true, marketId, analysis, metadata } (your current case)
    const effective = data?.data ?? data

    // Validate the shape before formatting — we expect an `analysis` object (with breakdown/summary) or at least a string.
    const hasAnalysis =
      effective &&
      (typeof effective.analysis === 'object' ||
        typeof effective.analysis === 'string' ||
        typeof effective.breakdown === 'string' ||
        typeof effective.summary === 'string')

    if (data?.success && hasAnalysis) {
      // If the backend nested `analysis` inside `data`, effective is already the inner object.
      return NextResponse.json({
        analysis: formatAnalysisForUI(effective)
      })
    }

    // If we reach here, backend returned success but shape is unexpected.
    // Return a controlled error so the UI won't render raw JSON dump.
    console.warn("[analyze-market] Unexpected backend response shape:", { data })
    return NextResponse.json(
      {
        error: "Unexpected analysis response shape from backend",
        note: "The analyze-rules endpoint returned success but no `analysis` field we can render.",
        backendResponseSample: {
          success: Boolean(data?.success),
          marketId: data?.marketId ?? data?.data?.marketId ?? null,
          hasAnalysis: Boolean(hasAnalysis),
        }
      },
      { status: 422 }
    )

  } catch (error) {
    console.error("[Next.js API] Error calling backend:", error)

    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"

    return NextResponse.json(
      {
        error: "Failed to analyze market",
        details: errorMessage,
        debug: process.env.NODE_ENV === 'development' ? {
          message: errorMessage,
          backend: process.env.BACKEND_URL || 'http://localhost:4000',
          timestamp: new Date().toISOString()
        } : undefined
      },
      { status: 500 }
    )
  }
}


/**
 * Format analysis for UI.
 * Handles multiple shapes:
 * - analysis.breakdown (string markdown)
 * - analysis.summary (string or array)
 * - analysis (plain string)
 * Also surfaces metadata.currentPrices and descriptionLength if present.
 */
function formatAnalysisForUI(data: any): string {
  // Support both shapes:
  // - data.question / data.marketId (top-level fields)
  // - data.data.question / data.data.analysis (if wrapped)
  const effective = data?.data ?? data

  const question = effective.question || effective.marketId || 'Untitled Market'
  // analysis might be a string or object
  const analysisObj = typeof effective.analysis === 'object' ? effective.analysis : (typeof effective.analysis === 'string' ? { breakdown: effective.analysis } : {})
  const metadata = effective.metadata || {}

  let formatted = `# Market Analysis: ${question}\n\n`

  // prefer breakdown -> summary -> plain text
  const breakdown = typeof analysisObj.breakdown === 'string' ? analysisObj.breakdown.trim() : null
  const summary = typeof analysisObj.summary === 'string' ? analysisObj.summary.trim() : null
  const analysisText = typeof analysisObj === 'string' ? analysisObj.trim() : null

  if (breakdown) {
    // If breakdown already includes markdown sections, keep as-is.
    formatted += `${breakdown}\n\n`
  } else if (summary) {
    formatted += `${summary}\n\n`
  } else if (analysisText) {
    formatted += `${analysisText}\n\n`
  } else {
    // Best-effort: if there are any recognizable keys, render them succinctly instead of dumping raw JSON
    const pieces: string[] = []

    // include short bullets for common fields inside analysisObj
    if (analysisObj?.analysisType) pieces.push(`**Type:** ${analysisObj.analysisType}`)
    if (analysisObj?.modelUsed) pieces.push(`**Model:** ${analysisObj.modelUsed}`)
    if (analysisObj?.timestamp) pieces.push(`**Timestamp:** ${new Date(analysisObj.timestamp).toLocaleString()}`)

    // If there's any textual fields, show first 1000 chars of concatenated text
    const textCandidates = []
    for (const k of ['notes', 'details', 'description', 'explanation']) {
      if (typeof analysisObj[k] === 'string') textCandidates.push(analysisObj[k])
    }
    if (textCandidates.length) {
      const snippet = textCandidates.join('\n\n').substring(0, 1000)
      pieces.push(`**Snippet:**\n\n${snippet}${snippet.length >= 1000 ? '\n\n*(truncated)*' : ''}`)
    }

    if (pieces.length) {
      formatted += pieces.join('\n\n') + '\n\n'
    } else {
      // Controlled fallback message (no raw JSON dump)
      formatted += '_No readable analysis text found in the response._\n\n'
    }
  }

  // Add timestamp / model info if present (avoid duplication)
  if (analysisObj.modelUsed || analysisObj.analysisType || analysisObj.timestamp) {
    formatted += `---\n`
    if (analysisObj.modelUsed) formatted += `**Model:** ${analysisObj.modelUsed}\n\n`
    if (analysisObj.analysisType) formatted += `**Analysis Type:** ${analysisObj.analysisType}\n\n`
    if (analysisObj.timestamp) formatted += `**Analysis timestamp:** ${new Date(analysisObj.timestamp).toLocaleString()}\n\n`
  }

  // Add metadata details if available (currentPrices etc.)
  if (metadata && (Array.isArray(metadata.currentPrices) || typeof metadata.descriptionLength !== 'undefined' || typeof metadata.complexityScore !== 'undefined')) {
    formatted += `---\n\n## Metadata\n\n`
    if (Array.isArray(metadata.currentPrices)) {
      // show as percentages if numbers between 0 and 1
      const prices = metadata.currentPrices.map((p: number) => {
        if (typeof p === 'number' && p >= 0 && p <= 1) return `${(p * 100).toFixed(0)}%`
        return String(p)
      }).join(' | ')
      formatted += `- Current Prices: ${prices}\n`
    }
    if (typeof metadata.descriptionLength !== 'undefined') {
      formatted += `- Description Length: ${metadata.descriptionLength}\n`
    }
    if (typeof metadata.complexityScore !== 'undefined') {
      formatted += `- Complexity Score: ${metadata.complexityScore}\n`
    }
    formatted += '\n'
  }

  return formatted
}


function formatFallbackAnalysis(data: any): string {
  let analysis = "# Market Analysis (Fallback)\n\n"
  if (data && typeof data === 'object') {
    analysis += "Backend returned an unexpected shape. Raw response:\n\n"
    analysis += "```json\n"
    analysis += JSON.stringify(data, null, 2)
    analysis += "\n```\n"
  } else {
    analysis += String(data)
  }
  return analysis
}

// optional GET health check retained (uses default BACKEND_URL)
export async function GET() {
  try {
    const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000'
    const response = await fetch(`${BACKEND_URL}/api/health`)
    const data = await response.json()

    return NextResponse.json({
      status: 'healthy',
      backend: BACKEND_URL,
      backendStatus: data,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Cannot connect to backend server',
      backend: process.env.BACKEND_URL || 'http://localhost:4000'
    }, { status: 503 })
  }
}
