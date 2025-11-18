import { z } from 'zod';

export const blogFormSchema = z.object({
  title: z.string().min(5, { message: 'Title must be at least 5 characters.' }),
  category: z.string(),
  excerpt: z
    .string()
    .min(5, { message: 'Excerpt must be at least 5 characters.' })
    .max(200, { message: 'Excerpt must not exceed 200 characters.' }).optional(),
  content: z.string().optional(),
  tags: z.string()
});

export type BlogFormValues = z.infer<typeof blogFormSchema>;




export const editBlogFormSchema = z.object({
  id: z.string(),
  title: z.string().min(5, { message: 'Title must be at least 5 characters.' }),
  category: z.string(),
  excerpt: z
    .string()
    .min(5, { message: 'Excerpt must be at least 5 characters.' })
    .max(200, { message: 'Excerpt must not exceed 200 characters.' })
    .optional(),
  content: z.string().optional(),
  tags: z.string()
});

export type EditBlogFormValues = z.infer<typeof editBlogFormSchema>;

