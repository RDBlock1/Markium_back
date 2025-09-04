export const dynamic = 'force-dynamic';
export const revalidate = 0;
import type { Metadata } from 'next';
import BlogList from '@/components/blog/blog-lists';
import { getAllBlogs } from '@/app/actions/blogs';
import PageHeader from '@/components/blog/page-header';
import { BlogHero } from '@/components/blog/blog-hero';

export const metadata: Metadata = {
  title: 'Blog | Markium -  Prediction Markets, Pre-IPO and Tokenized Assets Platform ',
  description:
    'Stay updated with the latest trends in prediction markets, pre-IPO investments, and tokenized assets with insights from Markium experts.',
  alternates: {
    canonical: 'https://markiumpro.com/blog',
  },

  openGraph: {
    title: 'Blog | Markium - Prediction Markets Insights & Updates',
    description:
      'Stay updated with the latest trends in prediction markets, pre-IPO investments, and tokenized assets with insights from Markium experts.',
    type: 'website',
    url: 'https://markiumpro.com/blog',
    images: [
      {
        url: 'https://markiumpro.com/images/og-blog.jpg',
        width: 1200,
        height: 630,
        alt: 'Markium Blog',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog | Markium - Prediction Markets Insights & Updates',
    description:
      'Stay updated with the latest trends in prediction markets, pre-IPO investments, and tokenized assets with insights from Markium experts.',
  },
};

export default async function BlogPage() {
  const blogs = await getAllBlogs();

  if (blogs?.length === 0) {
    return (
      <main className="min-h-screen mx-auto px-4 py-12 md:py-16   ">
        <div>
          <PageHeader
            title="No Blogs Available"
            subtitle="Currently, there are no blogs available. Please check back later."
            className="mb-12"
          />
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-12 md:py-16 ">
      <BlogHero />
      <BlogList blogs={blogs!} />
    </main>
  );
}
