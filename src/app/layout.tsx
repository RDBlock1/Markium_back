import { type ReactNode } from 'react'
import { headers } from 'next/headers'
import { cookieToInitialState } from 'wagmi'

import './globals.css'
import { getConfig } from './config'
import { Providers } from './provider'
import { Navbar } from '@/components/navbar'

//metadata
export const metadata = {
  title: "Markium - Crypto Market",
  description: "Trade and invest in the cryptocurrency market with confidence.",
}

export default async function Layout({ children }: { children: ReactNode }) {
  const initialState = cookieToInitialState(
    getConfig(),
    (await headers()).get('cookie')
  )
  return (
    <html lang="en" className='dark'>
      <body className="h-screen bg-[#0A0B0D] flex flex-col">
        <Providers initialState={initialState}>
          <Navbar />
          {children}

        </Providers>
      </body>
    </html>
  )
}