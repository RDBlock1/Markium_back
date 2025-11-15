/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { ThemeProvider } from "@/components/theme-provider";
import Navbar from "@/components/ui/navbar";
import { getConfig } from "@/utils/config";
import { SessionProvider } from "next-auth/react";
import { useState } from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from "sonner";
import { darkTheme, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import '@rainbow-me/rainbowkit/styles.css';
import { Footer } from "@/components/home-page/footer";



export default function Provider({ children, initialState }: { children: React.ReactNode, initialState: any }) {
  const [config] = useState(() => getConfig())
  const [queryClient] = useState(() => new QueryClient())
    return (
        <>
          <WagmiProvider config={config} initialState={initialState}>
            <QueryClientProvider client={queryClient}>
                      <RainbowKitProvider theme={darkTheme()} initialChain={config.chains[0]} >
              

  <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
            <Navbar />
          {children}

          <Footer />
          <Toaster
          position="top-center"
          theme="dark"
          />

        </ThemeProvider>
        </RainbowKitProvider>
        </QueryClientProvider>
        </WagmiProvider>
        </>
    )
}