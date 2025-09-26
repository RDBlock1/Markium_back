// / app/api/generate-card/route.ts
import { NextRequest, NextResponse } from 'next/server'
import puppeteer from 'puppeteer'

export async function POST(request: NextRequest) {
  try {
    const { tradeData } = await request.json()
    
    // HTML template for the card
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            width: 600px;
            height: 800px;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            color: white;
            padding: 32px;
          }
          .header { margin-bottom: 32px; }
          .title { color: #9ca3af; font-size: 14px; margin-bottom: 8px; }
          .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            background: ${tradeData.side === 'BUY' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'};
            color: ${tradeData.side === 'BUY' ? '#86efac' : '#fca5a5'};
          }
          .market { font-size: 24px; font-weight: bold; margin: 32px 0; }
          .outcome {
            display: inline-flex;
            align-items: center;
            gap: 12px;
            padding: 16px;
            background: linear-gradient(to right, rgba(147, 51, 234, 0.2), rgba(37, 99, 235, 0.2));
            border-radius: 16px;
            margin-bottom: 32px;
          }
          .stats {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-bottom: 32px;
          }
          .stat {
            background: rgba(255, 255, 255, 0.05);
            padding: 16px;
            border-radius: 16px;
          }
          .stat-label {
            color: #9ca3af;
            font-size: 12px;
            margin-bottom: 4px;
          }
          .stat-value {
            font-size: 24px;
            font-weight: bold;
          }
          .footer {
            position: absolute;
            bottom: 32px;
            left: 32px;
            right: 32px;
          }
          .brand {
            font-size: 20px;
            font-weight: bold;
            background: linear-gradient(to right, #c084fc, #60a5fa);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">POLYMARKET TRADE</div>
          <span class="badge">${tradeData.side}</span>
        </div>
        <div class="market">${tradeData.market}</div>
        <div class="outcome">
          <span>Position:</span>
          <strong>${tradeData.outcome}</strong>
        </div>
        <div class="stats">
          <div class="stat">
            <div class="stat-label">ENTRY PRICE</div>
            <div class="stat-value">${(tradeData.price * 100).toFixed(1)}%</div>
          </div>
          <div class="stat">
            <div class="stat-label">POSITION SIZE</div>
            <div class="stat-value">$${tradeData.usdcSize.toFixed(2)}</div>
          </div>
          <div class="stat">
            <div class="stat-label">SHARES</div>
            <div class="stat-value">${tradeData.size.toFixed(0)}</div>
          </div>
          <div class="stat">
            <div class="stat-label">IMPLIED ODDS</div>
            <div class="stat-value">${(tradeData.price * 100).toFixed(0)}%</div>
          </div>
        </div>
        <div class="footer">
          <div class="brand">markiumpro.com</div>
          <div style="color: #6b7280; font-size: 12px; margin-top: 4px;">Professional Trading Analytics</div>
        </div>
      </body>
      </html>
    `

    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    await page.setViewport({ width: 600, height: 800 })
    await page.setContent(html)
    
    const screenshot = await page.screenshot({ type: 'png' })
    await browser.close()
    
    // Convert screenshot to Buffer for Response compatibility
    const buffer = Buffer.from(screenshot as Uint8Array)

    return new Response(buffer, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="polymarket-trade.png"`
      }
    })
  } catch (error) {
    console.error('Error generating card:', error)
    return NextResponse.json({ error: 'Failed to generate card' }, { status: 500 })
  }
}