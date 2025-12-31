import ChatInterface from "@/components/ai-rule-analyzer/chat-interface";


import { Metadata } from "next"

export const metadata: Metadata = {
    metadataBase: new URL(
        process.env.NEXT_PUBLIC_SITE_URL ||
            process.env.NEXT_PUBLIC_SITE_URL
            ? `https://${process.env.NEXT_PUBLIC_SITE_URL}`
            : 'http://localhost:3000'
    ),
    title: "AI Rule Analyzer by Markiumpro- Polymarket Resolution Rules Analysis Tool",
    description: "Understand Polymarket market resolution rules with AI. Get detailed breakdowns of YES/NO conditions, edge cases, deadlines, and critical warnings to avoid costly mistakes. featured by Markiumpro",
    keywords: [
        "AI rule analyzer",
        "Markiumpro AI",
        "Markiumpro rule analyzer",
        "Polymarket rules",
        "market resolution analysis",
        "prediction market rules",
        "resolution criteria analyzer",
        "Polymarket resolution",
        "market rules AI",
        "trading rules analysis",
        "resolution conditions",
        "market settlement rules",
        "AI rule breakdown",
        "Polymarket terms",
        "market conditions analyzer",
        "resolution source verification",
        "prediction market compliance"
    ],
    openGraph: {
        type: "website",
        title: "AI Rule Analyzer - Polymarket Resolution Rules Tool",
        description: "Never lose money due to misunderstanding market rules. AI-powered analysis of Polymarket resolution criteria, edge cases, and critical warnings.",
        images: [
            {
                url: "/og-ai-rule-analyzer.jpg", // Create this image
                width: 1200,
                height: 630,
                alt: "AI Rule Analyzer - Polymarket Rules Analysis Tool"
            }
        ],
        siteName: "Markium - Polymarket Analytics",
        url: "/ai-rules-analyzer"
    },
    twitter: {
        card: "summary_large_image",
        title: "AI Rule Analyzer - Polymarket Rules Tool",
        description: "Understand market resolution rules before trading. Get AI-powered analysis of YES/NO conditions, edge cases, and critical warnings.",
        images: ["/og-ai-rules-analyzer.jpg"],
        creator: "@markium_io"
    },
    alternates: {
        canonical: "https://markiumpro.com/ai-rules-analyzer"
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
    classification: "Prediction Markets Compliance Tool",
    applicationName: "Markium AI Rule Analyzer"
}
export default function AIRulesAnalyzerPage() {

    return <ChatInterface />
}