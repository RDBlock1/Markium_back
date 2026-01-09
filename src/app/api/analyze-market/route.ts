/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/analyze-market/route.ts
import { type NextRequest, NextResponse } from "next/server"

// CORS headers configuration
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('[Next.js API] Received request body:', body.marketData);
    
    // Extract analysis type from the body
    const { analysisType = 'deep', ...marketData } = body
    
    // Transform the data to match your backend's expected format
    const backendPayload = {
      id: marketData.marketId || marketData.id,
      question: marketData.question,
      slug: marketData.slug || marketData.marketId?.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 50),
      description: marketData.description,
      endDate: marketData.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      startDate: marketData.startDate || new Date().toISOString(),
      outcomes: JSON.stringify(marketData.outcomes || ["Yes", "No"]),
      volume: String(marketData.volume || "0"),
      active: marketData.status === "active",
      closed: marketData.status === "closed",
      conditionId: `0x${Math.random().toString(16).substring(2)}`,
      resolutionSource: "",
      image: "",
      icon: "",
      marketMakerAddress: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Determine which endpoint to use based on analysis type
    const endpoint = analysisType === 'quick' ? '/api/quick-analyze' : '/api/deep-analyze'
    
    const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000'
    
    console.log('[Next.js API] Sending request to backend:', BACKEND_URL + endpoint, backendPayload);
    
    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(backendPayload),
    })
    console.log('[Next.js API] Received response from backend:', response);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Backend responded with ${response.status}`)
    }

    const data = await response.json()
    
    // Format the response for UI
    if (data.success && data.data) {
      return NextResponse.json({
        analysis: formatAnalysisForUI(data.data)
      }, { headers: corsHeaders })
    }

    // Fallback
    return NextResponse.json({
      analysis: formatFallbackAnalysis(data)
    }, { headers: corsHeaders })

  } catch (error) {
    console.error("[Next.js API] Error calling backend:", error)
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    
    return NextResponse.json(
      { 
        error: "Failed to analyze market",
        details: errorMessage,
        debug: process.env.NODE_ENV === 'development' ? {
          message: errorMessage,
          backend: process.env.BACKEND_URL || 'http://localhost:3001',
          timestamp: new Date().toISOString()
        } : undefined
      },
      { status: 500, headers: corsHeaders }
    )
  }
}

// Enhanced formatting function
function formatAnalysisForUI(data: any): string {
  const { question, category, analysis, metadata, type } = data
  
  let formattedAnalysis = `# Market Analysis: ${question}\n\n`
  
  // Add analysis type badge
  if (type) {
    const typeLabel = type === 'deep_analysis' ? '🔬 Deep Analysis' : '⚡ Quick Analysis'
    formattedAnalysis += `**Analysis Type:** ${typeLabel}\n\n`
  }
  
  // Add category badge
  if (category) {
    formattedAnalysis += `**Category:** ${category.charAt(0).toUpperCase() + category.slice(1)}\n\n`
  }
  
  // Main analysis content
  if (typeof analysis === 'string') {
    formattedAnalysis += analysis + '\n\n'
  } else if (Array.isArray(analysis)) {
    // Handle array of content blocks (from Claude)
    analysis.forEach((block: any) => {
      if (typeof block === 'string') {
        formattedAnalysis += block + '\n\n'
      } else if (block.text) {
        formattedAnalysis += block.text + '\n\n'
      } else if (block.type === 'text' && block.text) {
        formattedAnalysis += block.text + '\n\n'
      }
    })
  } else if (analysis?.summary) {
    const summaryText = Array.isArray(analysis.summary) 
      ? analysis.summary[0]?.text || analysis.summary[0] 
      : analysis.summary
    
    // Parse and format the analysis sections
    const sections = summaryText.split('\n\n')
    
    sections.forEach((section: string) => {
      // Check for recommendation section and highlight it
      if (section.includes('RECOMMENDATION:')) {
        const parts = section.split('RECOMMENDATION:')
        formattedAnalysis += parts[0] + '\n\n## 📊 RECOMMENDATION\n'
        
        // Extract YES/NO and confidence
        const recText = parts[1]
        const yesMatch = recText.match(/YES.*?(\d+%)/i)
        const noMatch = recText.match(/NO.*?(\d+%)/i)
        
        if (yesMatch) {
          formattedAnalysis += `### ✅ **YES** - Confidence: ${yesMatch[1]}\n`
        } else if (noMatch) {
          formattedAnalysis += `### ❌ **NO** - Confidence: ${noMatch[1]}\n`
        } else {
          formattedAnalysis += recText + '\n'
        }
      } else if (section.includes('TRADING STRATEGY:')) {
        formattedAnalysis += '\n## 💡 Research Strategy\n' + section.replace('TRADING STRATEGY:', '') + '\n'
      } else if (section.includes('KEY FACTORS')) {
        formattedAnalysis += '\n## 🔑 Key Factors\n' + section.replace(/KEY FACTORS.*?:/, '') + '\n'
      } else {
        formattedAnalysis += section + '\n\n'
      }
    })
  }
  
  // Add related markets section if available
  if (analysis?.relatedMarkets && analysis.relatedMarkets.length > 0) {
    formattedAnalysis += `\n## 🔗 Related Markets\n\n`
    analysis.relatedMarkets.forEach((market: any) => {
      const prices = JSON.parse(market.outcomePrices || '["0", "0"]')
      formattedAnalysis += `- **${market.question}**\n`
      formattedAnalysis += `  YES: ${(parseFloat(prices[0]) * 100).toFixed(0)}% | NO: ${(parseFloat(prices[1]) * 100).toFixed(0)}%`
      formattedAnalysis += ` | Volume: $${parseInt(market.volume).toLocaleString()}\n\n`
    })
  }
  
  // Add market comparisons if available
  if (analysis?.comparisons && analysis.comparisons.length > 0) {
    formattedAnalysis += `\n## 📈 Market Comparisons\n\n`
    analysis.comparisons.forEach((comparison: string) => {
      formattedAnalysis += `${comparison}\n\n`
    })
  }
  
  // Add event summary if it's valid
  if (analysis?.eventSummary && !isInvalidEventSummary(analysis.eventSummary)) {
    formattedAnalysis += `\n## 📋 Event Context\n\n`
    if (analysis.eventSummary.title) {
      formattedAnalysis += `**${analysis.eventSummary.title}**\n\n`
    }
    if (analysis.eventSummary.description && typeof analysis.eventSummary.description === 'string') {
      formattedAnalysis += `${analysis.eventSummary.description}\n\n`
    }
    if (analysis.eventSummary.resolution_criteria) {
      formattedAnalysis += `**Resolution Rules:** ${analysis.eventSummary.resolution_criteria}\n\n`
    }
  }
  
  // Add metadata footer
  if (metadata) {
    formattedAnalysis += `\n---\n`
    formattedAnalysis += `📊 **Market Stats**\n`
    formattedAnalysis += `- Volume: $${parseFloat(metadata.volume || 0).toLocaleString()}\n`
    formattedAnalysis += `- Status: ${metadata.marketStatus === 'closed' ? '🔴 Closed' : '🟢 Active'}\n`
    formattedAnalysis += `- End Date: ${new Date(metadata.endDate).toLocaleDateString()}\n`
    if (data.timestamp) {
      formattedAnalysis += `- Analyzed: ${new Date(data.timestamp).toLocaleString()}\n`
    }
  }
  
  // Add disclaimer at the end
  formattedAnalysis += `\n---\n`
  formattedAnalysis += `⚠️ **DISCLAIMER:** This analysis is for educational and informational purposes only. Not financial advice.\n`
  
  return formattedAnalysis
}

// Check if event summary is invalid (contains unrelated sources)
function isInvalidEventSummary(eventSummary: any): boolean {
  if (!eventSummary) return true
  
  // Check if it only contains sources object with stock market URLs
  if (eventSummary.description?.sources) {
    const sources = eventSummary.description.sources
    if (Array.isArray(sources) && sources.length > 0) {
      // Check if sources contain stock market/finance URLs (not related to the actual market)
      const hasStockSources = sources.some((s: any) => 
        s.url?.includes('stock') || 
        s.url?.includes('market') || 
        s.url?.includes('schwab') ||
        s.url?.includes('investing.com')
      )
      return hasStockSources
    }
  }
  
  return false
}

// Fallback formatting for unexpected response structures
function formatFallbackAnalysis(data: any): string {
  let analysis = "# Market Analysis\n\n"
  
  if (data.data) {
    analysis += "## Analysis Results\n\n"
    
    // Try to extract meaningful content
    if (data.data.analysis) {
      if (typeof data.data.analysis === 'string') {
        analysis += data.data.analysis
      } else if (Array.isArray(data.data.analysis)) {
        data.data.analysis.forEach((block: any) => {
          if (typeof block === 'string') {
            analysis += block + '\n\n'
          } else if (block.text) {
            analysis += block.text + '\n\n'
          }
        })
      } else {
        analysis += JSON.stringify(data.data.analysis, null, 2)
      }
    } else if (data.data.summary) {
      analysis += data.data.summary
    } else {
      // Last resort: stringify the data nicely
      analysis += "```json\n"
      analysis += JSON.stringify(data.data, null, 2)
      analysis += "\n```"
    }
  } else if (data.analysis) {
    analysis += data.analysis
  } else {
    analysis += "Analysis completed but response format was unexpected.\n\n"
    analysis += "Raw response:\n```json\n"
    analysis += JSON.stringify(data, null, 2)
    analysis += "\n```"
  }
  
  // Add disclaimer at the end of fallback analysis too
  analysis += `\n---\n`
  analysis += `⚠️ **DISCLAIMER:** This analysis is for educational and informational purposes only. Not financial advice.\n`
  
  return analysis
}

// Health check endpoint
export async function GET() {
  try {
    const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001'
    const response = await fetch(`${BACKEND_URL}/api/health`)
    const data = await response.json()
    
    return NextResponse.json({
      status: 'healthy',
      backend: BACKEND_URL,
      backendStatus: data,
      timestamp: new Date().toISOString()
    }, { headers: corsHeaders })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Cannot connect to backend server',
      backend: process.env.BACKEND_URL || 'http://localhost:3001'
    }, { status: 503, headers: corsHeaders })
  }
}