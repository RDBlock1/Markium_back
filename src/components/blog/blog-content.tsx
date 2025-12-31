'use client';


import { motion } from 'framer-motion';
import { Calendar, Clock, User } from 'lucide-react';
import { formatDate } from '@/lib/utils';

import { Badge } from '@/components/ui/badge';
import { BlogPost } from '@/generated/prisma/client';

type BlogContentProps = {
  blog: BlogPost;
};

export default function BlogContent({ blog }: BlogContentProps) {
  return (
    <article className="prose prose-gray dark:prose-invert max-w-none min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >

        <div className="flex flex-wrap gap-2 mb-4">
          {blog.tags.split(',').map((tag: string) => (
            <Badge key={tag.trim()} variant="secondary">
              {tag.trim()}
            </Badge>
          ))}
        </div>

        <h1 className="text-4xl font-bold mb-4">{blog.title}</h1>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-muted-foreground mb-8">
          <div className="flex items-center">
            <User className="h-4 w-4 mr-2" />
            <span>Markium</span>
          </div>
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            <span>{formatDate(blog.createdAt.toUTCString())}</span>
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2" />
          </div>
        </div>

       
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        dangerouslySetInnerHTML={{ __html: blog.content }}
      />
    </article>
  );
}
