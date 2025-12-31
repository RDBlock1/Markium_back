"use client"

import * as React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { LogOut, Settings, UserIcon, Loader2 } from "lucide-react"

type UserMenuProps = {
    name: string
    email?: string
    imageUrl?: string
    onLogout: () => Promise<void> | void
    profileHref?: string
    settingsHref?: string
}

/**
 * UserMenu
 * Premium user control with avatar, name, and logout using shadcn/ui.
 */
export function UserMenu({
    name,
    email,
    imageUrl,
    onLogout,
}: UserMenuProps) {
    const [isLoggingOut, setIsLoggingOut] = React.useState(false)

   console.log('imageUrl:', imageUrl);
    const initials = React.useMemo(() => {
        const parts = name.trim().split(/\s+/).slice(0, 2)
        return parts.map((p) => p[0]?.toUpperCase()).join("") || "US"
    }, [name])

    async function handleLogout() {
        if (isLoggingOut) return
        setIsLoggingOut(true)
        try {
            await onLogout?.()
        } finally {
            setIsLoggingOut(false)
        }
    }

    return (
        <DropdownMenu >
            <DropdownMenuTrigger asChild>
                <div
                    className="flex items-center gap-2 rounded-full px-3 py-1.5   dark:ring-white/10 hover:bg-accent/40 hover:ring-black/10 transition-colors"
                    aria-label="Open user menu"
                >
                    <Avatar className="h-8 w-8">
                        <AvatarImage
                            src={imageUrl || "/placeholder.svg?height=64&width=64&query=premium-user-avatar"}
                            alt={`${name}'s avatar`}
                        />
                        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                    </Avatar>
                    <span className="hidden md:block text-sm font-medium">{name}</span>
                </div>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="end"
                sideOffset={8}
                className="min-w-[280px] rounded-2xl border bg-popover text-popover-foreground shadow-xl p-2"
            >
                <DropdownMenuLabel className="p-3">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                            <AvatarImage
                                src={imageUrl || "/placeholder.svg?height=80&width=80&query=premium-user-avatar"}
                                alt={`${name}'s avatar`}
                            />
                            <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold leading-6 text-pretty">{name}</p>
                            {email ? <p className="text-xs text-muted-foreground leading-5 truncate">{email}</p> : null}
                        </div>
                    </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />


                <DropdownMenuItem
                    className="text-red-600 focus:text-red-700 dark:text-red-500 dark:focus:text-red-400"
                    onSelect={() => {
                        void handleLogout()
                    }}
                >
                    {isLoggingOut ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                            <span>Logging out…</span>
                        </>
                    ) : (
                        <>
                            <LogOut className="mr-2 h-4 w-4" aria-hidden />
                            <span>Log out</span>
                        </>
                    )}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
