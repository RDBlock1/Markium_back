"use client"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Sparkles } from "lucide-react"
import { Highlighter } from "../ui/highlighter"
import Link from "next/link"
import Image from "next/image"

export default function Hero() {
    const [mounted, setMounted] = useState<boolean>(false)

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true)
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
    ];
    return (
        <>
            <section className="relative overflow-hidden  flex flex-col ">
                <div className="container mx-auto px-4 md:py-10 relative z-10 flex-1 flex flex-col">
                    <div className="mx-auto max-w-4xl text-center mt-32 flex flex-col justify-center ">
                        {/* Badge */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="mb-8"
                        >
                            <Badge variant="outline" className="inline-flex items-center gap-2 px-4 py-2 text-sm">
                        
                                <Image
                                    src="https://play-lh.googleusercontent.com/VgY__XR8YoIwxNW8-tD8ct3T5zk1hSHDnJSUxrG5et2srt-XT1VeEs__AxckXgtSwNk=w240-h480-rw"
                                    alt="Markium Logo"
                                    width={20}
                                    height={20}
                                    className=""
                                />
                                <span>Markium v0.2.0</span>
                                <Sparkles className="h-4 w-4 text-yellow-400 animate-pulse" />
                            </Badge>
                        </motion.div>

                        {/* Main Heading */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="mb-6 "
                        >
                            <h1 id="main-title" className="text-2xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                                <strong>Data</strong>. <strong>Insights.</strong> <span>& </span>
                                <strong>Analytics</strong> <br /><em className="italic">For Every Polymarket Trader.</em>
                            </h1>
                        </motion.div>

                        {/* Description */}
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="mx-auto  max-w-2xl text-lg text-muted-foreground relative"
                        >
                            Your analytics companion for Polymarket — 
                            <Highlighter action="underline" color="#eaed37">
                                offering watchlists, user insights, AI rules, and market analysis tools. 
                            </Highlighter>
                             <span> </span>Designed to elevate your trading experience, not replace it.

                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="flex flex-col items-center gap-6 "
                        >
                            {/* Decorative Elements */}
                            <svg
                                width="100"
                                height="50"
                                viewBox="0 0 100 50"
                                fill="currentColor"
                                xmlns="http://www.w3.org/2000/svg"
                                className="text-foreground mt-8"
                            >
                                <path d="M68.6958 5.40679C67.3329 12.7082 68.5287 20.1216 68.5197 27.4583C68.5189 29.5382 68.404 31.6054 68.1147 33.682C67.9844 34.592 69.4111 34.751 69.5414 33.8411C70.5618 26.5016 69.2488 19.104 69.4639 11.7325C69.5218 9.65887 69.7222 7.6012 70.0939 5.56265C70.1638 5.1949 69.831 4.81112 69.4601 4.76976C69.0891 4.72841 68.7689 5.01049 68.6958 5.40679Z"></path>
                                <path d="M74.0117 26.1349C73.2662 27.1206 72.5493 28.1096 72.0194 29.235C71.5688 30.167 71.2007 31.137 70.7216 32.0658C70.4995 32.5033 70.252 32.9091 69.9475 33.3085C69.8142 33.4669 69.6779 33.654 69.5161 33.8093C69.4527 33.86 68.9199 34.2339 68.9167 34.2624C68.9263 34.1768 69.0752 34.3957 69.0055 34.2434C68.958 34.1515 68.8534 34.0531 68.8058 33.9612C68.6347 33.6821 68.4637 33.403 68.264 33.1208L67.1612 31.3512C66.3532 30.0477 65.5199 28.7126 64.7119 27.4093C64.5185 27.0699 63.9701 27.0666 63.7131 27.2979C63.396 27.5514 63.4053 27.9858 63.6018 28.2966C64.3845 29.5683 65.1956 30.8431 65.9783 32.1149L67.1572 33.9796C67.5025 34.5093 67.8225 35.2671 68.428 35.5368C69.6136 36.0446 70.7841 34.615 71.3424 33.7529C71.9992 32.786 72.4085 31.705 72.9035 30.6336C73.4842 29.3116 74.2774 28.1578 75.1306 26.9818C75.7047 26.2369 74.5573 25.3868 74.0117 26.1349ZM55.1301 12.2849C54.6936 18.274 54.6565 24.3076 55.0284 30.3003C55.1293 31.987 55.2555 33.7056 55.4419 35.4019C55.5431 36.3087 56.9541 36.0905 56.8529 35.1837C56.2654 29.3115 56.0868 23.3982 56.2824 17.4978C56.3528 15.8301 56.4263 14.1339 56.5537 12.4725C56.6301 11.5276 55.2034 11.3686 55.1301 12.2849Z"></path>
                                <path d="M59.2642 30.6571C58.8264 31.475 58.36 32.2896 57.9222 33.1075C57.7032 33.5164 57.4843 33.9253 57.2369 34.3311C57.0528 34.6861 56.8656 35.0697 56.6278 35.3898C56.596 35.4152 56.5611 35.4691 56.5294 35.4944C56.4881 35.6054 56.5041 35.4627 56.5548 35.5261C56.7481 35.6055 56.8337 35.6151 56.7545 35.5484L56.6784 35.4533C56.6023 35.3581 56.5263 35.263 56.4534 35.1393C56.1778 34.7619 55.8734 34.3814 55.5946 34.0324C55.0146 33.2744 54.4315 32.545 53.8515 31.787C53.2685 31.0576 52.1584 31.945 52.7415 32.6744C53.4229 33.5592 54.1042 34.4441 54.7888 35.3004C55.1184 35.7127 55.4321 36.2677 55.8569 36.6039C56.3069 36.9719 56.884 36.9784 57.3533 36.6551C57.7624 36.3542 57.9845 35.9167 58.2067 35.4792C58.4636 34.9878 58.746 34.5282 59.003 34.0369C59.5423 33.0859 60.0563 32.1032 60.5957 31.1522C60.7765 30.8257 60.5104 30.3627 60.2092 30.2135C59.8161 30.112 59.4451 30.3305 59.2642 30.6571ZM44.5918 10.1569L42.2324 37.5406C42.0032 40.1151 41.8057 42.6641 41.5764 45.2386C41.5032 46.1549 42.9299 46.314 43.0032 45.3977L45.3626 18.014C45.5918 15.4396 45.7893 12.8905 46.0186 10.316C46.1235 9.37433 44.6968 9.21532 44.5918 10.1569Z"></path>
                                <path d="M48.101 37.7616C46.7404 38.8232 45.8267 40.2814 44.9163 41.7109C44.0407 43.0866 43.1365 44.4592 41.738 45.3434C42.1247 45.5019 42.5146 45.6321 42.9014 45.7908C42.1324 41.8051 41.04 37.8699 39.6781 34.0203C39.545 33.6589 39.0695 33.5191 38.7365 33.6553C38.3719 33.817 38.2385 34.2353 38.3716 34.5969C39.7209 38.3007 40.7404 42.1121 41.4904 46.009C41.6012 46.5703 42.1877 46.7512 42.6539 46.4565C45.5462 44.6124 46.3877 40.9506 49.0169 38.8748C49.7178 38.2884 48.8304 37.1784 48.101 37.7616ZM25.9671 13.1014C25.7028 16.2497 26.0758 19.3824 26.5091 22.4929C26.9645 25.6636 27.4166 28.863 27.872 32.0337C28.1346 33.8253 28.3971 35.6167 28.631 37.4051C28.7607 38.3151 30.1717 38.0968 30.042 37.1868C29.5866 34.016 29.1281 30.8738 28.7012 27.7062C28.2647 24.6242 27.7396 21.5612 27.449 18.4666C27.2943 16.7449 27.2283 15.0042 27.3653 13.2572C27.4671 12.3442 26.0404 12.1851 25.9671 13.1014Z"></path>
                                <path d="M30.5625 27.3357C29.9525 30.7343 29.3425 34.133 28.704 37.5284C29.1225 37.4018 29.5411 37.2751 29.9882 37.1516C28.6034 35.0617 27.2504 32.9465 25.8655 30.8565C25.6406 30.5425 25.1523 30.517 24.8669 30.7451C24.5497 30.9987 24.5305 31.4299 24.7555 31.7439C26.1403 33.8338 27.4933 35.9491 28.8781 38.039C29.2489 38.6003 30.0417 38.2265 30.1624 37.6621C30.7724 34.2635 31.3824 30.8648 32.0209 27.4694C32.0908 27.1016 31.758 26.7178 31.3871 26.6765C30.9559 26.6573 30.6324 26.9679 30.5625 27.3357Z"></path>
                            </svg>

                      
                        </motion.div>
                    </div>

                    {/* Social Proof Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className=""
                    >
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground mb-6">Verified Affiliate of</p>
                            <div className="flex items-center justify-center gap-8">
                                <div className="opacity-100 grayscale-0 drop-shadow-[0_0_8px_rgba(56,189,248,0.5)] transition-all duration-300">
                                    <Link href={"https://polymarket.com/?via=markium"} target="_blank" rel="noopener noreferrer">
                                        <Image
                                            src="https://upload.wikimedia.org/wikipedia/commons/7/75/Company_Logo_Polymarket.png"
                                            alt="Tailwind CSS"
                                            className="h-10 object-contain"
                                            width={150}
                                            height={40}
                                        />
                                 </Link>
                                </div>
{/* 
                                <div className="opacity-60 grayscale hover:opacity-100 hover:grayscale-0 hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] transition-all duration-300">
<Link href={"https://polymark.et"} target="_blank" rel="noopener noreferrer">
                                        <Image
                                            src="https://res.cloudinary.com/dlttworg3/image/upload/v1761135234/Screenshot_2025-10-22_at_5.40.54_PM_pebeax.png"
                                            alt="polymark.et"
                                            className="h-8 object-contain"
                                            width={150}
                                            height={40}
                                        />
                                    </Link>

                                </div> */}

                                

                            </div>
                        </div>
                    </motion.div>


                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="my-10 overflow-hidden "
                    >
                        <div className="text-center">
                            <h3 className=" text-muted-foreground my-6">Featured In</h3>

                            {/* Scroll Container */}
                            <div className="relative w-full  max-w-lg mx-auto overflow-hidden">
                                <motion.div
                                    className="flex gap-6 items-center whitespace-nowrap"
                                    animate={{
                                        x: ["0%", "-100%"],
                                    }}
                                    transition={{
                                        ease: "linear",
                                        duration: 25, // adjust speed here
                                        repeat: Infinity,
                                    }}
                                >
                                    {/* Duplicate logos twice for seamless loop */}
                                    {[...Array(2)].map((_, i) => (
                                        <div key={i} className="flex gap-6 items-center">
                                            {logos.map((logo, index) => (
                                                <div
                                                    key={index}
                                                    className="flex gap-x-2 items-center justify-center border p-2 rounded-md font-semibold min-w-[120px] grayscale hover:opacity-100 hover:grayscale-0 hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] transition-all duration-300"
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
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>
        </>
    )
}
