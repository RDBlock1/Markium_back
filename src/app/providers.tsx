/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { ThemeProvider } from "@/components/theme-provider";
import Navbar from "@/components/ui/navbar";
import { getConfig } from "@/utils/config";
import { useState } from "react";
import { WagmiProvider } from "wagmi";
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from "sonner";
import { darkTheme, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import '@rainbow-me/rainbowkit/styles.css';
import { Footer } from "@/components/ui/footer";
import { getQueryClient } from "@/lib/query-client";
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';



export default function Provider({ children, initialState }: { children: React.ReactNode, initialState: any }) {
    const [config] = useState(() => getConfig())
    const [queryClient] = useState(() => getQueryClient())
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
                            <ReactQueryDevtools initialIsOpen={false} />


                        </ThemeProvider>
                    </RainbowKitProvider>
                </QueryClientProvider>
            </WagmiProvider>
        </>
    )
}