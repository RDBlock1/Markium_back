/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

// Custom Tooltip Component
export function CustomTooltip({ active, payload, label, marketData }: any) {

    if (!active || !payload || !payload.length) {
        return null
    }

    const date = new Date(label)
    const formattedDate = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    })

    // Filter out null values and sort by value descending
    const validPayload = payload
        .filter((p: any) => p.value !== null && p.value !== undefined)
        .sort((a: any, b: any) => b.value - a.value)

    if (validPayload.length === 0) {
        return null
    }

    return (
        <div className="rounded-lg border bg-background p-2 shadow-xl">
            <div className="grid gap-2">
                <div className="flex items-center justify-between gap-2">
                    <div className="grid gap-1">
                        <p className="text-sm font-medium text-muted-foreground">
                            {formattedDate}
                        </p>
                    </div>
                </div>
                {validPayload.map((entry: any, index: number) => {
                    const marketIndex = parseInt(entry.dataKey.replace('market', '')) - 1
                    const market = marketData[marketIndex]
                    const marketName = market?.name || entry.dataKey

                    return (
                        <div key={`item-${index}`} className="flex items-center justify-between gap-8">
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: entry.color }}
                                />
                                <span className="text-sm text-muted-foreground">
                                    {marketName}
                                </span>
                            </div>
                            <span className="text-sm font-medium">
                                {entry.value.toFixed(1)}%
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}