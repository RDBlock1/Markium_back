/* eslint-disable @next/next/no-img-element */
"use client"

import { useFeaturedEvents } from "@/hooks/polymarket/useTrendingEvents"
import { useRef } from "react"
import { Skeleton } from "@/components/ui/skeleton" // If you have shadcn/ui
import { formatVolume } from "@/lib/utils"
import Link from 'next/link'

export function FeaturedMarkets() {
    const scrollRef = useRef<HTMLDivElement>(null)

    // ⭐ Fetch featured events from your backend
    const { data, isLoading, isError } = useFeaturedEvents({ limit: 20 })

    const scroll = (direction: "left" | "right") => {
        if (scrollRef.current) {
            const scrollAmount = 120
            scrollRef.current.scrollBy({
                left: direction === "left" ? -scrollAmount : scrollAmount,
                behavior: "smooth",
            })
        }
    }

    // ⭐ Loading state
    if (isLoading) {
        return (
            <div className="relative mb-6">
                <div className="flex gap-4 overflow-hidden">
                    {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="w-[280px] h-[140px] rounded-xl" />
                    ))}
                </div>
            </div>
        )
    }

    // ⭐ Error state
    if (isError || !data?.success) {
        return (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg">
                Failed to load featured markets. Please try again later.
            </div>
        )
    }

    // ⭐ Extract events from response
    const featuredEvents = data?.data?.events || []

    // ⭐ Empty state
    if (featuredEvents.length === 0) {
        return (
            <div className="mb-6 p-4 bg-gray-50 text-gray-600 rounded-lg">
                No featured markets available at the moment.
            </div>
        )
    }

    // ⭐ Duplicate events for seamless infinite scroll
    const displayEvents = [...featuredEvents, ...featuredEvents]

    return (
        <div className="relative mb-6">
            <div className="overflow-hidden">
                <div
                    className="flex gap-4 min-w-max"
                    style={{
                        animation: "marquee 50s linear infinite",
                        willChange: "transform",
                    }}
                >
                    {displayEvents.map((event, index) => (
                        <Link
                            key={`${event.id}-${index}`}
                            href={`/market/${event.slug}`}
                                className="relative flex-shrink-0 w-[280px] h-[140px] rounded-xl overflow-hidden cursor-pointer group hover:opacity-90 transition-opacity"
                        >
                    {/* ⭐ Event Image */}
                    <img
                        src={event.image || event.icon || "/placeholder.svg"}
                        alt={event.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            // Fallback if image fails to load
                            e.currentTarget.src = "/placeholder.svg"
                        }}
                    />

                    {/* ⭐ Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                    {/* ⭐ Event Info */}
                    <div className="absolute bottom-3 left-3 right-3">
                        <h3 className="text-white font-semibold text-sm leading-tight mb-1 line-clamp-2">
                            {event.title}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-gray-300">
                            {/* ⭐ Volume Badge */}
                            {event.totalVolume > 0 && (
                                <span className="bg-white/20 px-2 py-0.5 rounded">
                                        {formatVolume(event.totalVolume)}
                                </span>
                            )}
                            {/* ⭐ Status */}
                            <span className={event.closed ? "text-gray-400" : "text-green-400"}>
                                {event.closed ? "Closed" : "Live"}
                            </span>
                        </div>
                    </div>

                </Link>
                    ))}
            </div>

            <style>{`
                    @keyframes marquee {
                        0% { transform: translateX(0); }
                        100% { transform: translateX(-50%); }
                    }
                `}</style>
        </div>
        </div >
    )
}