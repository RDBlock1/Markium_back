/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

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
import { BlogPost } from '@/generated/prisma/client';
import Upload from '../blog/upload';
import {
  ImageIcon,
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
import { MediaData } from './create-blog-post';
import { Progress } from '../ui/progress';
import { toast } from 'sonner';
import { editBlogFormSchema, EditBlogFormValues } from '@/schema/blogSchema';

// Tiptap imports
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';

const lowlight = createLowlight(common);

interface EditBlogPostDialogProps {
  post: BlogPost;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (post: EditBlogFormValues) => void;
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

  const isUploading = progress > 0 && progress < 100;

  const form = useForm<EditBlogFormValues>({
    resolver: zodResolver(editBlogFormSchema),
    defaultValues: {
      id: post.id,
      title: post.title,
      category: post.tagsArray?.[0] || '', // Use first tag as category
      excerpt: post.description || '', // Use description as excerpt
      content: post.content,
      tags: post.tags || '', // Keep existing tags field
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
        placeholder: 'Start editing your blog post...',
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
    ],
    content: post.content || '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose dark:prose-invert focus:outline-none max-w-none p-4 min-h-[300px]',
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

  // Update editor content when dialog opens with new post
  useEffect(() => {
    if (open && editor && post.content) {
      editor.commands.setContent(post.content);
    }
  }, [open, post.content, editor]);

  const handleSubmit = async (data: EditBlogFormValues) => {
    try {
      console.log('Submitting form:', data);

      const response = await fetch('/api/blog', {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      console.log('result', result);

      if (result.post) {
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
        const videoHTML = `<video controls src="${data.secure_url}" class="rounded-lg max-w-full"></video>`;
        editor.chain().focus().insertContent(videoHTML).run();
      }
    }
  };

  const Preview = () => (
    <div className="relative h-full mt-4">
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

  return (
    <div className="w-full">
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-fit h-[90vh] overflow-y-auto">
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
                              {/* Media Upload Toolbar */}
                              <div className="flex justify-start p-2 border-b bg-muted/30">
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