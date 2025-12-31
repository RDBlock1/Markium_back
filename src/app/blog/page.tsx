/* eslint-disable @typescript-eslint/no-explicit-any */


import {  Suspense } from "react";
import { BlogCard } from "@/components/blog-page/blog-card";
import { TagFilter } from "@/components/blog-page/tag-filter";
import { FlickeringGrid } from "@/components/ui/flickering-grid";
import { getBlogPosts, getAllTags } from "@/lib/blog";
import Image from "next/image";
import { Metadata } from "next";

const formatDate = (date: Date): string => {
    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
};

export const metadata: Metadata = {
    title: 'Blog | Markium -  Prediction Markets, Pre-IPO and Tokenized Assets Platform ',
    description:
        'Stay updated with the latest trends in prediction markets, pre-IPO investments, and tokenized assets with insights from Markium experts.',
    alternates: {
        canonical: 'https://markiumpro.com/blog',
    },
    keywords:[
        'blog',
        'markium blogs',
        'markium',
        'markium pro',
        'prediction markets',
        'pre-IPO investments',
        'tokenized assets',
        'Markium insights',
        'financial news',
        'investment strategies',
        'market analysis',
        'crypto trends',
        'blockchain updates'
    ],
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
    robots: {
        index: true,
        follow: true,
        nocache: false,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
};

export default async function HomePage({
    searchParams,
}: {
    searchParams: Promise<{ tag?: string }>;
}) {
    const resolvedSearchParams = await searchParams;
    const selectedTag = resolvedSearchParams.tag || "All";

    // Fetch from database
    const filteredBlogs = await getBlogPosts(selectedTag);
    const allTags = await getAllTags();

    // Calculate tag counts
    const allBlogsForCount = selectedTag === "All"
        ? filteredBlogs
        : await getBlogPosts();

    const tagCounts = allTags.reduce((acc, tag) => {
        if (tag === "All") {
            acc[tag] = allBlogsForCount.length;
        } else {
            acc[tag] = allBlogsForCount.filter((blog: { tags: string | string[]; }) =>
                blog.tags?.includes(tag)
            ).length;
        }
        return acc;
    }, {} as Record<string, number>);

    return (
        <div className="min-h-screen bg-background relative mt-8">
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
            <div className="p-6 border-b border-border flex flex-col gap-6 min-h-[250px] justify-center relative z-10">
                <div className="max-w-7xl mx-auto w-full">
                    <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-4">
                            <Image
                                src="/markium-logo.jpg"
                                alt="Markium Logo"
                                width={40}
                                height={40}
                                className="rounded-full object-cover"
                            />
                            <h1 className="font-medium text-4xl md:text-5xl tracking-tighter">
                                Markium Blog
                            </h1>
                    </div>
                        <p className="text-muted-foreground text-sm md:text-base lg:text-lg">
                            Latest news and updates from Makrium Blog.
                        </p>
                    </div>
                </div>
                {allTags.length > 0 && (
                    <div className="max-w-7xl mx-auto w-full">
                        <TagFilter
                            tags={allTags}
                            selectedTag={selectedTag}
                            tagCounts={tagCounts}
                        />
                    </div>
                )}
            </div>

            <div className="max-w-7xl mx-auto w-full px-6 lg:px-0">
                <Suspense fallback={<div>Loading articles...</div>}>
                    <div
                        className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 relative overflow-hidden border-x border-border ${filteredBlogs.length < 4 ? "border-b" : "border-b-0"
                            }`}
                    >
                        {filteredBlogs.map((blog:any) => {
                            const dateValue = blog.date ?? null;
                            const formattedDate = dateValue ? formatDate(new Date(dateValue)) : "";

                            return (
                                <BlogCard
                                    key={blog.id}
                                    url={`/blog/${blog.slug}`}
                                    title={blog.title}
                                    description={blog.description ?? ""}
                                    date={formattedDate}
                                    showRightBorder={filteredBlogs.length < 3}
                                />
                            );
                        })}
                    </div>
                </Suspense>
            </div>
        </div>
    );
}