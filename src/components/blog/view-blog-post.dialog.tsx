'use client';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { BlogPost } from '@/generated/prisma/client';

interface ViewBlogPostDialogProps {
  post: BlogPost,
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ViewBlogPostDialog({
  post,
  open,
  onOpenChange,
}: ViewBlogPostDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] overflow-scroll h-[90vh]">
        <DialogHeader>
          <DialogTitle>Blog Post Preview</DialogTitle>
          <DialogDescription>
            Preview of your blog post as it will appear to readers.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <h3 className="text-xl font-bold">{post.title}</h3>

            <div className="flex items-center gap-2 mt-1">
              <Badge>{post.tagsArray[0] || ''}</Badge>
              <span className="text-sm text-muted-foreground">
                {format(post.createdAt, 'MMMM d, yyyy')}
              </span>
            </div>
          </div>

          <Separator />

  

          <div>
            <h4 className="text-sm font-medium text-muted-foreground">Tags</h4>
            <div className="flex flex-wrap gap-1 mt-1">
                {(post.tags ?? '').split(',').map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag.trim()}
                </Badge>
                ))}
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="text-sm font-medium text-muted-foreground">
              Content
            </h4>
            <div className="prose max-w-none mt-2 text-sm">
              <div
                dangerouslySetInnerHTML={{
                  __html: post.content.replace(/\n/g, '<br/>'),
                }}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
