"use client"

import { useState } from "react"
import { Bot } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import Link from "next/link"
import { MarketSlug } from "@/types/market"

export function AIBotButton({isAnimated = true,market}: {isAnimated?: boolean,market:string}) {
    const [isOpen, setIsOpen] = useState(false)

    const handleAnalyzerSelect = (analyzer: string) => {
        console.log(`Selected: ${analyzer}`)
        setIsOpen(false)
        // Add your logic here for handling the selected analyzer
    }

    return (
        <>
            <Button onClick={() => setIsOpen(true)} className={` ${isAnimated ? "animate-bounce" : ""} gap-2`} size="lg">
                <Bot className="w-5 h-5" />
                <span className="hidden sm:inline">AI Analyzer</span>
            </Button>

            <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
                <AlertDialogContent className="w-[90vw] max-w-md mx-auto">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <Bot className="w-5 h-5" />
                            Choose AI Analyzer
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Select which AI analyzer you&apos;d like to use for your analysis.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <div className="flex flex-col gap-3 py-4 sm:flex-row">
                        <Link
                            href={`/ai-market-analyzer?market=${market}`}
                            target="_blank"
                        >
                            <AlertDialogAction
                                onClick={() => handleAnalyzerSelect("AI Market Analyzer")}
                                className="flex-1 bg-primary hover:bg-primary/90"
                            >
                                <span className="text-sm sm:text-base">AI Market Analyzer</span>
                            </AlertDialogAction>
                        </Link>
                       <Link href={`/ai-rules-analyzer?market=${market}`} target="_blank">
                            <AlertDialogCancel
                                onClick={() => handleAnalyzerSelect("AI Rules Analyzer")}
                                className="flex-1 bg-secondary hover:bg-secondary/80 text-secondary-foreground"
                            >
                                <span className="text-sm sm:text-base">AI Rules Analyzer</span>
                            </AlertDialogCancel>
                       </Link>
                    </div>

                    <Button variant="ghost" className="w-full" onClick={() => setIsOpen(false)}>
                        Cancel
                    </Button>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
