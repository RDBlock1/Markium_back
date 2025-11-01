/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/blog.ts
import { prisma } from "@/db/prisma";

export async function getBlogPosts(tag?: string) {
  const blogs = await prisma.blogPost.findMany({
    where: {
      published: true,
      ...(tag && tag !== "All" ? { tags: { has: tag } } : {}),
    },
    orderBy: {
      date: "desc",
    },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      date: true,
      tags: true,
      author: true,
      thumbnail: true,
      featured: true,
      readTime: true,
    },
  });

  return blogs;
}

export async function getBlogPostBySlug(slug: string) {
  const blog = await prisma.blogPost.findUnique({
    where: {
      slug: slug,
      published: true,
    },
  });

  return blog;
}

export async function getAllTags() {
  const blogs = await prisma.blogPost.findMany({
    where: { published: true },
    select: { tags: true },
  });

  const tagSet = new Set<string>();
  blogs.forEach((blog: { tags: any[]; }) => {
    blog.tags.forEach((tag: string) => tagSet.add(tag));
  });

  return ["All", ...Array.from(tagSet).sort()];
}

export async function getRelatedPosts(currentSlug: string, tags?: string[], limit: number = 3) {
  const blogs = await prisma.blogPost.findMany({
    where: {
      published: true,
      slug: { not: currentSlug },
      ...(tags && tags.length > 0 ? {
        tags: {
          hasSome: tags,
        },
      } : {}),
    },
    orderBy: {
      date: "desc",
    },
    take: limit,
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      date: true,
      tags: true,
      thumbnail: true,
      readTime: true,
    },
  });

  return blogs;
}