/* eslint-disable @typescript-eslint/no-explicit-any */
// components/blog-page/read-more-section.tsx
import { getRelatedBlogPosts } from "@/lib/blog";
import { BlogCard } from "./blog-card";

const formatDate = (date: Date): string => {
    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
};

interface ReadMoreSectionProps {
    currentSlug: string;
    currentTags?: string[];
}

export async function ReadMoreSection({ currentSlug, currentTags }: ReadMoreSectionProps) {
    const relatedPosts = await getRelatedBlogPosts(currentSlug, currentTags, 3);

    if (relatedPosts.length === 0) {
        return null;
    }

    return (
        <div className="border-t border-border pt-10 px-6 lg:px-10">
            <h2 className="text-2xl font-semibold mb-6">Read More</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedPosts.map((post:any) => (
                    <BlogCard
                        key={post.id}
                        url={`/blog/${post.slug}`}
                        title={post.title}
                        description={post.description}
                        date={formatDate(new Date(post.date))}
                        thumbnail={post.thumbnail}
                        showRightBorder={false}
                    />
                ))}
            </div>
        </div>
    );
}