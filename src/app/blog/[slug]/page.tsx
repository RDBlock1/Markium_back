
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAllBlogs, getRelatedBlogs } from '@/lib/blog';
import { getBlogBySlug } from '@/app/actions/blogs';
import BlogContent from '@/components/blog/blog-content';
import RelatedBlogs from '@/components/blog/related-blogs';
import SocialShare from '@/components/blog/social-share';
import BackButton from '@/components/ui/back-button';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const blogName = (await params).slug;
  const blog = await getBlogBySlug(blogName);

  if (!blog) {
    return {
      title: 'Blog Not Found | Markium Blog',
      description: 'The requested blog post could not be found.',
    };
  }

  return {
    title: `${blog.title} | Markium Blog`,
    description: blog.excerpt,
    alternates: {
      canonical:  `https://www.markium.com/blog/${blog.slug}`,
    },
    openGraph: {
      title: blog.title,
      description: blog.excerpt || 'markium-blogs',
      type: 'article',
      url: `https://www.markium.com/blog/${blog.slug}`,
      publishedTime: blog.createdAt.toUTCString(),
      authors: ['Markium'],
    },
    twitter: {
      card: 'summary_large_image',
      title: blog.title,
      description: blog.excerpt || '',
    },
  };
}

export async function generateStaticParams() {
  const blogs = await getAllBlogs();

  return blogs.map((blog) => ({
    slug: blog.slug,
  }));
}

export default async function BlogPost({ params }: Props) {
  const slug = (await params).slug;
  console.log('slug',slug)

  const blog = await getBlogBySlug(slug);
  console.log('blog',blog)

  if (!blog) {
    notFound();
  }

  const relatedBlogs = await getRelatedBlogs(blog.slug, blog.tags);

  return (
    <main className="container mx-auto px-4 py-8 md:py-12 ">
      <div className="max-w-4xl mx-auto">
        <BackButton href="/blog" label="Back to all blogs" className="mb-6" />
        <BlogContent blog={blog} />
        <SocialShare
          title={blog.title}
          url={`https://www.markium.com/blog/${blog.slug}`}
          className="my-8"
        />
        <RelatedBlogs blogs={relatedBlogs} />
      </div>
    </main>
  );
}
