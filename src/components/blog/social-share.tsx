'use client';

import { motion } from 'framer-motion';
import { Facebook, Twitter, Linkedin, Mail, LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner'

type SocialShareProps = {
  title: string;
  url: string;
  className?: string;
};

export default function SocialShare({
  title,
  url,
  className = '',
}: SocialShareProps) {
  const encodedTitle = encodeURIComponent(title);
  const encodedUrl = encodeURIComponent(url);

  const shareLinks = [
    {
      name: 'Facebook',
      icon: <Facebook className="h-5 w-5" />,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      color: 'bg-[#1877F2] hover:bg-[#0E65D9] text-white',
    },
    {
      name: 'Twitter',
      icon: <Twitter className="h-5 w-5" />,
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      color: 'bg-[#1DA1F2] hover:bg-[#0C85D0] text-white',
    },
    {
      name: 'LinkedIn',
      icon: <Linkedin className="h-5 w-5" />,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      color: 'bg-[#0A66C2] hover:bg-[#084E96] text-white',
    },
    {
      name: 'Email',
      icon: <Mail className="h-5 w-5" />,
      href: `mailto:?subject=${encodedTitle}&body=${encodedUrl}`,
      color: 'bg-gray-600 hover:bg-gray-700 text-white',
    },
  ];

  const copyToClipboard = () => {
    navigator.clipboard.writeText(url);
    toast( 'Link copied!',{
      description: 'The article link has been copied to your clipboard.',
      duration: 3000,
    });
  };

  return (
    <motion.div
      className={`${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4, duration: 0.5 }}
    >
      <h3 className="text-lg font-medium mb-3">Share this article</h3>
      <div className="flex flex-wrap gap-2">
        {shareLinks.map((link) => (
          <Button
            key={link.name}
            variant="outline"
            size="sm"
            className={link.color}
            onClick={() => window.open(link.href, '_blank')}
            aria-label={`Share on ${link.name}`}
          >
            {link.icon}
            <span className="ml-2 hidden sm:inline">{link.name}</span>
          </Button>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={copyToClipboard}
          aria-label="Copy link"
        >
          <LinkIcon className="h-5 w-5" />
          <span className="ml-2 hidden sm:inline">Copy Link</span>
        </Button>
      </div>
    </motion.div>
  );
}
