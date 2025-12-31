import UserExplorer from "@/components/user-profile/user-explorer"
import { Metadata } from "next"

export const metadata:Metadata = {
  title: "User Explorer - Markium | Explore Top Traders & Their Strategies",
  description: "Discover top traders on Markium's user profiles. Analyze their trading strategies, performance, and portfolio details.",
  keywords: ["user profiles", "trading strategies", "top traders", "Markium"],
  authors: [{ name: "Markium", url: "https://markiumpro.com" }],
  openGraph: {
    title: "User Explorer - Markium",
    description: "Discover top traders on Markium's user profiles. Analyze their trading strategies, performance, and portfolio details.",
    url: "https://markiumpro.com/user-profile",
    siteName: "Markium",
    images: [
      { url: "https://markiumpro.com/user-profiles-image.png", alt: "User Profiles - Markium" }
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "User Profiles - Markium",
    description: "Discover top traders on Markium's user profiles. Analyze their trading strategies, performance, and portfolio details.",
    images: ["https://markiumpro.com/user-profiles-image.png"],
    creator: "@markiumpro",
  },    
  robots: {
    index: true,
    follow: true,
    nocache: true,
  },
  alternates: {
    canonical: "https://markiumpro.com/user-profile",
  },
  verification: {
    google: "G-VX4Y2W9C66",
  },
  other: {
    'x-robots-tag': 'index, follow',
  },
}

export default function UserProfilesPage() {

  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-8 w-full mx-auto">
        <UserExplorer />
    </div>
  )
}
