/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { BlogPost } from '@prisma/client';
import Upload from '../blog/upload';
import { ImageIcon, UploadCloud } from 'lucide-react';
import dynamic from 'next/dynamic';
import { MediaData } from './create-blog-post';
import { Progress } from '../ui/progress';
import Image from 'next/image';
import { toast } from 'sonner';
import { editBlogFormSchema, EditBlogFormValues } from '@/schema/blogSchema';
import { cn } from '@/lib/utils';
import axios from 'axios';
const JoditEditor = dynamic(() => import('jodit-react'), {
  ssr: false,
});

interface EditBlogPostDialogProps {
  post: BlogPost;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (post: EditBlogFormValues) => void;
}

export function EditBlogPostDialog({
  post,
  open,
  onOpenChange,
  onSave,
}: EditBlogPostDialogProps) {
  const [progress, setProgress] = useState<number>(0);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImageError, setCoverImageError] = useState<string | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);

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
  const isUploading = progress > 0 && progress < 100;

  const form = useForm<EditBlogFormValues>({
    resolver: zodResolver(editBlogFormSchema),
    defaultValues: {
      id: post.id,
      title: post.title,
      category: post.category,
      excerpt: post.excerpt!,
      content: post.content,
      tags: post.tags!,
    },
  });
  const {
    setValue,
    watch,
    formState: { errors, isValid, isSubmitting },
  } = form;

  // Watch fields for the preview
  const watchTitle = watch('title');
  const watchDesc = watch('excerpt');
  const watchKeywords = watch('tags'); // watch for preview if needed
  const watchCategory = watch('category');
  const watchContent = watch('content');


  const handleSubmit = async (data: EditBlogFormValues) => {
    try {
      console.log('Submitting form:', data);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      //update
      const response = await fetch('/api/blog', {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      console.log('result',result)
      if (result.status === 200) {
        toast.success('Post updated successfully');
        onSave({
          ...data,
          tags: data.tags ? data.tags.split(',').map((tag) => tag.trim()) : [],
        } as any);
        onOpenChange(false);
      } else {
        toast.error(result.error);
        console.error('Error updating post:', result.error);
      }
    } catch (error) {
      console.error('Error updating post:', error);
      toast.error('Error updating post');
    } finally {
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

  return (
    <div className="w-full">
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-fit  h-[90vh] overflow-scroll">
          <DialogHeader>
            <DialogTitle>Edit Blog Post</DialogTitle>
            <DialogDescription>
              Make changes to your blog post. Click save when you&apos;re done.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Blog Title</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
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
                control={form.control}
                name="excerpt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Short Description</FormLabel>
                    <FormControl>
                      <Textarea className="resize-none" rows={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags (Comma Separated)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
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
                              </div>

                              {/* Jodit Editor using Controller */}
                              <div className="flex w-80 md:w-full">
                                <Controller
                                  name="content"
                                  control={form.control}
                                  render={({ field }) => (
                                    <JoditEditor
                                      config={config}
                                      ref={editor}
                                      className="h-[400px] md:h-[500px] w-full "
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

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={!isValid || isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
