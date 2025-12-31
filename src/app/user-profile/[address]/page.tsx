/* eslint-disable react-hooks/error-boundaries */
/* eslint-disable prefer-const */
import UserDashboard from "@/components/user-profile/user-profile";
import { Metadata } from "next";

type Props = {
  params: Promise<{ address: string }>;
};

// Helper function to truncate address for display
function truncateAddress(address: string): string {
  if (!address || address.length <= 10) return address || "Unknown";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Utility to normalize base URL (handles www and non-www)
function getNormalizedBaseUrl(): string {
  // In development, always use localhost
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }

  let rawUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://markiumpro.com";

  try {
    const url = new URL(rawUrl);

    // Always prefer non-www canonical
    if (url.hostname.startsWith("www.")) {
      url.hostname = url.hostname.replace(/^www\./, "");
    }

    // Force https for production
    if (process.env.NODE_ENV === "production") {
      url.protocol = "https:";
    }

    // Remove any trailing slash
    return url.origin.replace(/\/$/, "");
  } catch {
    return "https://markiumpro.com"; // Fallback default
  }
}

// Function to fetch user data for metadata with aggressive timeout
async function getUserData(address: string) {
  // Quick validation
  if (!address || typeof address !== "string") {
    return null;
  }

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const controller = new AbortController();

    // Set aggressive timeout of 1.5 seconds for metadata
    const timeoutId = setTimeout(() => controller.abort(), 1500);

    const response = await fetch(
      `${apiUrl}/api/market/user?address=${encodeURIComponent(address)}`,
      {
        signal: controller.signal,
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`User data fetch failed with status: ${response.status}`);
      return null;
    }

    const data = await response.json();

    // Validate that we got actual data
    if (!data || typeof data !== "object") {
      return null;
    }

    return data;
  } catch (error) {
    // Silently fail and return null - we'll use defaults
    if (error instanceof Error && error.name !== "AbortError") {
      console.warn("Error fetching user metadata:", error.message);
    }
    return null;
  }
}

// Generate complete metadata object with all required fields
function generateCompleteMetadata(
  address: string,
  userName?: string,
  userImage?: string
): Metadata {
  const baseUrl = getNormalizedBaseUrl();
  const displayAddress = truncateAddress(address);

  // Use provided username or fallback to address
  const displayName = userName || displayAddress;

  // Generate title - ALWAYS provide a title
  const title = `${displayName} - Polymarket Portfolio`;
  const shortTitle = `${displayName} Portfolio`;

  // Generate description with wallet info
  const description = userName
    ? `View ${userName}'s trading portfolio, positions, and analytics on Polymarket. Wallet: ${displayAddress}`
    : `View trading portfolio and analytics for ${displayAddress} on Polymarket.`;

  // Use provided image or default
  const imageUrl = userImage || "/gradient-avatar-yellow-to-teal.jpg";

  // Ensure image URL is absolute
  const absoluteImageUrl = imageUrl.startsWith("http")
    ? imageUrl
    : `${baseUrl}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;

  return {
    // Primary metadata - REQUIRED
    title: title, // Direct string instead of object
    description: description,

    // Keywords for SEO
    keywords: [
      "Polymarket",
      "User Profile",
      "Trading Portfolio",
      "Analytics",
      "Prediction Markets",
      displayName,
      address,
    ].filter(Boolean),

    // Open Graph metadata
    openGraph: {
      type: "profile",
      title: title,
      description: description,
      images: [
        {
          url: absoluteImageUrl,
          width: 1200,
          height: 630,
          alt: `${displayName} Profile Picture`,
        },
      ],
      siteName: "Polymarket Analytics",
      url: `${baseUrl}/user-profile/${address}`,
      locale: "en_US",
    },

    // Twitter Card metadata
    twitter: {
      card: "summary_large_image",
      title: shortTitle,
      description: description,
      images: [absoluteImageUrl],
      creator: "@polymarket",
      site: "@polymarket",
    },

    // Base URL for relative URLs
    metadataBase: new URL(baseUrl),

    // Canonical URL
    alternates: {
      canonical: `${baseUrl}/user-profile/${address}`,
    },

    // Robots configuration
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },

    // Additional metadata
    other: {
      "x-robots-tag": "index, follow",
      "wallet-address": address,
    },

    // Authors if we have a username
    ...(userName && { authors: [{ name: userName }] }),

    // Viewport for mobile
    viewport: {
      width: "device-width",
      initialScale: 1,
      maximumScale: 1,
    },

    // Theme color
    themeColor: "#1a1a1a",
  };
}

// Main metadata generation function
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  let address = "unknown";

  try {
    // Await the params to get the address
    const resolvedParams = await params;
    address = resolvedParams?.address || "unknown";

    // Early return with basic metadata if no valid address
    if (!address || address === "unknown" || typeof address !== "string") {
      return {
        title: "User Profile - Polymarket Portfolio",
        description: "View trading portfolio and analytics on Polymarket.",
      };
    }

    // Always start with a default title
    let finalTitle = `${truncateAddress(address)} - Polymarket Portfolio`;
    let finalDescription = `View trading portfolio and analytics for ${truncateAddress(address)} on Polymarket.`;
    let finalImage = "/gradient-avatar-yellow-to-teal.jpg";

    // Try to fetch user data with timeout
    try {
      const userData = await getUserData(address);

      if (userData) {
        // Extract username with multiple fallbacks
        const userName =
          userData.name ||
          userData.pseudonym ||
          userData.username ||
          userData.displayName ||
          userData.display_name ||
          userData.handle ||
          null;

        // Update title if we have a username
        if (userName) {
          finalTitle = `${userName} - Polymarket Portfolio`;
          finalDescription = `View ${userName}'s trading portfolio, positions, and analytics on Polymarket. Wallet: ${truncateAddress(address)}`;
        }

        // Extract image with multiple fallbacks
        const userImage =
          userData.profileImage ||
          userData.profile_image ||
          userData.avatar ||
          userData.image ||
          userData.picture ||
          null;

        if (userImage) {
          finalImage = userImage;
        }
      }
    } catch (error) {
      // If user data fetch fails, continue with defaults
      console.warn("Could not fetch user data for metadata");
    }

    const baseUrl = getNormalizedBaseUrl();
    const absoluteImageUrl = finalImage.startsWith("http")
      ? finalImage
      : `${baseUrl}${finalImage.startsWith("/") ? "" : "/"}${finalImage}`;

    // Return clean, simple metadata object
    return {
      title: finalTitle,
      description: finalDescription,
      keywords: [
        "Polymarket",
        "User Profile",
        "Trading Portfolio",
        "Analytics",
        "Prediction Markets",
        address,
      ],
      openGraph: {
        type: "profile",
        title: finalTitle,
        description: finalDescription,
        images: [
          {
            url: absoluteImageUrl,
            width: 1200,
            height: 630,
            alt: "Profile Picture",
          },
        ],
        siteName: "Polymarket Analytics",
        url: `${baseUrl}/user-profile/${address}`,
      },
      twitter: {
        card: "summary_large_image",
        title: finalTitle,
        description: finalDescription,
        images: [absoluteImageUrl],
        creator: "@polymarket",
      },
      metadataBase: new URL(baseUrl),
      alternates: {
        canonical: `${baseUrl}/user-profile/${address}`,
      },
      robots: {
        index: true,
        follow: true,
      },
    };

  } catch (error) {
    // Ultimate fallback - ensure we ALWAYS return valid metadata
    console.error("Critical error in generateMetadata:", error);

    return {
      title: "User Profile - Polymarket Portfolio",
      description: "View trading portfolio and analytics on Polymarket.",
    };
  }
}

// Main page component
export default async function UserProfilePage({ params }: Props) {
  try {
    const { address } = await params;

    // Validate address before rendering
    if (!address || typeof address !== "string") {
      // You might want to redirect or show an error component
      return (
        <div className="flex items-center justify-center min-h-screen">
          <p>Invalid user address</p>
        </div>
      );
    }

    return <UserDashboard address={address} />;
  } catch (error) {
    console.error("Error rendering user profile page:", error);

    // Fallback UI
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Error loading user profile</p>
      </div>
    );
  }
}