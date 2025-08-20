import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import {Providers} from "./provider"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "Markium - Crypto Market",
  description: "Trade and invest in the cryptocurrency market with confidence.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <style>{`
html {
  font-family: ${inter.style.fontFamily};
  --font-sans: ${inter.variable};
}
        `}</style>
      </head>
      <body className={`${inter.variable} antialiased`}>

        <div className="h-screen bg-[#0A0B0D] flex flex-col">
          <Providers>
            <Navbar />
            {children}
            <Footer />
          </Providers>
        </div>
      </body>
    </html>
  )
}
