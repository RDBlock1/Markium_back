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



export default function Provider({ children, initialState }: { children: React.ReactNode, initialState: any }) {
  const [config] = useState(() => getConfig())
  const [queryClient] = useState(() => new QueryClient())
    return (
        <>
        <SessionProvider>
          <WagmiProvider config={config} initialState={initialState}>
            <QueryClientProvider client={queryClient}>

  <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
            <Navbar />
          {children}

          <Toaster
          position="top-center"
          theme="dark"
          />

        </ThemeProvider>
        </QueryClientProvider>
        </WagmiProvider>
        </SessionProvider>
        </>
    )
}