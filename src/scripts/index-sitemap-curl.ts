// src/scripts/index-sitemap-curl.ts
import * as child_process from 'child_process';
import * as util from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { google } from 'googleapis';

const exec = util.promisify(child_process.exec);

// Load environment variables
const possibleEnvFiles = ['.env.local', '.env'];
for (const envFile of possibleEnvFiles) {
  const envPath = path.resolve(process.cwd(), envFile);
  if (fs.existsSync(envPath)) {
    console.log('Loading env from:', envPath);
    dotenv.config({ path: envPath });
    break;
  }
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

// Fetch sitemap using curl
async function fetchSitemapWithCurl(url: string): Promise<string[]> {
  console.log(`Fetching sitemap from ${url} using curl...`);
  
  try {
    const { stdout } = await exec(`curl -s "${url}"`);
    
    // Extract URLs from sitemap XML
    const urlRegex = /<loc>(.*?)<\/loc>/g;
    const urls: string[] = [];
    let match;
    
    while ((match = urlRegex.exec(stdout)) !== null) {
      const url = match[1].trim();
      if (url) urls.push(url);
    }
    
    console.log(`Found ${urls.length} URLs in sitemap`);
    return urls;
  } catch (error) {
    console.error(`Failed to fetch sitemap with curl:`, error);
    return [];
  }
}

// Submit URL for indexing
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

// Main function
async function main() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://markiumpro.com';
  const sitemapUrl = `${siteUrl}/server-sitemap.xml`;
  const batchSize = 50;
  const delayMs = 2000;
  const dryRun = process.argv.includes('--dry-run');
  
  console.log('Starting sitemap indexing with curl...');
  console.log(`Sitemap URL: ${sitemapUrl}`);
  console.log(`Batch size: ${batchSize}`);
  console.log(`Delay: ${delayMs}ms`);
  console.log(`Dry run: ${dryRun}`);
  
  // Fetch URLs using curl
  const urls = await fetchSitemapWithCurl(sitemapUrl);
  
  if (urls.length === 0) {
    console.log('No URLs found in sitemap');
    return;
  }
  
  // Filter out API and admin URLs
  const urlsToIndex = urls.filter(url => {
    return !url.includes('/api/') && 
           !url.includes('/admin/') && 
           !url.includes('/_next/');
  });
  
  console.log(`Filtered to ${urlsToIndex.length} URLs for indexing`);
  
  if (dryRun) {
    console.log('DRY RUN - URLs that would be indexed:');
    urlsToIndex.slice(0, 10).forEach(url => console.log(`  - ${url}`));
    if (urlsToIndex.length > 10) {
      console.log(`  ... and ${urlsToIndex.length - 10} more`);
    }
    return;
  }
  
  // Process in batches
  let totalSuccess = 0;
  let totalFailed = 0;
  
  for (let i = 0; i < urlsToIndex.length; i += batchSize) {
    const batch = urlsToIndex.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(urlsToIndex.length / batchSize);
    
    console.log(`\nProcessing batch ${batchNum}/${totalBatches} (${batch.length} URLs)...`);
    
    for (const url of batch) {
      const result = await submitUrlForIndexing(url);
      if (result.success) {
        totalSuccess++;
        console.log(`  ✓ ${url}`);
      } else {
        totalFailed++;
        console.log(`  ✗ ${url}: ${result.error}`);
      }
      
      // Small delay between individual requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Delay between batches
    if (i + batchSize < urlsToIndex.length) {
      console.log(`Waiting ${delayMs}ms before next batch...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  // Summary
  console.log('\n=== INDEXING COMPLETE ===');
  console.log(`Total URLs processed: ${urlsToIndex.length}`);
  console.log(`Successful: ${totalSuccess}`);
  console.log(`Failed: ${totalFailed}`);
  if (urlsToIndex.length > 0) {
    console.log(`Success rate: ${((totalSuccess / urlsToIndex.length) * 100).toFixed(2)}%`);
  }
}

// Run
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}