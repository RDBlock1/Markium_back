import ChatInterface from '@/components/ai-market-analyzer/chat-inteface';
import { Metadata } from 'next';
export const metadata: Metadata = {
    metadataBase: new URL(
        process.env.NEXT_PUBLIC_SITE_URL ||
            process.env.NEXT_PUBLIC_SITE_URL
            ? `https://${process.env.NEXT_PUBLIC_SITE_URL}`
            : 'http://localhost:3000'
    ),
    title: "AI Market Analyzer by Markiumpro - Polymarket Prediction Market Analysis Tool",
    description: "Analyze Polymarket prediction markets with AI-powered insights. Get real-time market analysis, probability assessments, and trading strategies for crypto, politics, sports, and entertainment markets featured by Markiumpro",
    keywords: [
        "AI market analyzer",
        "Markiumpro AI",
        "Polymarket AI",
        "prediction market analysis",
        "crypto prediction markets",
        "AI trading tool",
        "market probability calculator",
        "Polymarket analytics",
        "prediction market AI",
        "betting market analysis",
        "AI market insights",
        "Polymarket predictions",
        "market intelligence AI",
        "trading signals AI",
        "prediction markets crypto",
        "AI market research"
    ],
    openGraph: {
        type: "website",
        title: "AI Market Analyzer by Markiumpro - Smart Polymarket Analysis Tool",
        description: "Analyze any Polymarket prediction market with advanced AI. Get instant insights, risk assessments, and data-driven predictions for better trading decisions.",
        images: [
            {
                url: "/og-ai-market-analyzer.jpg", // Create this image
                width: 1200,
                height: 630,
                alt: "AI Market Analyzer - Polymarket Analysis Tool"
            }
        ],
        siteName: "Markium - Polymarket Analytics",
        url: "/ai-market-analyzer"
    },
    twitter: {
        card: "summary_large_image",
        title: "AI Market Analyzer by Markiumpro - Polymarket Analysis Tool",
        description: "Analyze prediction markets with AI. Get instant insights, probability assessments, and trading strategies.",
        images: ["/og-ai-market-analyzer.jpg"],
        creator: "@markium_io"
    },
    alternates: {
        canonical: "https://markiumpro.com/ai-market-analyzer"
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1
        }
    },
    other: {
        "x-robots-tag": "index, follow",
        "article:publisher": "Markium",
        "og:locale": "en_US"
    },
    category: "Finance & Trading",
    classification: "Prediction Markets Analysis Tool",
    applicationName: "Markium AI Market Analyzer"
}
export default function Page() {
    return <ChatInterface />
}
