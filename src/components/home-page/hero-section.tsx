import { Badge } from "@/components/ui/badge"
import { Sparkles } from "lucide-react"
import { Highlighter } from "../ui/highlighter"
import Link from "next/link"
import Image from "next/image"
import { LightRays } from "../ui/light-rays"
import './hero-animations.css'


export default function Hero() {
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

    return (
        <>
            <section className="relative overflow-hidden flex flex-col -translate-y-20 md:-translate-y-18">
                <div className="container mx-auto px-4 md:py-10 relative z-10 flex-1 flex flex-col">
                    <div className="mx-auto max-w-4xl text-center mt-32 flex flex-col justify-center">
                        {/* Badge */}
                        <div className="mb-8 animate-fade-in-up">
                            <Badge
                                variant="outline"
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm"
                            >
                                <Image
                                    src="/markium-logo.jpg"
                                    alt="Markium Logo"
                                    width={20}
                                    height={20}
                                    className=""
                                />
                                <span>Markium v0.2.0</span>
                                <Sparkles className="h-4 w-4" />
                            </Badge>
                        </div>

                        {/* Main Heading */}
                        <div className="mb-6 animate-fade-in-up-delay-1">
                            <h1
                                id="main-title"
                                className="text-2xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl"
                            >
                                <strong>Data</strong>. <strong>Insights.</strong> <span>& </span>
                                <strong>Analytics</strong> <br /><em className="italic">For Every Polymarket Trader.</em>
                            </h1>
                        </div>

                        {/* Description */}
                        <p className="mx-auto max-w-2xl text-lg text-muted-foreground relative animate-fade-in-up-delay-2">
                            Your analytics companion for Polymarket —
                            <Highlighter action="underline" color="#3b82f6">
                                offering watchlists, user insights, AI rules, and market analysis tools.
                            </Highlighter>
                            <span> </span>Designed to elevate your trading experience, not replace it.
                        </p>
                    </div>

                    {/* Social Proof Section */}
                    <div className="mt-16 animate-fade-in-up-delay-4">
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground mb-6">Verified Affiliate of</p>
                            <div className="flex items-center justify-center gap-8">
                                <div className="opacity-100 grayscale-0 transition-all duration-300 hover:scale-105">
                                    <Link href={"https://polymarket.com/?via=markium"} target="_blank" rel="noopener noreferrer">
                                        <Image
                                            src="https://upload.wikimedia.org/wikipedia/commons/7/75/Company_Logo_Polymarket.png"
                                            alt="Polymarket"
                                            className="h-10 object-contain"
                                            width={150}
                                            height={40}
                                        />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Featured In Section */}
                    <div className="my-10 overflow-hidden  animate-fade-in-up-delay-4">
                        <div className="text-center">
                            <h3 className="text-muted-foreground my-6">Featured In</h3>

                            <div className="relative w-full max-w-5xl mx-auto overflow-hidden">
                                <div className="flex gap-6 items-center whitespace-nowrap animate-infinite-scroll">
                                    {[...Array(2)].map((_, i) => (
                                        <div key={i} className="flex gap-6 items-center">
                                            {logos.map((logo, index) => (
                                                <div
                                                    key={index}
                                                    className="flex gap-x-2 items-center justify-center border border-border bg-muted/50 p-2 rounded-md font-semibold min-w-[120px] transition-all duration-300 hover:scale-105"
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
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <LightRays />
            </section>
        </>
    )
}