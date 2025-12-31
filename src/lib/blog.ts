
// lib/blog.ts
import { prisma } from "@/db/prisma";

export async function getBlogPosts(tag?: string) {
  const blogs = await prisma.blogPost.findMany({
    where: {
      published: true,
      ...(tag && tag !== "All" ? { tags: { contains: tag } } : {}),
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
  blogs.forEach((blog: { tags: string | string[] | null; }) => {
    const tags = blog.tags ?? [];
    const arr = Array.isArray(tags) ? tags : (typeof tags === "string" ? tags.split(",").map(s => s.trim()).filter(Boolean) : []);
    arr.forEach((tag: string) => tagSet.add(tag));
  });

  return ["All", ...Array.from(tagSet).sort()];
}

export async function getRelatedBlogPosts(currentSlug: string, tags?: string[] | null, limit = 3) {
  const tagList = tags ?? [];
  const blogs = await prisma.blogPost.findMany({
    where: {
      published: true,
      slug: { not: currentSlug },
      ...(tagList && tagList.length > 0 ? {
        OR: tagList.map((t) => ({ tags: { contains: t } })),
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