import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { ArrowRight, Calendar, User } from "lucide-react"

const featuredPosts = [
    {
        id: 1,
        title: "Getting Started with Next.js 15",
        excerpt:
            "Learn the fundamentals of Next.js 15 and how to build modern web applications with React Server Components.",
        author: "Sarah Chen",
        date: "Oct 20, 2025",
        category: "Tutorial",
        image: "/next-js-development.jpg",
        slug: "getting-started-nextjs-15",
    },
    {
        id: 2,
        title: "Mastering Tailwind CSS Grid Layouts",
        excerpt:
            "Discover advanced techniques for creating responsive grid layouts with Tailwind CSS and improve your design workflow.",
        author: "Alex Rivera",
        date: "Oct 18, 2025",
        category: "Design",
        image: "/tailwind-css-grid-layout.jpg",
        slug: "tailwind-grid-layouts",
    },
    {
        id: 3,
        title: "React Performance Optimization Tips",
        excerpt:
            "Explore practical strategies to optimize your React applications and deliver faster, more efficient user experiences.",
        author: "Jordan Lee",
        date: "Oct 15, 2025",
        category: "Performance",
        image: "/react-performance-optimization.png",
        slug: "react-performance-tips",
    },
]

export default function BlogAd() {
    return (
        <div className="min-h-screen bg-background">
            <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-4xl text-center">
                    <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                        Welcome to Our Blog
                    </h1>
                    <p className="mt-6 text-balance text-lg text-muted-foreground sm:text-xl">
                        Stay updated with the latest articles, tutorials, and insights from our team
                    </p>
                    <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
                        <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                            Explore All Posts
                        </Button>
                        <Button size="lg" variant="outline">
                            Subscribe to Newsletter
                        </Button>
                    </div>
                </div>
            </section>

            {/* Featured Blog Posts Section */}
            <section className="px-4 py-20 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-6xl">
                    <div className="mb-12 text-center">
                        <h2 className="text-3xl font-bold text-foreground sm:text-4xl">Featured Articles</h2>
                        <p className="mt-4 text-muted-foreground">Check out our latest and most popular blog posts</p>
                    </div>

                    {/* Blog Grid */}
                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                        {featuredPosts.map((post) => (
                            <Link key={post.id} href={`/blog/${post.slug}`}>
                                <Card className="group h-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
                                    {/* Image Container */}

                                    {/* Content Container */}
                                    <div className="flex flex-col gap-4 p-6">
                                        <h3 className="line-clamp-2 text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                                            {post.title}
                                        </h3>

                                        <p className="line-clamp-2 text-sm text-muted-foreground">{post.excerpt}</p>

                                        {/* Meta Information */}
                                        <div className="flex flex-col gap-3 border-t border-border pt-4">
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <User className="h-4 w-4" />
                                                <span>{post.author}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Calendar className="h-4 w-4" />
                                                <span>{post.date}</span>
                                            </div>
                                        </div>

                                        {/* Read More Link */}
                                        <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-primary group-hover:gap-3 transition-all">
                                            Read More
                                            <ArrowRight className="h-4 w-4" />
                                        </div>
                                    </div>
                                </Card>
                            </Link>
                        ))}
                    </div>

                    {/* View All Posts Button */}
                    <div className="mt-12 text-center">
                        <Link href="/blog">
                            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                                View All Posts
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="border-t border-border bg-card px-4 py-16 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-2xl text-center">
                    <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Never Miss an Update</h2>
                    <p className="mt-4 text-muted-foreground">
                        Subscribe to our newsletter and get the latest articles delivered to your inbox.
                    </p>
                    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                        <input
                            type="email"
                            placeholder="Enter your email"
                            className="rounded-lg border border-input bg-background px-4 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Subscribe</Button>
                    </div>
                </div>
            </section>
        </div>
    )
}
