'use client'

import type React from 'react';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { CheckCircle2, ImageIcon, UploadCloud, VideoIcon } from 'lucide-react';
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

import dynamic from 'next/dynamic';
import { Progress } from '../ui/progress';
import Upload from '../blog/upload';
import { toast } from 'sonner';

import { blogFormSchema, BlogFormValues } from '@/schema/blogSchema';

const JoditEditor = dynamic(() => import('jodit-react'), {
  ssr: false,
});

export interface MediaData {
  secure_url: string;
}

export function CreateBlogPost() {
  const [isSuccess, setIsSuccess] = useState(false);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImageError, setCoverImageError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);

  const [config, setConfig] = useState({
    toolbarAdaptive: false,
    readonly: false,
    toolbar: true,
    height: 500,
    width: 1200,
    spellcheck: true,
    theme: 'dark',
  });

  const editor = useRef(null);

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
  const watchKeywords = watch('tags'); // watch for preview if needed
  const watchCategory = watch('category');
  const watchContent = watch('content');

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
          tags: data.tags, // nullable
        }),
      });
      const result = await response.json();
      console.log('result', result);

      if (result.status === 201) {
        toast.success(result.message);
        setIsSuccess(true);

        methods.reset();
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
    if (data?.secure_url) {
      const tag =
        type === 'image'
          ? `<p><img src="${data.secure_url}" alt="image" /></p>`
          : `<p><video controls src="${data.secure_url}"></video></p>`;
      setValue('content', (watchContent || '') + tag);
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
        {/* If you want to display keywords in preview */}
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
                  render={({ field }) => (
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
                        placeholder="write shot description of the blog post"
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
                render={({}) => (
                  <FormItem>
                    <Tabs defaultValue="write" className="mt-1 max-w-5xl">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="write">Write</TabsTrigger>
                        <TabsTrigger value="preview">Preview</TabsTrigger>
                      </TabsList>
                      <TabsContent value="write">
                        {/* Editor Section */}
                        <Card className="overflow-hidden border-none shadow-lg bg-card/50 backdrop-blur-sm">
                          <CardContent className="p-0">
                            <div className="flex flex-col  h-full">
                              {/* Media Upload Toolbar */}
                              <div className="flex  justify-start p-2 md:p-4 border-b md:border-b-0 md:border-r bg-muted/30">
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
                                    className="justify-start gap-2"
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
                                    className="justify-start gap-2"
                                    disabled={isUploading}
                                  >
                                    <VideoIcon className="w-4 h-4" />
                                    <span className="hidden md:inline">
                                      Video
                                    </span>
                                  </Button>
                                </Upload>
                              </div>

                              {/* Jodit Editor using Controller */}
                              <div className="flex w-80 md:w-full">
                                <Controller
                                  name="content"
                                  control={methods.control}
                                  render={({ field }) => (
                                    <JoditEditor
                                      config={config}
                                      ref={editor}
                                      className="h-[400px] md:h-[500px] w-full"
                                      value={field.value}
                                      onChange={field.onChange}
                                    />
                                  )}
                                />
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
                          <div className="space-y-2">
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
            <Button variant="outline" onClick={() => methods.reset()}>
              Reset
            </Button>

            <Button type="submit" disabled={!isValid || isSubmitting}>
              {isSubmitting ? 'Publishing…' : 'Publish Post'}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter></CardFooter>
    </Card>
  );
}
