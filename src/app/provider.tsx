"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode, useState } from 'react'
import { type State, WagmiProvider } from 'wagmi'
import '@rainbow-me/rainbowkit/styles.css';

import { getConfig } from './config'
import { ThemeProvider } from 'next-themes';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { Toaster } from 'sonner';
import { SessionProvider } from 'next-auth/react';

type Props = {
  children: ReactNode,
  initialState: State | undefined,
}


export function Providers({ children, initialState }: Props) {
  const [config] = useState(() => getConfig())
  const [queryClient] = useState(() => new QueryClient())

  return (

    <SessionProvider>
    <WagmiProvider config={config} initialState={initialState}>


      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <ThemeProvider
            defaultTheme="dark"
          >
            {children}
            <Toaster
              position="top-center"
              duration={1400}
              closeButton
              theme='dark'
              richColors
            />
          </ThemeProvider>
        </RainbowKitProvider>
      </QueryClientProvider>

    </WagmiProvider>
    </SessionProvider>


  )
}