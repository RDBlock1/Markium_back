
import { IndexingType } from './google-indexing';

export interface IndexingOptions {
  url?: string;
  type?: IndexingType;
  priority?: 'high' | 'normal' | 'low';
}

export interface IndexingQueueItem extends IndexingOptions {
  timestamp: number;
  retryCount: number;
}

// Client-side function to request indexing through API
export async function requestIndexing(
  url: string,
  type: IndexingType = 'URL_UPDATED'
): Promise<{ success: boolean; message: string; error?: string }> {
  try {
    const response = await fetch('/api/indexing', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url, type }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error requesting indexing:', error);
    return {
      success: false,
      message: 'Failed to request indexing',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Client-side function to request batch indexing
export async function requestBatchIndexing(
  urls: string[],
  type: IndexingType = 'URL_UPDATED',
  delayMs: number = 1000
): Promise<any> {
  try {
    const response = await fetch('/api/indexing', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ urls, type, delayMs }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error requesting batch indexing:', error);
    return {
      success: false,
      message: 'Failed to request batch indexing',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Client-side function to check indexing status
export async function checkIndexingStatus(
  url: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const response = await fetch(`/api/indexing?url=${encodeURIComponent(url)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error checking indexing status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Generate full URL from pathname
export function generateFullUrl(pathname: string, baseUrl?: string): string {
  const base = baseUrl || process.env.NEXT_PUBLIC_SITE_URL || 'https://markiumpro.com';
  const cleanBase = base.replace(/\/$/, '');
  const cleanPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${cleanBase}${cleanPath}`;
}

// Parse sitemap and get URLs for indexing
export async function getSitemapUrls(sitemapUrl: string): Promise<string[]> {
  try {
    const response = await fetch(sitemapUrl);
    const text = await response.text();
    
    // Simple XML parsing for sitemap
    const urlRegex = /<loc>(.*?)<\/loc>/g;
    const urls: string[] = [];
    let match;
    
    while ((match = urlRegex.exec(text)) !== null) {
      urls.push(match[1]);
    }
    
    return urls;
  } catch (error) {
    console.error('Error fetching sitemap:', error);
    return [];
  }
}

// Check if URL should be indexed based on patterns
export function shouldIndexUrl(url: string, patterns?: {
  include?: RegExp[];
  exclude?: RegExp[];
}): boolean {
  // Default exclude patterns
  const defaultExclude = [
    /\/api\//,
    /\/admin\//,
    /\/private\//,
    /\/_next\//,
    /\.xml$/,
    /\.txt$/,
  ];
  
  const excludePatterns = patterns?.exclude || defaultExclude;
  const includePatterns = patterns?.include || [];
  
  // Check exclude patterns
  for (const pattern of excludePatterns) {
    if (pattern.test(url)) {
      return false;
    }
  }
  
  // If include patterns are specified, URL must match at least one
  if (includePatterns.length > 0) {
    return includePatterns.some(pattern => pattern.test(url));
  }
  
  // Default to true if no include patterns specified
  return true;
}

// Queue manager for indexing requests (to handle rate limiting)
export class IndexingQueue {
  private queue: IndexingQueueItem[] = [];
  private processing = false;
  private maxRetries = 3;
  private retryDelay = 5000; // 5 seconds
  
  add(item: IndexingOptions): void {
    this.queue.push({
      ...item,
      timestamp: Date.now(),
      retryCount: 0,
    });
    
    if (!this.processing) {
      this.process();
    }
  }
  
  async process(): Promise<void> {
    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }
    
    this.processing = true;
    const item = this.queue.shift();
    
    if (!item || !item.url) {
      this.process();
      return;
    }
    
    try {
      const result = await requestIndexing(item.url, item.type || 'URL_UPDATED');
      
      if (!result.success && item.retryCount < this.maxRetries) {
        // Retry with exponential backoff
        item.retryCount++;
        setTimeout(() => {
          this.queue.push(item);
        }, this.retryDelay * Math.pow(2, item.retryCount));
      }
    } catch (error) {
      console.error('Queue processing error:', error);
      
      if (item.retryCount < this.maxRetries) {
        item.retryCount++;
        setTimeout(() => {
          this.queue.push(item);
        }, this.retryDelay * Math.pow(2, item.retryCount));
      }
    }
    
    // Process next item after a delay to avoid rate limiting
    setTimeout(() => {
      this.process();
    }, 1000);
  }
  
  getQueueSize(): number {
    return this.queue.length;
  }
  
  clearQueue(): void {
    this.queue = [];
  }
}

// Create a singleton instance of the queue
export const indexingQueue = new IndexingQueue();