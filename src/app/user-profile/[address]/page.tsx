import UserDashboard from "@/components/user-profile/user-dashboard";
import { Metadata } from "next";

type Props = {
  params: Promise<{ address: string }>;
};

// Helper function to truncate address for display
function truncateAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Function to fetch user data for metadata with aggressive timeout
async function getUserData(address: string) {
  try {
    // Create a race between fetch and timeout
    const fetchPromise = fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/market/user?address=${address}`,
      {
        cache: 'no-store',
        next: { revalidate: 60 }
      }
    );

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout')), 2000); // Reduced to 2 seconds
    });

    const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;

    if (!response.ok) {
      console.warn(`User data fetch failed with status: ${response.status}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error fetching user data for metadata:', error.message);
    }
    return null;
  }
}

// Generate static default metadata immediately
function getDefaultMetadata(address: string): Metadata {
  const displayAddress = truncateAddress(address);
  const defaultTitle = `${displayAddress} - Polymarket Portfolio`;
  const defaultDescription = `View trading portfolio and analytics for ${displayAddress} on Polymarket.`;
  const defaultImage = "/gradient-avatar-yellow-to-teal.jpg";

  return {
    title: defaultTitle,
    description: defaultDescription,
    keywords: [
      'Polymarket',
      'User Profile',
      'Trading Portfolio',
      'Analytics',
      'Prediction Markets',
      address
    ],
    openGraph: {
      type: 'profile',
      title: defaultTitle,
      description: defaultDescription,
      images: [
        {
          url: defaultImage,
          width: 1200,
          height: 630,
          alt: `User Profile Picture`,
        }
      ],
      siteName: 'Polymarket Analytics',
    },
    twitter: {
      card: 'summary_large_image',
      title: defaultTitle,
      description: defaultDescription,
      images: [defaultImage],
      creator: '@polymarket',
    },
    icons: {
      icon: '/favicon.ico',
      apple: '/apple-touch-icon.png',
      other: {
        rel: 'apple-touch-icon-precomposed',
        url: '/apple-touch-icon-precomposed.png',
      },
      shortcut: defaultImage,
    },
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    ),
    alternates: {
      canonical: `/user-profile/${address}`,
    },
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
    other: {
      'x-robots-tag': 'index, follow',
      'wallet-address': address,
    },
  };
}

// Generate metadata dynamically with immediate fallback
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const address = (await params).address;

  // Start with default metadata immediately
  const defaultMetadata = getDefaultMetadata(address);

  // Try to fetch user data, but don't wait too long
  try {
    const userData = await getUserData(address);

    // If we got user data, enhance the metadata
    if (userData) {
      const userName =
        userData?.name ||
        userData?.pseudonym ||
        userData?.username ||
        userData?.displayName ||
        truncateAddress(address);

      const userImage =
        userData?.profileImage ||
        userData?.avatar ||
        userData?.image ||
        "/gradient-avatar-yellow-to-teal.jpg";

      const pageTitle = `${userName} - Polymarket Portfolio`;
      const shortTitle = `${userName} Portfolio`;
      const pageDescription = `View ${userName}'s trading portfolio, positions, and analytics on Polymarket. Wallet: ${truncateAddress(address)}`;

      return {
        title: pageTitle,
        description: pageDescription,
        keywords: [
          'Polymarket',
          'User Profile',
          'Trading Portfolio',
          'Analytics',
          'Prediction Markets',
          userName,
          address
        ],
        openGraph: {
          type: 'profile',
          title: pageTitle,
          description: pageDescription,
          images: [
            {
              url: userImage,
              width: 1200,
              height: 630,
              alt: `${userName} Profile Picture`,
            }
          ],
          siteName: 'Polymarket Analytics',
        },
        twitter: {
          card: 'summary_large_image',
          title: shortTitle,
          description: pageDescription,
          images: [userImage],
          creator: '@polymarket',
        },
        icons: {
          icon: '/favicon.ico',
          apple: '/apple-touch-icon.png',
          other: {
            rel: 'apple-touch-icon-precomposed',
            url: '/apple-touch-icon-precomposed.png',
          },
          shortcut: userImage,
        },
        metadataBase: new URL(
          process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
        ),
        alternates: {
          canonical: `/user-profile/${address}`,
        },
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
        other: {
          'x-robots-tag': 'index, follow',
          'wallet-address': address,
        },
        authors: [{ name: userName }],
      };
    }
  } catch (error) {
    // If anything fails, just use default metadata
    console.error('Failed to generate enhanced metadata, using defaults:', error);
  }

  // Always return default metadata if user data fetch failed or timed out
  return defaultMetadata;
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