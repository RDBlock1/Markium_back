import { ThemeProvider } from "@/components/theme-provider";
import Navbar from "@/components/ui/navbar";
import { SessionProvider } from "next-auth/react";



export default function Provider({ children }: { children: React.ReactNode }) {

    return (
        <>
        <SessionProvider>
  <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
            <Navbar />
          {children}

        </ThemeProvider>
        </SessionProvider>
        </>
    )
}