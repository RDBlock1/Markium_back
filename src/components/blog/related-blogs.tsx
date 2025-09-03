'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import type { BlogPost } from '@/types/blog';
import { Card, CardContent } from '@/components/ui/card';

type RelatedBlogsProps = {
  blogs: BlogPost[];
};

export default function RelatedBlogs({ blogs }: RelatedBlogsProps) {
  if (blogs.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      className="mt-16 border-t pt-12"
    >
      <h2 className="text-2xl font-bold mb-6">Related Articles</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {blogs.map((blog) => (
          <Link key={blog.slug} href={`/blog/${blog.slug}`}>
            <Card className="h-full hover:shadow-md transition-shadow duration-300">
              <div className="relative h-40 w-full">
                <Image
                  src={blog.coverImage || '/placeholder.svg'}
                  alt={blog.title}
                  fill
                  className="object-cover rounded-t-lg"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
                />
              </div>
              <CardContent className="p-4">
                <h3 className="font-medium line-clamp-2 mb-2">{blog.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {blog.excerpt}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </motion.section>
  );
}
