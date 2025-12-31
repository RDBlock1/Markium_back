/* eslint-disable @next/next/inline-script-id */
import type { Metadata } from "next";
import {  Inconsolata } from "next/font/google";
import "./globals.css";
import Provider from "./providers";
import { getConfig } from "@/utils/config";
import { cookieToInitialState } from "wagmi";

import { headers } from "next/headers";
import Script from "next/script";


const inconsolata = Inconsolata({
  subsets: ["latin"],
  variable: "--font-inconsolata",
  display: "swap",
});



const GA_ID = "G-VX4Y2W9C66";

const schemaMarkup = generateSchemaMarkup();
export const metadata: Metadata = {
  title: "Markium -  Prediction Markets, Pre-IPO and Tokenized Assets Platform",
  description: 'Trade on real-world events and outcomes with Markium. Bet on politics, sports, crypto, and current events with real money. Also, access data and trade on Pre IPO stocks and Tokenized Assets.',
}

function generateSchemaMarkup() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://markiumpro.com/#organization",
    "name": "Markium",
    "alternateName": "MarkiumPro",
    "url": "https://markiumpro.com",
    "logo": {
      "@type": "ImageObject",
      "url": "https://markiumpro.com/markium.jpg",
      "width": 150,
      "height": 50
    },
    "sameAs": [
      "https://twitter.com/markiumpro"
    ],
    "description": "Markium is a prediction markets, Pre-IPO investment, and tokenized assets trading platform where users can trade on real-world events, invest in private companies, and access fractional ownership of tokenized assets."
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": "https://markiumpro.com/#website",
    "url": "https://markiumpro.com",
    "name": "Markium - Prediction Markets & Trading Platform",
    "description": "Trade on real-world events, invest in Pre-IPO companies, and access tokenized assets",
    "publisher": {
      "@id": "https://markiumpro.com/#organization"
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://markiumpro.com/search?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    },
    "inLanguage": ["en-US", "en-GB"]
  };

  const financialServiceSchema = {
    "@context": "https://schema.org",
    "@type": "FinancialService",
    "@id": "https://markiumpro.com/#service",
    "name": "Markium Trading Platform",
    "serviceType": [
      "Prediction Markets Trading",
      "Pre-IPO Investment Platform",
      "Tokenized Assets Trading",
      "Event-Based Trading"
    ],
    "provider": {
      "@id": "https://markiumpro.com/#organization"
    },
    "areaServed": {
      "@type": "Country",
      "name": "Global"
    },
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Trading Services",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Prediction Markets",
            "description": "Trade on political events, sports outcomes, and current events"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Pre-IPO Investments",
            "description": "Access early-stage investment opportunities in private companies"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Tokenized Assets",
            "description": "Invest in fractional ownership of real estate, art, and commodities"
          }
        }
      ]
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.7",
      "reviewCount": "1250",
      "bestRating": "5",
      "worstRating": "1"
    }
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://markiumpro.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Markets",
        "item": "https://markiumpro.com/markets"
      }
    ]
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What are prediction markets?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Prediction markets are exchange-traded markets where participants trade contracts whose payoffs are tied to future events. Users can bet on outcomes of political events, sports, crypto prices, and other real-world events."
        }
      },
      {
        "@type": "Question",
        "name": "How do Pre-IPO investments work on Markium?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Markium provides access to pre-IPO shares of private companies before they go public. Qualified investors can purchase equity in late-stage private companies through our platform."
        }
      },
      {
        "@type": "Question",
        "name": "What are tokenized assets?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Tokenized assets are blockchain-based digital representations of real-world assets like real estate, art, commodities, or stocks. They enable fractional ownership and easier trading of traditionally illiquid assets."
        }
      },
      {
        "@type": "Question",
        "name": "Is Markium available globally?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, Markium is accessible globally, though certain features and markets may be restricted based on local regulations in your jurisdiction."
        }
      }
    ]
  };

  const softwareApplicationSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Markium Trading Platform",
    "operatingSystem": "Any",
    "applicationCategory": "FinanceApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.7",
      "ratingCount": "1250"
    }
  };

  // Combine all schemas
  const combinedSchema = {
    "@context": "https://schema.org",
    "@graph": [
      organizationSchema,
      websiteSchema,
      financialServiceSchema,
      breadcrumbSchema,
      faqSchema,
      softwareApplicationSchema
    ]
  };

  return combinedSchema;
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const initialState = cookieToInitialState(
    getConfig(),
    (await headers()).get('cookie')
  )
  return (
    <html lang="en" suppressContentEditableWarning suppressHydrationWarning>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaMarkup) }}
      />
      {/* Init script */}
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}
      </Script>
      <body
        className={` ${inconsolata.className}  antialiased bg-black`}
        
      >
        <Provider initialState={initialState}>
            {children}

        </Provider>

      </body>
    </html>
  );
}
