'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import BlogCard from './blog-card';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { BlogPost } from '@/generated/prisma/client';


type BlogListProps = {
  blogs: BlogPost[];
};

export default function BlogList({ blogs }: BlogListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Get unique tags from all blogs
  const allTags = Array.from(
    new Set(blogs.flatMap((blog) => blog.tags).filter((tag): tag is string => tag !== null))
  ).sort();

  // Filter blogs based on search query and selected tags
  const filteredBlogs = blogs.filter((blog) => {
    const matchesSearch =
      blog.title.toLowerCase().includes(searchQuery.toLowerCase()) 
      // (blog.excerpt ?? '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTags =
      selectedTags.length === 0 ||
      selectedTags.some((tag) => blog.tags?.includes(tag) ?? false);

    return matchesSearch && matchesTags;
  });

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSelectedTags([]);
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <div className="space-y-8 min-h-screen ">
      <div className=" backdrop-blur-sm sticky top-0 z-10 py-4 border-b">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search blogs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 border-muted-foreground/20 focus-visible:ring-red-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1 ml-1">
              {filteredBlogs.length}{' '}
              {filteredBlogs.length === 1 ? 'result' : 'results'} found
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
              <Button
                variant="outline"
                className={cn(
                  'flex items-center gap-2 border-muted-foreground/20',
                  selectedTags.length > 0 && 'border-red-500/50 bg-red-500/5'
                )}
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <Filter className="h-4 w-4" />
                <span>Filter by tags</span>
                {selectedTags.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1 bg-red-500 text-white"
                  >
                    {selectedTags.length}
                  </Badge>
                )}
              </Button>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Filter by tags</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {allTags.map((tag) => (
                  <DropdownMenuCheckboxItem
                    key={tag}
                    checked={selectedTags.includes(tag)}
                    onCheckedChange={() => toggleTag(tag)}
                  >
                    {tag}
                  </DropdownMenuCheckboxItem>
                ))}
                {selectedTags.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <div className="p-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => {
                          clearFilters();
                          setDropdownOpen(false);
                        }}
                      >
                        Clear all filters
                      </Button>
                    </div>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {selectedTags.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={clearFilters}
                className="h-9 w-9"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {selectedTags.length > 0 && (
          <motion.div
            className="flex flex-wrap gap-2 mt-3"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="text-sm text-muted-foreground py-1">
              Active filters:
            </span>
            {selectedTags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="bg-red-500/5 text-foreground border-red-500/30 flex items-center gap-1"
              >
                {tag}
                <X
                  className="h-3 w-3 cursor-pointer opacity-70 hover:opacity-100"
                  onClick={() => toggleTag(tag)}
                />
              </Badge>
            ))}
          </motion.div>
        )}
      </div>

      {filteredBlogs.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-xl font-medium mb-2">No blogs found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search or filter criteria
          </p>
          {(searchQuery || selectedTags.length > 0) && (
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setSearchQuery('');
                clearFilters();
              }}
            >
              Clear all filters
            </Button>
          )}
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {filteredBlogs.map((blog, index) => (
            <BlogCard key={blog.slug} blog={blog} index={index} />
          ))}
        </motion.div>
      )}
    </div>
  );
}
