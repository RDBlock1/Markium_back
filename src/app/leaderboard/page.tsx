import LeaderboardMain from "@/components/leaderboard-page/leaderboard-main";

import { Metadata } from "next"


// metadata
export const metadata: Metadata = {
    title: "Leaderboard - Markium| Track Top Traders & Performance",
    description: "Check out the top traders on Markium's leaderboard. See who is leading in trading volume and profit.",
    keywords: ["leaderboard", "trading", "Markium"],
    authors: [{ name: "Markium", url: "https://markiumpro.com" }],
    openGraph: {
        title: "Leaderboard - Markium",
        description: "Check out the top traders on Markium's leaderboard. See who is leading in trading volume and profit.",
        url: "https://markiumpro.com/leaderboard",
        siteName: "Markium",
        images: [
            { url: "https://markiumpro.com/leaderboard-image.png", alt: "Leaderboard - Markium" }
        ],
        locale: "en_US",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Leaderboard - Markium",
        description: "Check out the top traders on Markium's leaderboard. See who is leading in trading volume and profit.",
        images: ["https://markiumpro.com/leaderboard-image.png"],
        creator: "@markiumpro",
    },
    robots: {
        index: true,
        follow: true,
        nocache: true,
    },
    alternates: {
        canonical: "https://markiumpro.com/leaderboard",
    },
    verification: {
        google: "G-VX4Y2W9C66",
    },
    other: {
        'x-robots-tag': 'index, follow',
    },
}

export default function LeaderboardPage() {


    return (
        <div>
            <LeaderboardMain />
        </div>
    )
}