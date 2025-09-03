'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

type BackButtonProps = {
  href: string;
  label: string;
  className?: string;
};

export default function BackButton({
  href,
  label,
  className = '',
}: BackButtonProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <Button variant="ghost" size="sm" asChild>
        <Link href={href} className="flex items-center">
          <ChevronLeft className="h-4 w-4 mr-1" />
          {label}
        </Link>
      </Button>
    </motion.div>
  );
}
