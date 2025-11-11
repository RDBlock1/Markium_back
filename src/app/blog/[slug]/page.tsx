/* eslint-disable @typescript-eslint/no-explicit-any */
// app/blog/[slug]/page.tsx
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { TableOfContents } from "@/components/blog-page/table-of-contents";
import { MobileTableOfContents } from "@/components/blog-page/mobile-toc";
import { AuthorCard } from "@/components/blog-page/author-card";
import { ReadMoreSection } from "@/components/blog-page/read-more-section";
import { PromoContent } from "@/components/blog-page/promo-content";
import { getAuthor, isValidAuthor } from "@/lib/author";
import { FlickeringGrid } from "@/components/ui/flickering-grid";
import { HashScrollHandler } from "@/components/blog-page/hash-scroll-handler";
import { getBlogPostBySlug } from "@/lib/blog";


interface PageProps {
    params: Promise<{ slug: string }>;
}

const formatDate = (date: Date): string => {
    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
};

export default async function BlogPost({ params }: PageProps) {
    const { slug } = await params;

    if (!slug || slug.length === 0) {
        notFound();
    }

    const post = await getBlogPostBySlug(slug);

    if (!post) {
        notFound();
    }

    const formattedDate = formatDate(new Date(post.createdAt));

    return (
        <div className="min-h-screen bg-background relative">
            <HashScrollHandler />
            <div className="absolute top-0 left-0 z-0 w-full h-[200px] [mask-image:linear-gradient(to_top,transparent_25%,black_95%)]">
                <FlickeringGrid
                    className="absolute top-0 left-0 size-full"
                    squareSize={4}
                    gridGap={6}
                    color="#6B7280"
                    maxOpacity={0.2}
                    flickerChance={0.05}
                />
            </div>

            <div className="space-y-4 border-b border-border relative z-10">
                <div className="max-w-7xl mx-auto flex flex-col gap-6 p-6">
                    <div className="flex flex-wrap items-center gap-3 gap-y-5 text-sm text-muted-foreground">
                        <Button variant="outline" asChild className="h-6 w-6">
                            <Link href="/blog">
                                <ArrowLeft className="w-4 h-4" />
                                <span className="sr-only">Back to all articles</span>
                            </Link>
                        </Button>
                        {(Array.isArray(post.tags) ? post.tags.length > 0 : typeof post.tags === "string" && post.tags.length > 0) && (
                            <div className="flex flex-wrap gap-3 text-muted-foreground">
                                {(Array.isArray(post.tags) ? post.tags : typeof post.tags === "string" ? [post.tags] : []).map((tag: string) => (
                                    <span
                                        key={tag}
                                        className="h-6 w-fit px-3 text-sm font-medium bg-muted text-muted-foreground rounded-md border flex items-center justify-center"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                        <time className="font-medium text-muted-foreground">
                            {formattedDate}
                        </time>
                    </div>

                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-medium tracking-tighter text-balance">
                        {post.title}
                    </h1>

                    {post.description && (
                        <p className="text-muted-foreground max-w-4xl md:text-lg md:text-balance">
                            {post.description}
                        </p>
                    )}
                </div>
            </div>
            <div className="flex divide-x divide-border relative max-w-7xl mx-auto px-4 md:px-0 z-10">
                <div className="absolute max-w-7xl mx-auto left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] lg:w-full h-full border-x border-border p-0 pointer-events-none" />
                <main className="w-full p-0 overflow-hidden">
                    <div className="p-6 lg:p-10">
                        <article className="prose prose-lg dark:prose-invert max-w-none prose-headings:scroll-mt-8 prose-headings:font-semibold prose-headings:tracking-tight prose-p:text-muted-foreground prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:text-foreground prose-code:text-foreground prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground prose-li:text-muted-foreground">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    h1: ({ node, children, ...props }) => {
                                        const text = String(children);
                                        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                                        return <h1 id={id} className="text-3xl font-bold mt-8 mb-4" {...props}>{children}</h1>;
                                    },
                                    h2: ({ node, children, ...props }) => {
                                        const text = String(children);
                                        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                                        return <h2 id={id} className="text-2xl font-semibold mt-6 mb-3" {...props}>{children}</h2>;
                                    },
                                    h3: ({ node, children, ...props }) => {
                                        const text = String(children);
                                        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                                        return <h3 id={id} className="text-xl font-semibold mt-4 mb-2" {...props}>{children}</h3>;
                                    },
                                    h4: ({ node, children, ...props }) => {
                                        const text = String(children);
                                        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                                        return <h4 id={id} className="text-lg font-semibold mt-3 mb-2" {...props}>{children}</h4>;
                                    },
                                    p: ({ node, ...props }) => <p className="mb-4 leading-7" {...props} />,
                                    ul: ({ node, ...props }) => <ul className="my-4 ml-6 list-disc space-y-2" {...props} />,
                                    ol: ({ node, ...props }) => <ol className="my-4 ml-6 list-decimal space-y-2" {...props} />,
                                    li: ({ node, ...props }) => <li className="leading-7" {...props} />,
                                    blockquote: ({ node, ...props }) => (
                                        <blockquote className="border-l-4 border-primary pl-4 italic my-4" {...props} />
                                    ),
                                    code: ({ node, inline, ...props }: any) => {
                                        return inline ? (
                                            <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props} />
                                        ) : (
                                            <code className="block bg-muted p-4 rounded-lg overflow-x-auto text-sm" {...props} />
                                        );
                                    },
                                    pre: ({ node, ...props }) => (
                                        <pre className="bg-muted border border-border rounded-lg p-4 overflow-x-auto my-4" {...props} />
                                    ),
                                    a: ({ node, ...props }) => (
                                        <a className="text-primary hover:underline font-medium" {...props} />
                                    ),
                                    img: ({ node, ...props }) => (
                                        <img className="rounded-lg my-4 w-full" {...props} />
                                    ),
                                    hr: ({ node, ...props }) => <hr className="my-8 border-border" {...props} />,
                                    table: ({ node, ...props }) => (
                                        <div className="overflow-x-auto my-4">
                                            <table className="min-w-full divide-y divide-border" {...props} />
                                        </div>
                                    ),
                                    th: ({ node, ...props }) => (
                                        <th className="px-4 py-2 bg-muted font-semibold text-left" {...props} />
                                    ),
                                    td: ({ node, ...props }) => (
                                        <td className="px-4 py-2 border-t border-border" {...props} />
                                    ),
                                }}
                            >
                                {post.content}
                            </ReactMarkdown>
                        </article>
                    </div>
                    <div className="mt-10">
                        <ReadMoreSection
                            currentSlug={slug}
                            currentTags={Array.isArray(post.tags) ? post.tags : post.tags ? [post.tags] : undefined}
                        />
                    </div>
                </main>

                <aside className="hidden lg:block w-[350px] flex-shrink-0 p-6 lg:p-10 bg-muted/60 dark:bg-muted/20">
                    <div className="sticky top-20 space-y-8">
                        {post.author && isValidAuthor(post.author) && (
                            <AuthorCard author={getAuthor(post.author)} />
                        )}
                        <div className="border border-border rounded-lg p-6 bg-card">
                            <TableOfContents />
                        </div>
                    </div>
                </aside>
            </div>

            <MobileTableOfContents />
        </div>
    );
}

// Generate static params for all published blog posts
export async function generateStaticParams() {
    const { prisma } = await import("@/db/prisma");

    const posts = await prisma.blogPost.findMany({
        where: { published: true },
        select: { slug: true },
    });

    return posts.map((post) => ({
        slug: post.slug,
    }));
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps) {
    const { slug } = await params;
    const post = await getBlogPostBySlug(slug);

    if (!post) {
        return {
            title: "Blog Post Not Found",
        };
    }

    return {
        title: post.title,
        description: post.description,
        openGraph: {
            title: post.title,
            description: post.description,
            images: post.thumbnail ? [post.thumbnail] : [],
        },
    };
}