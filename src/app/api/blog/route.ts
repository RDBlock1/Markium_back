import { auth } from '@/lib/auth';
import { generateSlug } from '@/lib/generateSlug';
import { editBlogFormSchema } from '@/schema/blogSchema';
import { NextRequest, NextResponse } from 'next/server';
import {prisma} from '@/db/prisma'
import { headers } from 'next/headers';


export async function POST(request: NextRequest) {
  try {
    const { title, category, excerpt, content, tags } =
      await request.json();

    if (!title || !category  || !excerpt || !content) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const session = await auth.api.getSession({
      headers: await headers()
    });
    
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });
    
    if (!user) {
      return NextResponse.json({ message: 'Admin not found' }, { status: 404 });
    }

    // 1. Generate slug
    const slug = generateSlug(title);

    // 2. Check uniqueness
    const existing = await prisma.blogPost.findUnique({
      where: { slug },
    });
    
    if (existing) {
      return NextResponse.json(
        {
          message:
            'A blog post with this title already exists (slug collision). Please modify the title.',
        },
        { status: 400 }
      );
    }

    // 3. Convert category to array if it's a string
    const tagsArray = Array.isArray(category) 
      ? category 
      : category.split(',').map((tag: string) => tag.trim()).filter(Boolean);

    // 4. Create the post with slug
    const post = await prisma.blogPost.create({
      data: {
        title,
        slug,
        tagsArray, // Now it's an array
        content,
        tags,
        author: user.name || '',
        authorUserId: user.id,
      },
    });

    console.log('Post created:', post);

    return NextResponse.json(
      { message: 'Post created successfully', post },
      { status: 201 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: 'Unable to create post' },
      { status: 500 }
    );
  }
}


export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, title, category, excerpt, content, tags } =
      editBlogFormSchema.parse(body);
    console.log('id , title, category, content',id,title,category);

    const session = await auth.api.getSession({
      headers: await headers()
    });


    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });
    
    if (!user) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    // 1. Generate a new slug from the updated title
    const newSlug = generateSlug(title);

    // 2. Check if another post is already using this slug
    const conflict = await prisma.blogPost.findFirst({
      where: {
        slug: newSlug,
        NOT: { id },
      },
    });
    
    if (conflict) {
      return NextResponse.json(
        {
          error:
            'Another post with this title already exists (slug collision). Please choose a different title.',
        },
        { status: 400 }
      );
    }

    // 3. Convert category to array if it's a string
    const tagsArray = Array.isArray(category) 
      ? category 
      : category.split(',').map((tag: string) => tag.trim()).filter(Boolean);

    // 4. Perform the update, including slug
    const post = await prisma.blogPost.update({
      where: { id },
      data: {
        title,
        slug: newSlug,
        tagsArray, // Now it's an array
        tags,
        content,
        updatedAt: new Date(),
      },
    });
console.log('post update',post);
    if (!post) {
      return NextResponse.json(
        { error: 'Unable to update post' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Post updated successfully', post },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating blog post:', error);
    return NextResponse.json(
      { error: 'Unable to update post' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest){
    try {
        const body = await req.json();
        const { id } = body;
        
        const session = await auth.api.getSession({
          headers: await headers()
        });
        
        if (!session?.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }
        
        const user = await prisma.user.findUnique({
            where: {
                email: session.user.email!,
            }
        })
        
        if(!user){
            return NextResponse.json(
                { error: 'Admin not found' },
                { status: 404 }
            )
        }
        
        const post = await prisma.blogPost.delete({
            where: {
                id,
            }
        })
        
        if(!post){
            return NextResponse.json(
                { error: 'Unable to delete post' },
                { status: 500 }
            )
        }
        
        return NextResponse.json({
          message: 'Post deleted successfully',
        }, { status: 200 });

    } catch (error) {
        console.log('error in the delete blog', error);
        return NextResponse.json(
            { error: 'Unable to delete post' },
            { status: 500 }
        )
    }
}