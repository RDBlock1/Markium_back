"use client"

import type React from "react"

import { Bell, ChevronsUpDown, CreditCard, LogOut, Sparkles, Settings } from "lucide-react"
import { useRouter } from "next/navigation"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export function NavUser({
    user,
}: {
    user: {
        name: string
        email: string
        avatar: string
    }
}) {
    const router = useRouter()

    const handleUpgrade = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        toast.success("Redirecting to upgrade page...")
        // Add actual upgrade logic here
    }

    const handleAccount = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        router.push("/settings")
        toast.success("Opening account settings...")
    }

    const handleBilling = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        toast.success("Opening billing settings...")
        // Add actual billing logic here
    }

    const handleNotifications = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        toast.success("Opening notification settings...")
        // Add actual notification logic here
    }

    const handleLogout = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        toast.success("Logging out...")
        // Add actual logout logic here
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className="w-full justify-start h-auto p-2 hover:bg-gray-100 data-[state=open]:bg-gray-100 rounded-lg"
                >
                    <div className="flex items-center gap-3 w-full">
                        <Avatar className="h-8 w-8 rounded-lg">
                            <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                            <AvatarFallback className="rounded-lg bg-blue-100 text-blue-600 font-medium">
                                {user.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="grid flex-1 text-left text-sm leading-tight">
                            <span className="truncate font-medium">{user.name}</span>
                            <span className="truncate text-xs text-gray-500">{user.email}</span>
                        </div>
                        <ChevronsUpDown className="ml-auto size-4 text-gray-400" />
                    </div>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                className="w-64 rounded-lg"
                side="top"
                align="start"
                sideOffset={4}
                onClick={(e) => e.stopPropagation()}
            >
                <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                        <Avatar className="h-8 w-8 rounded-lg">
                            <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                            <AvatarFallback className="rounded-lg bg-blue-100 text-blue-600 font-medium">
                                {user.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="grid flex-1 text-left text-sm leading-tight">
                            <span className="truncate font-medium">{user.name}</span>
                            <span className="truncate text-xs text-gray-500">{user.email}</span>
                        </div>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <DropdownMenuItem onClick={handleUpgrade} className="gap-2 cursor-pointer">
                        <Sparkles className="h-4 w-4" />
                        Upgrade to Pro
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <DropdownMenuItem onClick={handleAccount} className="gap-2 cursor-pointer">
                        <Settings className="h-4 w-4" />
                        Account Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleBilling} className="gap-2 cursor-pointer">
                        <CreditCard className="h-4 w-4" />
                        Billing
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleNotifications} className="gap-2 cursor-pointer">
                        <Bell className="h-4 w-4" />
                        Notifications
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="gap-2 cursor-pointer text-red-600 focus:text-red-600">
                    <LogOut className="h-4 w-4" />
                    Log out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
