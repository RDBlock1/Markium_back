"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Sparkles, Zap } from "lucide-react"
import type { MarketData } from "./chat-interface"

interface MarketDataFormProps {
    onSubmit: (data: MarketData, analysisType: "quick" | "deep") => void
    isLoading: boolean
}

// const EXAMPLE_DATA: MarketData = {
//     marketId: "israel-strikes-iran-by-october-31",
//     question: "Israel strikes Iran by October 31?",
//     description: "This market will resolve to \"Yes\" if Israel initiates a drone, missile, or air strike on Iranian soil or any official Iranian embassy or consulate by October 31, 2025, 11:59 PM ET. Otherwise, this market will resolve to \"No\".\n\nFor the purposes of this market, a qualifying \"strike\" is defined as the use of aerial bombs, drones or missiles (including cruise or ballistic missiles) launched by Israeli military forces that impact Iranian ground territory or any official Iranian embassy or consulate (e.g., if a weapons depot on Iranian soil is hit by an Israeli missile, this market will resolve to \"Yes\").\n\nMissiles or drones which are intercepted and surface-to-air missile strikes will not be sufficient for a \"Yes\" resolution regardless of whether they land on Iranian territory or cause damage.\n\nActions such as artillery fire, small arms fire, FPV or ATGM strikes directly, ground incursions, naval shelling, cyberattacks, or other operations conducted by Israeli ground operatives will not qualify.\n\nThe resolution source will be a consensus of credible reporting.",
//     startDate: "2025-08-26T19:29:19.438801Z",  // ✅ market opens Jan 2025
//     endDate: "2025-10-31T00:00:00Z",  // ✅ market closes Nov 2025
//     outcomes: ["Yes", "No"],
//     volume: 423204.354651,
//     currentPrices: [0.5, 0.5],
//     status: "active",
// };
const EXAMPLE_DATA: MarketData = {
    marketId: "36303",
    question: "Gemini 3.0 released by...?",
    description: "This market will resolve according to the date (ET) Google's Gemini 3.0 model is made available to the general public. \n\nFor this market to resolve to \"Yes,\" Gemini 3.0 must be launched and publicly accessible, including via open beta or open rolling waitlist signups. A closed beta or any form of private access will not suffice. The release must be clearly defined and publicly announced by Google as being accessible to the general public.\n\nGemini 3.0 refers to a product explicitly named Gemini 3.0 (e.g. Gemini 3.0 pro would count), or one that is recognized as a successor to Gemini 2.0, similar to the progression from Gemini 1.0 to Gemini 2.0. Products labeled as Gemini 2.5 or similar will not count for this market's resolution.\n\nThe primary resolution source for this market will be official information from Google, with additional verification from a consensus of credible reporting.",
    startDate: "2024-06-26T19:29:19.438801Z",  // ✅ market opens Jan 2025
    endDate: "2024-12-31T00:00:00Z",  // ✅ market closes Nov 2025
    outcomes: ["Before Sep 30, 2024", "Between Oct 1 and Dec 31, 2024", "After Dec 31, 2024"],
    volume: 1250000,
    currentPrices: [0.5,0.5],
    status: "active",

}


export function MarketDataForm({ onSubmit, isLoading }: MarketDataFormProps) {
    const [analysisType, setAnalysisType] = useState<"quick" | "deep">("quick")
    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<MarketData>({
        defaultValues: {
            outcomes: ["Yes", "No"],
            status: "active",
        },
    })

    const fillExampleData = () => {
        Object.entries(EXAMPLE_DATA).forEach(([key, value]) => {
            setValue(key as keyof MarketData, value)
        })
    }

    const onFormSubmit = (data: MarketData) => {
        onSubmit(data, analysisType)
    }

    return (
        <Card className="glass p-6">
            <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-card-foreground">Market Data</h3>
                    <Button type="button" variant="outline" size="sm" onClick={fillExampleData}>
                        Fill Example
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="marketId">Market ID *</Label>
                        <Input
                            id="marketId"
                            {...register("marketId", { required: "Market ID is required" })}
                            placeholder="e.g., lewis-hamilton-f1-2025"
                        />
                        {errors.marketId && <p className="text-sm text-destructive">{errors.marketId.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="volume">Volume ($)</Label>
                        <Input
                            id="volume"
                            type="number"
                            {...register("volume", { valueAsNumber: true })}
                            placeholder="e.g., 1250000"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="question">Question *</Label>
                    <Input
                        id="question"
                        {...register("question", { required: "Question is required" })}
                        placeholder="e.g., Will Lewis Hamilton win the 2025 F1 World Championship?"
                    />
                    {errors.question && <p className="text-sm text-destructive">{errors.question.message}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="description">Description / Resolution Rules *</Label>
                    <Textarea
                        id="description"
                        {...register("description", { required: "Description is required" })}
                        placeholder="Describe the market and resolution criteria..."
                        rows={4}
                    />
                    {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="startDate">Start Date</Label>
                        <Input id="startDate" formNoValidate  {...register("startDate")} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="endDate">End Date</Label>
                        <Input id="endDate" formNoValidate {...register("endDate")} />
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button type="submit" className="flex-1" disabled={isLoading} onClick={() => setAnalysisType("quick")}>
                        <Zap className="mr-2 h-4 w-4" />
                        Quick Analysis
                    </Button>
                    <Button
                        type="submit"
                        variant="secondary"
                        className="flex-1"
                        disabled={isLoading}
                        onClick={() => setAnalysisType("deep")}
                    >
                        <Sparkles className="mr-2 h-4 w-4" />
                        Deep Analysis
                    </Button>
                </div>
            </form>
        </Card>
    )
}
