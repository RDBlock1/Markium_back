/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/purity */
"use client"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Sparkles } from "lucide-react"
import { Highlighter } from "../ui/highlighter"
import Link from "next/link"
import Image from "next/image"

// Snowflake component
const Snowflake = ({ delay, duration, left }: any) => (
    <motion.div
        className="absolute text-white text-opacity-60 pointer-events-none"
        style={{ left: `${left}%`, top: -20 }}
        initial={{ y: -20, opacity: 0 }}
        animate={{
            y: ["0vh", "100vh"],
            opacity: [0, 1, 1, 0],
            x: [0, Math.random() * 40 - 20, Math.random() * 40 - 20, 0],
        }}
        transition={{
            duration,
            delay,
            repeat: Infinity,
            ease: "linear",
        }}
    >
        ❄
    </motion.div>
)

export default function Hero() {
    const [mounted, setMounted] = useState(false)
    const [sparkleColor, setSparkleColor] = useState("#ef4444")

    useEffect(() => {
        setMounted(true)

        // Alternate sparkle colors between red and green
        const interval = setInterval(() => {
            setSparkleColor(prev => prev === "#ef4444" ? "#22c55e" : "#ef4444")
        }, 1500)

        return () => clearInterval(interval)
    }, [])

    if (!mounted) {
        return null
    }

    const logos = [
        {
            name: "polymark.et",
            href: "https://polymark.et",
            src: "https://res.cloudinary.com/dlttworg3/image/upload/v1761135234/Screenshot_2025-10-22_at_5.40.54_PM_pebeax.png",
        },
        {
            name: "𝗡𝗜𝗖𝗢𝗟𝗘✰",
            src: "https://pbs.twimg.com/profile_images/1984018430417092611/G6Tqc-z__400x400.jpg",
        },
        { name: "ATOMS" },
        { name: "gamechanger" },
        {
            name: "Said",
            src: "https://pbs.twimg.com/profile_images/1984009470628761600/g0ajJ_4j_400x400.jpg",
        },
        {
            name: "eli5defi",
            href: "https://markium.ai/press",
        },
    ]

    // Generate snowflakes
    const snowflakes = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        delay: Math.random() * 10,
        duration: 10 + Math.random() * 15,
        left: Math.random() * 100,
    }))

    return (
        <>
            <section className="relative overflow-hidden flex flex-col">
                {/* Snowfall Effect */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                    {snowflakes.map(flake => (
                        <Snowflake
                            key={flake.id}
                            delay={flake.delay}
                            duration={flake.duration}
                            left={flake.left}
                        />
                    ))}
                </div>

                {/* Christmas lights effect */}
                <div className="absolute top-0 left-0 right-0 h-2 z-20">
                    <motion.div
                        className="flex justify-around h-full"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                    >
                        {[...Array(20)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="w-3 h-3 rounded-full"
                                style={{
                                    backgroundColor: i % 3 === 0 ? "#ef4444" : i % 3 === 1 ? "#22c55e" : "#3b82f6",
                                }}
                                animate={{
                                    opacity: [0.3, 1, 0.3],
                                }}
                                transition={{
                                    duration: 2,
                                    delay: i * 0.1,
                                    repeat: Infinity,
                                }}
                            />
                        ))}
                    </motion.div>
                </div>

                <div className="container mx-auto px-4 md:py-10 relative z-10 flex-1 flex flex-col">
                    <div className="mx-auto max-w-4xl text-center mt-32 flex flex-col justify-center">
                        {/* Holiday Greeting */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5 }}
                            className="mb-4"
                        >
                            <p className="text-sm text-muted-foreground">
                                🎄 Happy Christmas! 🎅
                            </p>
                        </motion.div>

                        {/* Badge with Christmas theme */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="mb-8"
                        >
                            <Badge
                                variant="outline"
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm border-red-500/30 bg-red-500/5"
                            >
                                <Image
                                    src="/markium-logo.jpg"
                                    alt="Markium Logo"
                                    width={20}
                                    height={20}
                                    className=""
                                />
                                <span>Markium v0.2.0</span>
                                <span className="text-xs">🎄</span>
                                <Sparkles
                                    className="h-4 w-4 animate-pulse"
                                    style={{ color: sparkleColor }}
                                />
                            </Badge>
                        </motion.div>

                        {/* Main Heading with festive glow */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="mb-6"
                        >
                            <h1
                                id="main-title"
                                className="text-2xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl"
                                style={{
                                    textShadow: "0 0 30px rgba(239, 68, 68, 0.3), 0 0 60px rgba(34, 197, 94, 0.2)"
                                }}
                            >
                                <strong>Data</strong>. <strong>Insights.</strong> <span>& </span>
                                <strong>Analytics</strong> <br /><em className="italic">For Every Polymarket Trader.</em>
                            </h1>
                        </motion.div>

                        {/* Description with festive highlight */}
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="mx-auto max-w-2xl text-lg text-muted-foreground relative"
                        >
                            Your analytics companion for Polymarket —
                            <Highlighter action="underline" color="#22c55e">
                                offering watchlists, user insights, AI rules, and market analysis tools.
                            </Highlighter>
                            <span> </span>Designed to elevate your trading experience, not replace it.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="flex flex-col items-center gap-6"
                        >
                            {/* Christmas decorative elements */}
                            <div className="mt-8 flex items-center gap-4">
                                <motion.span
                                    className="text-4xl"
                                    animate={{
                                        rotate: [0, -15, 15, -15, 0],
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        repeatDelay: 1,
                                    }}
                                >
                                    🎁
                                </motion.span>
                                <motion.span
                                    className="text-3xl"
                                    animate={{
                                        scale: [1, 1.2, 1],
                                    }}
                                    transition={{
                                        duration: 1.5,
                                        repeat: Infinity,
                                    }}
                                >
                                    ⭐
                                </motion.span>
                                <motion.span
                                    className="text-4xl"
                                    animate={{
                                        rotate: [0, 15, -15, 15, 0],
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        repeatDelay: 1,
                                        delay: 0.5,
                                    }}
                                >
                                    🎁
                                </motion.span>
                            </div>
                        </motion.div>
                    </div>

                    {/* Social Proof Section with Christmas glow */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className=""
                    >
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground mb-6">Verified Affiliate of</p>
                            <div className="flex items-center justify-center gap-8">
                                <motion.div
                                    className="opacity-100 grayscale-0 transition-all duration-300"
                                    style={{
                                        filter: "drop-shadow(0 0 12px rgba(239, 68, 68, 0.4)) drop-shadow(0 0 24px rgba(34, 197, 94, 0.3))"
                                    }}
                                    whileHover={{ scale: 1.05 }}
                                >
                                    <Link href={"https://polymarket.com/?via=markium"} target="_blank" rel="noopener noreferrer">
                                        <Image
                                            src="https://upload.wikimedia.org/wikipedia/commons/7/75/Company_Logo_Polymarket.png"
                                            alt="Polymarket"
                                            className="h-10 object-contain"
                                            width={150}
                                            height={40}
                                        />
                                    </Link>
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Featured In Section with festive styling */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="my-10 overflow-hidden"
                    >
                        <div className="text-center">
                            <h3 className="text-muted-foreground my-6">Featured In</h3>

                            <div className="relative w-full max-w-lg mx-auto overflow-hidden">
                                <motion.div
                                    className="flex gap-6 items-center whitespace-nowrap"
                                    animate={{
                                        x: ["0%", "-100%"],
                                    }}
                                    transition={{
                                        ease: "linear",
                                        duration: 25,
                                        repeat: Infinity,
                                    }}
                                >
                                    {[...Array(2)].map((_, i) => (
                                        <div key={i} className="flex gap-6 items-center">
                                            {logos.map((logo, index) => (
                                                <motion.div
                                                    key={index}
                                                    className="flex gap-x-2 items-center justify-center border border-red-500/20 bg-green-500/5 p-2 rounded-md font-semibold min-w-[120px] transition-all duration-300"
                                                    whileHover={{
                                                        scale: 1.05,
                                                        boxShadow: "0 0 20px rgba(239, 68, 68, 0.3)",
                                                    }}
                                                >
                                                    {logo.href ? (
                                                        <Link href={logo.href} target="_blank" rel="noopener noreferrer">
                                                            <p className="text-sm">{logo.name}</p>
                                                        </Link>
                                                    ) : (
                                                        <p>{logo.name}</p>
                                                    )}
                                                    {logo.src && (
                                                        <Image
                                                            src={logo.src}
                                                            alt={logo.name}
                                                            width={20}
                                                            height={20}
                                                            className="rounded-sm"
                                                        />
                                                    )}
                                                </motion.div>
                                            ))}
                                        </div>
                                    ))}
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>
        </>
    )
}