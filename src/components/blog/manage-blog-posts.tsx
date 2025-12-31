'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Edit, Eye, MoreHorizontal, Search, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EditBlogPostDialog } from './edit-blog-post-dialog';
import { ViewBlogPostDialog } from './view-blog-post.dialog';

import { EditBlogFormValues } from '@/schema/blogSchema';
import { toast } from 'sonner';
import { BlogPost } from '@/generated/prisma/client';

type Props = {
  blogPosts: BlogPost[];
};

export function ManageBlogPosts(props: Props) {
  const { blogPosts } = props;
  const [posts, setPosts] = useState(blogPosts);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPost, setSelectedPost] = useState<
    (typeof blogPosts)[0] | null
  >(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const filteredPosts = posts.filter((post) => {
    const searchString = `${post.title} ${post.tags}}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch('/api/blog', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();
      console.log('deleted data',data);
      if (data) {
        toast.success(data.message);

        setPosts(posts.filter((post) => post.id !== id));
        setIsDeleteDialogOpen(false);
      } else {
        toast.error(data.error);
        setIsDeleteDialogOpen(false);
      }
    } catch (error) {
      console.log('Error deleting post:', error);
      toast.error('Unable to delete post');
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  const handleEdit = (updatedPost: EditBlogFormValues) => {
    setPosts(
      posts.map((post) =>
        post.id === updatedPost.id ? { ...post, ...updatedPost } : post
      )
    );
    setIsEditOpen(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Blog Posts</CardTitle>
          <CardDescription>
            View, edit, and manage all blog posts. Use the search to filter
            posts.
          </CardDescription>
          <div className="flex items-center mt-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search posts..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Published Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPosts.length > 0 ? (
                  filteredPosts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell className="font-medium">
                        {post.title}
                      </TableCell>
                      {/* <TableCell>{post.tags}</TableCell> */}

                      <TableCell>
                        {post.createdAt.toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedPost(post);
                                setIsViewOpen(true);
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Post
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedPost(post);
                                setIsEditOpen(true);
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Post
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => {
                                setSelectedPost(post);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Post
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No posts found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* View Post Dialog */}
      {selectedPost && (
        <ViewBlogPostDialog
          post={selectedPost}
          open={isViewOpen}
          onOpenChange={setIsViewOpen}
        />
      )}

      {/* Edit Post Dialog */}
      {selectedPost && (
        <EditBlogPostDialog
          post={selectedPost}
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          onSave={handleEdit}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the blog post &quot;
              {selectedPost?.title}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedPost && handleDelete(selectedPost.id)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
