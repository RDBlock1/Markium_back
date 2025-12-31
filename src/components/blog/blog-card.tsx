'use client';

import Link from 'next/link';
import { motion,Variants } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { formatDate } from '@/lib/utils';

import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { BlogPost } from '@/generated/prisma/client';

type BlogCardProps = {
  blog: BlogPost;
  index: number;
};

export default function BlogCard({ blog }: BlogCardProps) {
  const item : Variants= {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: 'easeOut',
      },
    },
  };

  return (
    <motion.div variants={item}>
      <Link href={`/blog/${blog.slug}`} className="block h-full">
        <Card className="overflow-hidden h-full hover:shadow-lg  transition-shadow duration-300">

          <CardContent className="">
            {/* <div className="flex flex-wrap gap-2 mb-3">
              {blog.tags.split(',').slice(0, 3).map((tag: string) => (
                <Badge key={tag.trim()} variant="secondary" className="font-normal">
                  {tag.trim()}
                </Badge>
              ))}
            </div> */}
            <h3 className="text-xl font-bold mb-2 line-clamp-2">
              {blog.title}
            </h3>
    
          </CardContent>
          <CardFooter className="px-5 pb-5 pt-0 flex justify-between text-sm text-muted-foreground">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              <span>{formatDate(blog.createdAt.toUTCString())}</span>
            </div>

          </CardFooter>
        </Card>
      </Link>
    </motion.div>
  );
}
