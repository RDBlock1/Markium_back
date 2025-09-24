// components/auto-indexing-provider.tsx
'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { indexingQueue, generateFullUrl } from '@/lib/indexing-utils';

interface AutoIndexingProviderProps {
  children: React.ReactNode;
  enabled?: boolean;
  excludePaths?: string[];
  includePaths?: string[];
}

export function AutoIndexingProvider({ 
  children, 
  enabled = true,
  excludePaths = ['/admin', '/api', '/_next', '/auth', '/login', '/signup'],
  includePaths = []
}: AutoIndexingProviderProps) {
  const pathname = usePathname();

  useEffect(() => {
    if (!enabled) return;

    // Check if current path should be indexed
    const shouldIndex = shouldIndexPath(pathname, excludePaths, includePaths);

    if (shouldIndex) {
      // Generate full URL and add to indexing queue
      const url = generateFullUrl(pathname);
      
      // Add to queue with a small delay to ensure page is fully loaded
      const timeoutId = setTimeout(() => {
        indexingQueue.add({ 
          url, 
          type: 'URL_UPDATED',
          priority: 'normal'
        });
        
        console.log(`[AutoIndexing] Added to queue: ${url}`);
      }, 2000); // 2 second delay

      return () => clearTimeout(timeoutId);
    }
  }, [pathname, enabled, excludePaths, includePaths]);

  return <>{children}</>;
}

// Helper function to determine if a path should be indexed
function shouldIndexPath(
  pathname: string, 
  excludePaths: string[], 
  includePaths: string[]
): boolean {
  // Check exclude patterns first
  for (const pattern of excludePaths) {
    if (pathname.startsWith(pattern)) {
      console.log(`[AutoIndexing] Skipping excluded path: ${pathname}`);
      return false;
    }
  }

  // If include paths are specified, pathname must match one of them
  if (includePaths.length > 0) {
    for (const pattern of includePaths) {
      if (pathname.startsWith(pattern)) {
        return true;
      }
    }
    console.log(`[AutoIndexing] Path not in include list: ${pathname}`);
    return false;
  }

  // Default to true if no include paths specified and not excluded
  return true;
}