/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import type React from 'react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import {
  CheckCircle2,
  ImageIcon,
  VideoIcon,
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Code,
  Heading2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '../ui/progress';
import Upload from '../blog/upload';
import { toast } from 'sonner';
import { blogFormSchema, BlogFormValues } from '@/schema/blogSchema';

// Tiptap imports
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';

const lowlight = createLowlight(common);

export interface MediaData {
  secure_url: string;
}

// Tiptap Toolbar Component
const TiptapToolbar = ({ editor }: { editor: any }) => {
  if (!editor) return null;

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b bg-muted/30">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={editor.isActive('bold') ? 'bg-muted' : ''}
      >
        <Bold className="w-4 h-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={editor.isActive('italic') ? 'bg-muted' : ''}
      >
        <Italic className="w-4 h-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={editor.isActive('heading', { level: 2 }) ? 'bg-muted' : ''}
      >
        <Heading2 className="w-4 h-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={editor.isActive('bulletList') ? 'bg-muted' : ''}
      >
        <List className="w-4 h-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={editor.isActive('orderedList') ? 'bg-muted' : ''}
      >
        <ListOrdered className="w-4 h-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={editor.isActive('blockquote') ? 'bg-muted' : ''}
      >
        <Quote className="w-4 h-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={editor.isActive('codeBlock') ? 'bg-muted' : ''}
      >
        <Code className="w-4 h-4" />
      </Button>
      <div className="w-px h-6 bg-border mx-1" />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
      >
        <Undo className="w-4 h-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
      >
        <Redo className="w-4 h-4" />
      </Button>
    </div>
  );
};

export function CreateBlogPost() {
  const [isSuccess, setIsSuccess] = useState(false);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImageError, setCoverImageError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);

  const methods = useForm<BlogFormValues>({
    resolver: zodResolver(blogFormSchema),
    defaultValues: {
      title: '',
      excerpt: '',
      tags: '',
      category: '',
      content: '',
    },
    mode: 'onChange',
  });

  const {
    setValue,
    watch,
    formState: { errors, isValid, isSubmitting },
  } = methods;

  // Watch fields for the preview
  const watchTitle = watch('title');
  const watchDesc = watch('excerpt');
  const watchKeywords = watch('tags');
  const watchCategory = watch('category');
  const watchContent = watch('content');

  // Initialize Tiptap Editor
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline',
        },
      }),
      Placeholder.configure({
        placeholder: 'Start writing your blog post...',
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
    ],
    content: watchContent || '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg dark:prose-invert focus:outline-none max-w-none p-4 min-h-[400px]',
      },
      // Handle paste with images
      handlePaste: (view, event, slice) => {
        const items = Array.from(event.clipboardData?.items || []);

        for (const item of items) {
          if (item.type.indexOf('image') === 0) {
            event.preventDefault();
            const file = item.getAsFile();
            if (file) {
              const reader = new FileReader();
              reader.onload = (e) => {
                const img = e.target?.result as string;
                editor?.chain().focus().setImage({ src: img }).run();
              };
              reader.readAsDataURL(file);
            }
            return true;
          }
        }
        return false;
      },
      // Handle drop with images
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer?.files && event.dataTransfer.files[0]) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith('image/')) {
            event.preventDefault();
            const reader = new FileReader();
            reader.onload = (e) => {
              const img = e.target?.result as string;
              const { schema } = view.state;
              const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
              const node = schema.nodes.image.create({ src: img });
              const transaction = view.state.tr.insert(coordinates?.pos || 0, node);
              view.dispatch(transaction);
            };
            reader.readAsDataURL(file);
            return true;
          }
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setValue('content', html, { shouldValidate: true });
    },
  });

  const onSubmit = async (data: BlogFormValues) => {
    console.log('Submitting form with data:', data);

    try {
      const response = await fetch('/api/blog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: data.title,
          category: data.category,
          excerpt: data.excerpt,
          content: data.content,
          tags: data.tags,
        }),
      });
      const result = await response.json();
      console.log('result', result);

      if (result.status === 201) {
        toast.success(result.message);
        setIsSuccess(true);
        methods.reset();
        editor?.commands.setContent('');
        setCoverImageFile(null);
        setCoverImageError(null);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Error submitting form. Please try again.');
    } finally {
      setCoverImageFile(null);
      setCoverImageError(null);
    }
  };

  const handleMediaUpload = (
    data: MediaData | null,
    type: 'image' | 'video'
  ) => {
    if (data?.secure_url && editor) {
      if (type === 'image') {
        editor.chain().focus().setImage({ src: data.secure_url }).run();
      } else {
        // For video, insert HTML directly
        const videoHTML = `<video controls src="${data.secure_url}" class="rounded-lg max-w-full"></video>`;
        editor.chain().focus().insertContent(videoHTML).run();
      }
    }
  };

  const isUploading = progress > 0 && progress < 100;

  const Preview = () => (
    <div className="relative h-full mt-14">
      <div className="p-8 prose prose-lg dark:prose-invert max-w-none">
        <h1>{watchTitle || 'Untitled Post'}</h1>
        {watchDesc && (
          <p className="lead text-xl text-muted-foreground">{watchDesc}</p>
        )}
        <div dangerouslySetInnerHTML={{ __html: watchContent || '' }} />
        {watchCategory && (
          <p className="mt-4 italic text-sm text-muted-foreground">
            <strong>Category:</strong> {watchCategory}
          </p>
        )}
        {watchKeywords && (
          <p className="mt-4 italic text-sm text-muted-foreground">
            <strong>Keywords:</strong> {watchKeywords}
          </p>
        )}
      </div>
    </div>
  );

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-lg border bg-card text-card-foreground shadow-sm p-6"
      >
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
          <h3 className="text-2xl font-semibold mb-2">Blog Post Created</h3>
          <p className="text-muted-foreground mb-6">
            Your blog post has been successfully created.
          </p>
          <Button onClick={() => setIsSuccess(false)}>
            Create Another Post
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Blog Post</CardTitle>
        <CardDescription>
          Create a new blog post for your audience. Fill in all the required
          fields.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={methods.control}
                  name="title"
                  render={({ field }:any) => (
                    <FormItem>
                      <FormLabel>Blog Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter blog title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={methods.control}
                  name="category"
                  render={({ field }: any) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select blog category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="blockchain">Blockchain</SelectItem>
                          <SelectItem value="security">Security</SelectItem>
                          <SelectItem value="audit">Audit</SelectItem>
                          <SelectItem value="defi">DeFi</SelectItem>
                          <SelectItem value="nft">NFT</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={methods.control}
                name="excerpt"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="write short description of the blog post"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      A short description of the blog post.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={methods.control}
                name="tags"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel>Tags (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="blockchain, security, audit (comma separated)"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Add tags to help categorize your blog post.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={methods.control}
                name="content"
                render={({ }) => (
                  <FormItem>
                    <Tabs defaultValue="write" className="mt-1 w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="write">Write</TabsTrigger>
                        <TabsTrigger value="preview">Preview</TabsTrigger>
                      </TabsList>
                      <TabsContent value="write">
                        <Card className="overflow-hidden border shadow-lg bg-card/50 backdrop-blur-sm">
                          <CardContent className="p-0">
                            <div className="flex flex-col h-full">
                              {/* Media Upload & Toolbar */}
                              <div className="flex flex-wrap items-center justify-between gap-2 p-2 border-b bg-muted/30">
                                <div className="flex gap-1">
                                  <Upload
                                    type="image"
                                    setProgress={setProgress}
                                    setData={(data) =>
                                      handleMediaUpload(data, 'image')
                                    }
                                  >
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      type="button"
                                      className="gap-2"
                                      disabled={isUploading}
                                    >
                                      <ImageIcon className="w-4 h-4" />
                                      <span className="hidden md:inline">
                                        Image
                                      </span>
                                    </Button>
                                  </Upload>
                                  <Upload
                                    type="video"
                                    setProgress={setProgress}
                                    setData={(data) =>
                                      handleMediaUpload(data, 'video')
                                    }
                                  >
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      type="button"
                                      className="gap-2"
                                      disabled={isUploading}
                                    >
                                      <VideoIcon className="w-4 h-4" />
                                      <span className="hidden md:inline">
                                        Video
                                      </span>
                                    </Button>
                                  </Upload>
                                </div>
                              </div>

                              {/* Tiptap Toolbar */}
                              <TiptapToolbar editor={editor} />

                              {/* Tiptap Editor */}
                              <div className="w-full bg-background">
                                <EditorContent editor={editor} />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        {errors.content && (
                          <p className="mt-1 text-sm text-red-500">
                            {errors.content.message}
                          </p>
                        )}

                        {/* Upload Progress */}
                        {isUploading && (
                          <div className="space-y-2 mt-4">
                            <Progress value={progress} className="h-1" />
                            <p className="text-sm text-muted-foreground text-center">
                              Uploading... {progress}%
                            </p>
                          </div>
                        )}
                        <FormMessage />
                      </TabsContent>
                      <TabsContent value="preview">
                        <Preview />
                      </TabsContent>
                    </Tabs>
                  </FormItem>
                )}
              />
            </motion.div>
            <div className="flex gap-4">
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  methods.reset();
                  editor?.commands.setContent('');
                }}
              >
                Reset
              </Button>

              <Button type="submit" disabled={!isValid || isSubmitting}>
                {isSubmitting ? 'Publishing…' : 'Publish Post'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
      <CardFooter></CardFooter>
    </Card>
  );
}