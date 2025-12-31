/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import type React from 'react';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  LogOutIcon,
  Menu,
  MoreVerticalIcon,
  PenSquare,
  Shield,
  X,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ManageBlogPosts } from '@/components/blog/manage-blog-posts';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useIsMobile } from '@/hooks/use-mobile';
import {  signOut } from "@/lib/auth-client";
import {  BlogPost } from '@/generated/prisma/client';

import { CreateBlogPost } from '@/components/blog/create-blog-post';


type Props = {
    username: string | null;
    email: string | null;
    profileImage: string| null;
    blogPosts: BlogPost[] | null;
    session:any
}

export default function AdminDashboardSectiion(props:Props) {
   const [isSidebarOpen, setIsSidebarOpen] = useState(false);
   const [activeTab, setActiveTab] = useState('blog');
   const [activeBlogTab, setActiveBlogTab] = useState('blog-create');
   const {username, email, profileImage} = props
   const isMobile = useIsMobile()

   const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
   };



  const handleLogout = async() => {
    // Handle logout logic here
    console.log('Logging out...');
     await signOut();

  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile sidebar toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={toggleSidebar}
      >
        {isSidebarOpen ? <X /> : <Menu />}
      </Button>

      {/* Sidebar */}
      <motion.div
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 bg-card border-r shadow-sm',
          isMobile
            ? isSidebarOpen
              ? 'translate-x-0'
              : '-translate-x-full'
            : 'md:relative md:translate-x-0'
        )}
        initial={false}
        animate={{
          x: isSidebarOpen || !isMobile ? 0 : -256,
          transition: { duration: 0.2, ease: 'easeInOut' },
        }}
      >
        <div className="flex flex-col h-full">
       
          <nav className="flex-1 p-4 space-y-2">
            <SidebarItem
              icon={PenSquare}
              label="Blog Management"
              active={activeTab === 'blog'}
              onClick={() => setActiveTab('blog')}
            />
          </nav>

          <div className="mx-auto ml-4 mb-5 mt-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex">
                  <Avatar className=" rounded-full">
                    <AvatarImage
                      src={profileImage ? profileImage : '/avatars/shadcn.jpg'}
                      alt={username || 'user_img'}
                    />
                    <AvatarFallback>
                      {username?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <div className="flex gap-x-4">
                      <span className="truncate font-medium">
                        {username || ''}
                      </span>
                    </div>
                    <span className="truncate text-xs text-muted-foreground">
                      {email || ''}
                    </span>
                  </div>
                  <MoreVerticalIcon className="mt-3 ml-2 size-4" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side={isMobile ? 'bottom' : 'right'}
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage
                        src={
                          profileImage ? profileImage : '/avatars/shadcn.jpg'
                        }
                        alt={username || 'user_img'}
                      />
                      <AvatarFallback className="rounded-lg">
                        {username?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">
                        {username || ''}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {email || ''}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOutIcon />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </motion.div>

      {/* Main content */}
      <motion.div
        className="flex-1 p-4 md:p-8 overflow-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="max-w-6xl mx-auto">
          <header className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold">
              Welcome, {username || 'Admin'}
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your  blog posts
            </p>
          </header>

          {activeTab === 'blog' && (
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <Tabs
                defaultValue="blog-create"
                onValueChange={setActiveBlogTab}
                value={activeBlogTab}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Blog Management</h2>
                  <TabsList className="bg-zinc-900 border border-zinc-800 shadow-lg w-fit mb-6 gap-x-8 mx-2">
                    <TabsTrigger value="blog-create" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-cyan-400 data-[state=active]:shadow-lg font-semibold text-gray-300"
>Create Blog</TabsTrigger>
                    <TabsTrigger value="blog-manage" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-cyan-400 data-[state=active]:shadow-lg font-semibold text-gray-300"
>Manage Blogs</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="blog-create" className="space-y-4 mt-4">
                  <CreateBlogPost />
                </TabsContent>

                <TabsContent value="blog-manage" className="space-y-4 mt-4">
                  {props.blogPosts && props.blogPosts.length > 0 ? (
                    <ManageBlogPosts blogPosts={props.blogPosts} />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-64">
                      <p className="text-muted-foreground text-2xl">
                        No blog posts available.
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

function SidebarItem({ icon: Icon, label, active, onClick }: SidebarItemProps) {
  return (
    <motion.div
      whileHover={{ x: 5 }}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer',
        active ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
      )}
      onClick={onClick}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </motion.div>
  );
}
