'use server';

import { BlogPost } from '@/generated/prisma/client';
import {prisma} from '@/db/prisma'


export async function getAllBlogs():Promise<BlogPost[] | null> {
    try {
        const blogs = await prisma.blogPost.findMany({
            orderBy: {
                createdAt: 'desc',
            },
        });

        if (!blogs) {
            return null;
        }
        return blogs;

    } catch (error) {
        console.log('Error fetching blogs:', error);
        return null;
    }
}

export async function getBlogBySlug(slug: string): Promise<BlogPost | null> {
    try {
        if(!slug){
            return null;
        }
        const blog = await prisma.blogPost.findFirst({
            where: {
                slug: slug,
            },
        });


        if (!blog) {
            return null;
        }
        return blog;

    } catch (error) {
        console.log('Error fetching blog by slug:', error);
        return null;
    }
}