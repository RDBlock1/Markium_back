import UserDashboard from "@/components/user-profile/user-dashboard";
import { Metadata } from "next";

type Props = {
  params: Promise<{ address: string }>;
};

// Function to fetch user data for metadata
async function getUserData(address: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/market/user?address=${address}`, {
      cache: 'no-store' // or use 'force-cache' with revalidation if you prefer
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching user data for metadata:', error);
    return null;
  }
}

// Generate metadata dynamically
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const address = (await params).address;
  const userData = await getUserData(address);

  const userName = userData?.name || userData?.pseudonym || address;
  const userImage = userData?.profileImage || "/gradient-avatar-yellow-to-teal.jpg";

  return {
    title: `${userName} (${address}) - Polymarket Portfolio`,
    description: `View ${userName}'s trading portfolio, positions, and analytics on Polymarket. Wallet Address: ${address}`,
    keywords: ['Polymarket', 'User Profile', 'Trading Portfolio', 'Analytics', userName, address],
    openGraph: {
      title: `${userName} (${address}) - Polymarket Portfolio`,
      description: `View ${userName}'s trading portfolio, positions, and analytics. Wallet Address: ${address}`,
      images: [userImage],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${userName} (${address}) - Polymarket Portfolio`,
      description: `View ${userName}'s trading portfolio and analytics. Wallet Address: ${address}`,
      images: [userImage],
    },
    icons: {
      icon: '/favicon.ico',
      apple: '/apple-touch-icon.png',
      other: {
        rel: 'apple-touch-icon-precomposed',
        url: '/apple-touch-icon-precomposed.png',
      },
      //user profile image as favicon
      shortcut: userImage,
    },
    metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
    alternates: {
      canonical: `/user-profile/${address}`,
    },
    //robots tag
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    //x-robots-tag
    other: {
      'x-robots-tag': 'index, follow',
    },
  };
}




export default async function UserProfilePage({ params }: Props) {
  const address = (await params).address;
  console.log('UserProfilePage address:', address);

  return (
    <div>
      <UserDashboard address={address} />
    </div>
  );
}