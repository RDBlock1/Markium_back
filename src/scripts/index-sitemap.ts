// src/scripts/index-sitemap.ts
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { google } from 'googleapis';
import * as zlib from 'zlib';
import * as cheerio from 'cheerio';

// Load environment variables - try multiple possible locations
const possibleEnvFiles = ['.env.local', '.env'];
for (const envFile of possibleEnvFiles) {
  const envPath = path.resolve(process.cwd(), envFile);
  if (fs.existsSync(envPath)) {
    console.log('Loading env from:', envPath);
    dotenv.config({ path: envPath });
    break;
  }
}

// Debug: Check if env variables are loaded
console.log('Environment check:');
console.log('GOOGLE_CLIENT_EMAIL exists:', !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_EMAIL);
console.log('GOOGLE_PRIVATE_KEY exists:', !!process.env.NEXT_PUBLIC_GOOGLE_PRIVATE_KEY);
console.log('NEXT_PUBLIC_SITE_URL:', process.env.NEXT_PUBLIC_SITE_URL);

interface IndexingSitemapOptions {
  sitemapUrl?: string;
  sitemapUrls?: string[]; // NEW: Support multiple sitemap URLs
  batchSize?: number;
  delayMs?: number;
  dryRun?: boolean;
  includePatterns?: string[];
  excludePatterns?: string[];
  logFile?: string;
  crawlFallback?: boolean;
  crawlMaxPages?: number;
  crawlConcurrency?: number;
  checkAllSitemaps?: boolean; // NEW: Check for common sitemap patterns
}

// Simple validation function
function validateCredentials(): boolean {
  return !!(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_EMAIL && process.env.NEXT_PUBLIC_GOOGLE_PRIVATE_KEY);
}

// Initialize Google Auth
function getAuthClient() {
  if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_EMAIL || !process.env.NEXT_PUBLIC_GOOGLE_PRIVATE_KEY) {
    throw new Error('Missing Google credentials');
  }

  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_EMAIL,
      private_key: process.env.NEXT_PUBLIC_GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/indexing'],
  });
}

// Submit URLs for indexing
async function submitUrlForIndexing(url: string, type: 'URL_UPDATED' | 'URL_DELETED' = 'URL_UPDATED') {
  try {
    const auth = getAuthClient();
    const indexing = google.indexing({
      version: 'v3',
      auth: auth,
    });

    const response = await indexing.urlNotifications.publish({
      requestBody: {
        url: url,
        type: type,
      },
    });

    return {
      success: true,
      url,
      message: `Successfully submitted ${url}`,
      data: response.data,
    };
  } catch (error: any) {
    return {
      success: false,
      url,
      message: `Failed to submit ${url}`,
      error: error.message || error,
    };
  }
}

// Submit batch URLs
async function submitBatchUrls(urls: string[], type: 'URL_UPDATED' | 'URL_DELETED' = 'URL_UPDATED', delayMs: number = 1000) {
  const results = [];
  
  for (const url of urls) {
    const result = await submitUrlForIndexing(url, type);
    results.push(result);
    
    // Add delay between requests to avoid rate limiting
    if (urls.indexOf(url) < urls.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  return results;
}

/**
 * Check if a sitemap exists at a given URL
 */
async function sitemapExists(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return res.ok && (
      res.headers.get('content-type')?.includes('xml') ||
      url.endsWith('.xml') ||
      url.endsWith('.xml.gz')
    );
  } catch {
    return false;
  }
}

/**
 * Auto-detect common sitemap URLs
 */
async function detectSitemapUrls(baseUrl: string): Promise<string[]> {
  const commonSitemapPaths = [
    '/sitemap.xml',
    '/sitemap_index.xml',
    '/server-sitemap.xml',    // Your server-generated sitemap
    '/sitemap-0.xml',
    '/sitemap-1.xml',
    '/news-sitemap.xml',
    '/image-sitemap.xml',
    '/video-sitemap.xml',
    '/sitemap.xml.gz',
    '/server-sitemap.xml.gz',
  ];

  const detectedUrls: string[] = [];
  
  console.log('Auto-detecting sitemaps...');
  
  for (const path of commonSitemapPaths) {
    const url = new URL(path, baseUrl).toString();
    const exists = await sitemapExists(url);
    if (exists) {
      console.log(`  ✓ Found: ${url}`);
      detectedUrls.push(url);
    }
  }

  // Also check robots.txt for sitemap references
  try {
    const robotsUrl = new URL('/robots.txt', baseUrl).toString();
    const robotsRes = await fetch(robotsUrl);
    if (robotsRes.ok) {
      const robotsText = await robotsRes.text();
      const sitemapMatches = robotsText.match(/^Sitemap:\s*(.+)$/gim);
      if (sitemapMatches) {
        for (const match of sitemapMatches) {
          const sitemapUrl = match.replace(/^Sitemap:\s*/i, '').trim();
          if (sitemapUrl && !detectedUrls.includes(sitemapUrl)) {
            console.log(`  ✓ Found in robots.txt: ${sitemapUrl}`);
            detectedUrls.push(sitemapUrl);
          }
        }
      }
    }
  } catch {
    // Ignore robots.txt errors
  }

  return detectedUrls;
}

/**
 * Fetch text or decompress gzipped sitemap
 */
async function fetchTextOrDecompress(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);

  const contentEncoding = (res.headers.get('content-encoding') || '').toLowerCase();
  const isGzByHeader = contentEncoding.includes('gzip');
  const isGzByExt = url.toLowerCase().endsWith('.gz') || url.toLowerCase().endsWith('.xml.gz');

  const buffer = Buffer.from(await res.arrayBuffer());

  if (isGzByHeader || isGzByExt) {
    try {
      const decompressed = zlib.gunzipSync(buffer);
      return decompressed.toString('utf-8');
    } catch (e) {
      // Try inflate as fallback
      const inflated = zlib.inflateSync(buffer);
      return inflated.toString('utf-8');
    }
  }

  return buffer.toString('utf-8');
}

/**
 * Crawl sitemap index recursively and return all <loc> urls found in sitemaps
 * Now supports multiple root sitemaps
 */
async function getSitemapUrls(rootSitemapUrls: string | string[], maxDepth = 6): Promise<string[]> {
  const seenSitemaps = new Set<string>();
  const foundUrls = new Set<string>();
  
  // Normalize input to array
  const rootUrls = Array.isArray(rootSitemapUrls) ? rootSitemapUrls : [rootSitemapUrls];

  async function crawl(sitemapUrl: string, depth: number) {
    if (depth > maxDepth) return;
    if (seenSitemaps.has(sitemapUrl)) return;
    seenSitemaps.add(sitemapUrl);

    try {
      console.log(`Fetching sitemap: ${sitemapUrl}`);
      const text = await fetchTextOrDecompress(sitemapUrl);

      if (!text) return;

      // detect sitemapindex
      if (/<sitemapindex[\s>]/i.test(text)) {
        const sitemapLocRegex = /<loc>(.*?)<\/loc>/g;
        let m;
        while ((m = sitemapLocRegex.exec(text)) !== null) {
          const child = m[1].trim();
          if (child) await crawl(child, depth + 1);
        }
        return;
      }

      // Extract URL loc tags
      const urlRegex = /<loc>(.*?)<\/loc>/g;
      let match;
      while ((match = urlRegex.exec(text)) !== null) {
        const url = match[1].trim();
        if (url) foundUrls.add(url);
      }
    } catch (err: any) {
      console.warn(`Warning: failed to fetch/parse sitemap ${sitemapUrl}: ${err?.message || err}`);
    }
  }

  // Crawl all root sitemaps
  for (const rootUrl of rootUrls) {
    await crawl(rootUrl, 0);
  }

  return Array.from(foundUrls).sort();
}

/**
 * Simple BFS crawler to discover internal links
 */
async function crawlSiteForLinks(origin: string, startPath = '/', maxPages = 1000, concurrency = 5): Promise<string[]> {
  const toVisit: string[] = [new URL(startPath, origin).toString()];
  const visited = new Set<string>();
  const found = new Set<string>();

  async function fetchAndExtract(url: string) {
    try {
      const res = await fetch(url);
      if (!res.ok) return;
      const contentType = (res.headers.get('content-type') || '').toLowerCase();
      if (!contentType.includes('text/html')) return;

      const html = await res.text();
      const $ = cheerio.load(html);

      // mark canonical if present
      const canonical = $('link[rel="canonical"]').attr('href');
      if (canonical) {
        try { found.add(new URL(canonical, origin).toString()); } catch {}
      } else {
        found.add(url);
      }

      $('a[href]').each((_, el) => {
        const href = $(el).attr('href');
        if (!href) return;
        if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return;
        if (href.startsWith('#')) return;

        try {
          const absolute = new URL(href, origin);
          if (absolute.origin !== new URL(origin).origin) return;

          absolute.hash = '';
          const normalized = absolute.toString();
          if (!visited.has(normalized) && !toVisit.includes(normalized) && found.size + toVisit.length < maxPages) {
            toVisit.push(normalized);
          }
        } catch (e) {
          // Ignore invalid URLs
        }
      });

    } catch (err) {
      // ignore fetch errors
    }
  }

  // Simple concurrency-controlled BFS
  const workers: Promise<void>[] = [];
  while (toVisit.length > 0 && found.size < maxPages) {
    while (workers.length < concurrency && toVisit.length > 0 && found.size < maxPages) {
      const next = toVisit.shift()!;
      if (visited.has(next)) continue;
      visited.add(next);

      const p = fetchAndExtract(next);
      workers.push(p);
    }

    if (workers.length > 0) {
      await Promise.race(workers);
      for (let i = workers.length - 1; i >= 0; i--) {
        workers.splice(i, 1);
        break;
      }
    }
  }

  return Array.from(found).sort();
}

// Check if URL should be indexed
function shouldIndexUrl(url: string, patterns?: { include?: RegExp[]; exclude?: RegExp[] }): boolean {
  const defaultExclude = [
    /\/api\//,
    /\/admin\//,
    /\/_next\//,
    /\.txt$/,
  ];
  
  const excludePatterns = patterns?.exclude || defaultExclude;
  const includePatterns = patterns?.include || [];
  
  for (const pattern of excludePatterns) {
    if (pattern.test(url)) {
      return false;
    }
  }
  
  if (includePatterns.length > 0) {
    return includePatterns.some(pattern => pattern.test(url));
  }
  
  return true;
}

// Logger function
function log(message: string, logFile?: string): void {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  
  console.log(logMessage);
  
  if (logFile) {
    fs.appendFileSync(logFile, logMessage + '\n');
  }
}

// Main indexing function
async function indexSitemap(options: IndexingSitemapOptions = {}): Promise<void> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://markiumpro.com';
  
  const {
    sitemapUrl,
    sitemapUrls = [],
    batchSize = 10,
    delayMs = 1000,
    dryRun = false,
    includePatterns = [],
    excludePatterns = [],
    logFile = 'indexing-log.txt',
    crawlFallback = true,
    crawlMaxPages = 1000,
    crawlConcurrency = 5,
    checkAllSitemaps = true,
  } = options;

  log('Starting sitemap indexing process...', logFile);
  log(`Site URL: ${siteUrl}`, logFile);
  log(`Batch size: ${batchSize}`, logFile);
  log(`Delay between batches: ${delayMs}ms`, logFile);
  log(`Dry run: ${dryRun}`, logFile);
  log(`Crawl fallback enabled: ${crawlFallback}`, logFile);

  // Validate credentials
  if (!dryRun) {
    const credentialsValid = validateCredentials();
    log(`Credentials valid: ${credentialsValid}`, logFile);
    
    if (!credentialsValid) {
      log('Error: Google Indexing API credentials are not configured', logFile);
      log('GOOGLE_CLIENT_EMAIL: ' + (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_EMAIL ? 'Set' : 'Not set'), logFile);
      log('GOOGLE_PRIVATE_KEY: ' + (process.env.NEXT_PUBLIC_GOOGLE_PRIVATE_KEY ? `Set (${process.env.NEXT_PUBLIC_GOOGLE_PRIVATE_KEY.length} chars)` : 'Not set'), logFile);
      
      try {
        const testAuth = getAuthClient();
        log('Auth client created successfully', logFile);
      } catch (authError: any) {
        log(`Auth client error: ${authError.message}`, logFile);
      }
      
      process.exit(1);
    }
  }

  try {
    // Determine which sitemaps to use
    let sitemapsToProcess: string[] = [];
    
    // Priority 1: Explicit sitemapUrls parameter
    if (sitemapUrls.length > 0) {
      sitemapsToProcess = sitemapUrls;
      log(`Using explicitly provided sitemaps: ${sitemapsToProcess.join(', ')}`, logFile);
    }
    // Priority 2: Single sitemapUrl parameter
    else if (sitemapUrl) {
      sitemapsToProcess = [sitemapUrl];
      log(`Using single sitemap: ${sitemapUrl}`, logFile);
    }
    // Priority 3: Auto-detect if checkAllSitemaps is true
    else if (checkAllSitemaps) {
      log('Auto-detecting sitemaps...', logFile);
      const detected = await detectSitemapUrls(siteUrl);
      if (detected.length > 0) {
        sitemapsToProcess = detected;
        log(`Auto-detected ${detected.length} sitemaps`, logFile);
      } else {
        // Fallback to default
        sitemapsToProcess = [`${siteUrl}/sitemap.xml`];
        log('No sitemaps detected, using default: /sitemap.xml', logFile);
      }
    }
    // Priority 4: Default
    else {
      sitemapsToProcess = [`${siteUrl}/sitemap.xml`];
      log('Using default sitemap: /sitemap.xml', logFile);
    }

    // Fetch URLs from all sitemaps
    log('Fetching URLs from sitemaps...', logFile);
    let allUrls = await getSitemapUrls(sitemapsToProcess);

    log(`Sitemap discovery returned ${allUrls.length} URLs`, logFile);

    // If sitemap returned few URLs and crawlFallback is enabled, perform site crawl
    if (crawlFallback && allUrls.length < 100) {
      log('Sitemap appears small — running fallback site crawler to discover dynamic routes...', logFile);
      try {
        const crawled = await crawlSiteForLinks(siteUrl, '/', crawlMaxPages, crawlConcurrency);
        log(`Crawler discovered ${crawled.length} URLs`, logFile);
        // Merge both sets
        allUrls = Array.from(new Set([...allUrls, ...crawled]));
      } catch (crawlErr: any) {
        log(`Crawler fallback failed: ${crawlErr?.message || crawlErr}`, logFile);
      }
    }

    if (allUrls.length === 0) {
      log('No URLs found to index', logFile);
      return;
    }

    log(`Found ${allUrls.length} URLs total (after merge)`, logFile);

    // Filter URLs
    const includeRegexes = includePatterns.map(p => new RegExp(p));
    const excludeRegexes = excludePatterns.map(p => new RegExp(p));
    
    const urlsToIndex = allUrls.filter(url => 
      shouldIndexUrl(url, {
        include: includeRegexes.length > 0 ? includeRegexes : undefined,
        exclude: excludeRegexes.length > 0 ? excludeRegexes : undefined,
      })
    );

    log(`Filtered to ${urlsToIndex.length} URLs for indexing`, logFile);

    if (dryRun) {
      log('DRY RUN - URLs that would be indexed:', logFile);
      urlsToIndex.forEach(url => log(`  - ${url}`, logFile));
      return;
    }

    // Process URLs in batches
    const batches: string[][] = [];
    for (let i = 0; i < urlsToIndex.length; i += batchSize) {
      batches.push(urlsToIndex.slice(i, i + batchSize));
    }

    log(`Processing ${batches.length} batches...`, logFile);

    let totalSuccess = 0;
    let totalFailed = 0;

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      log(`\nProcessing batch ${i + 1}/${batches.length} (${batch.length} URLs)...`, logFile);

      const results = await submitBatchUrls(batch, 'URL_UPDATED', delayMs);
      
      const successCount = results.filter(r => r.success).length;
      const failedCount = results.filter(r => !r.success).length;
      
      totalSuccess += successCount;
      totalFailed += failedCount;

      log(`Batch ${i + 1} results: ${successCount} successful, ${failedCount} failed`, logFile);

      // Log failed URLs
      results.filter(r => !r.success).forEach(result => {
        log(`  Failed: ${result.url} - ${result.error}`, logFile);
      });

      // Delay between batches
      if (i < batches.length - 1) {
        log(`Waiting ${delayMs}ms before next batch...`, logFile);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    // Final summary
    log('\n=== INDEXING COMPLETE ===', logFile);
    log(`Total URLs processed: ${urlsToIndex.length}`, logFile);
    log(`Successful: ${totalSuccess}`, logFile);
    log(`Failed: ${totalFailed}`, logFile);
    if (urlsToIndex.length > 0) {
      log(`Success rate: ${((totalSuccess / urlsToIndex.length) * 100).toFixed(2)}%`, logFile);
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log(`Fatal error: ${errorMessage}`, logFile);
    process.exit(1);
  }
}

// Parse command line arguments
function parseArgs(): IndexingSitemapOptions {
  const args = process.argv.slice(2);
  const options: IndexingSitemapOptions = {};

  for (let i = 0; i < args.length; i++) {
    const flag = args[i];
    
    switch (flag) {
      case '--sitemap':
        options.sitemapUrl = args[++i];
        break;
      case '--sitemaps':
        // NEW: Support multiple sitemaps via comma-separated list
        options.sitemapUrls = args[++i].split(',').map(s => s.trim());
        break;
      case '--batch-size':
        options.batchSize = parseInt(args[++i], 10);
        break;
      case '--delay':
        options.delayMs = parseInt(args[++i], 10);
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--include':
        options.includePatterns = args[++i].split(',');
        break;
      case '--exclude':
        options.excludePatterns = args[++i].split(',');
        break;
      case '--log-file':
        options.logFile = args[++i];
        break;
      case '--no-crawl-fallback':
        options.crawlFallback = false;
        break;
      case '--no-auto-detect':
        // NEW: Disable automatic sitemap detection
        options.checkAllSitemaps = false;
        break;
      case '--crawl-max-pages':
        options.crawlMaxPages = parseInt(args[++i], 10);
        break;
      case '--crawl-concurrency':
        options.crawlConcurrency = parseInt(args[++i], 10);
        break;
      case '--help':
        console.log(`
Usage: npm run index-sitemap [options]

Options:
  --sitemap <url>           Single sitemap URL
  --sitemaps <urls>         Multiple sitemap URLs (comma-separated)
  --batch-size <n>          Number of URLs per batch (default: 10)
  --delay <ms>              Delay between requests in ms (default: 1000)
  --dry-run                 Show URLs without indexing them
  --include <patterns>      Comma-separated regex patterns to include
  --exclude <patterns>      Comma-separated regex patterns to exclude
  --log-file <path>         Path to log file (default: indexing-log.txt)
  --no-crawl-fallback       Disable crawler fallback
  --no-auto-detect          Disable automatic sitemap detection
  --crawl-max-pages <n>     Max pages for crawler fallback (default: 1000)
  --crawl-concurrency <n>   Concurrency for crawler fallback (default: 5)
  --help                    Show this help message

Examples:
  # Dry run with auto-detection (will find server-sitemap.xml automatically)
  npm run index-sitemap --dry-run

  # Specify multiple sitemaps explicitly
  npm run index-sitemap --sitemaps "https://markiumpro.com/sitemap.xml,https://markiumpro.com/server-sitemap.xml"

  # Use single sitemap
  npm run index-sitemap --sitemap https://markiumpro.com/server-sitemap.xml

  # Auto-detect all sitemaps (default behavior)
  npm run index-sitemap --batch-size 20 --delay 2000
        `);
        process.exit(0);
    }
  }

  return options;
}

// Run if called directly
if (require.main === module) {
  const options = parseArgs();
  indexSitemap(options).catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export { indexSitemap };