import { google, indexing_v3 } from 'googleapis';
import { GaxiosResponse } from 'gaxios';


export type IndexingType = 'URL_UPDATED' | 'URL_DELETED';

export interface IndexingRequest {
  url: string;
  type: IndexingType;
}

export interface IndexingResponse {
  success: boolean;
  message: string;
  data?: indexing_v3.Schema$PublishUrlNotificationResponse;
  error?: string;
}

export interface IndexingStatusResponse {
  success: boolean;
  message: string;
  data?: indexing_v3.Schema$UrlNotificationMetadata;
  error?: string;
}

export interface BatchIndexingResult {
  url: string;
  success: boolean;
  message: string;
  data?: indexing_v3.Schema$PublishUrlNotificationResponse;
  error?: string;
}

export interface GoogleCredentials {
  clientEmail: string;
  privateKey: string;
}

// Initialize Google Auth with proper typing
const initializeAuth = (credentials?: GoogleCredentials) => {
  const clientEmail = credentials?.clientEmail || process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = credentials?.privateKey || process.env.GOOGLE_PRIVATE_KEY;

  if (!clientEmail || !privateKey) {
    throw new Error('Google credentials are not properly configured');
  }

  return new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/indexing'],
  });
};

// Initialize the indexing client with proper typing
const getIndexingClient = (credentials?: GoogleCredentials): indexing_v3.Indexing => {
  const auth = initializeAuth(credentials);
  return google.indexing({
    version: 'v3',
    auth: auth,
  });
};

/**
 * Submit a single URL for indexing
 * @param url - The URL to be indexed
 * @param type - Type of request: 'URL_UPDATED' or 'URL_DELETED'
 * @param credentials - Optional custom credentials
 * @returns Promise with IndexingResponse
 */
export async function submitUrlForIndexing(
  url: string,
  type: IndexingType = 'URL_UPDATED',
  credentials?: GoogleCredentials
): Promise<IndexingResponse> {
  try {
    // Validate URL format
    const urlPattern = /^https?:\/\/.+/;
    if (!urlPattern.test(url)) {
      throw new Error('Invalid URL format. URL must start with http:// or https://');
    }

    const indexingClient = getIndexingClient(credentials);
    
    const response = 
      await indexingClient.urlNotifications.publish({
        requestBody: {
          url: url,
          type: type,
        },
      });

    return {
      success: true,
      message: `Successfully submitted ${url} for ${type === 'URL_DELETED' ? 'removal from' : 'indexing to'} Google`,
      data: response.data,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error submitting URL to Google Indexing API:', errorMessage);
    
    return {
      success: false,
      message: `Failed to submit URL for indexing: ${errorMessage}`,
      error: errorMessage,
    };
  }
}

/**
 * Get the indexing status of a URL
 * @param url - The URL to check
 * @param credentials - Optional custom credentials
 * @returns Promise with IndexingStatusResponse
 */
export async function getUrlIndexingStatus(
  url: string,
  credentials?: GoogleCredentials
): Promise<IndexingStatusResponse> {
  try {
    // Validate URL format
    const urlPattern = /^https?:\/\/.+/;
    if (!urlPattern.test(url)) {
      throw new Error('Invalid URL format. URL must start with http:// or https://');
    }

    const indexingClient = getIndexingClient(credentials);
    
    const response = 
      await indexingClient.urlNotifications.getMetadata({
        url: url,
      });

    return {
      success: true,
      message: 'Successfully retrieved indexing status',
      data: response.data,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error getting indexing status:', errorMessage);
    
    return {
      success: false,
      message: `Failed to get indexing status: ${errorMessage}`,
      error: errorMessage,
    };
  }
}

/**
 * Submit multiple URLs for indexing in batch
 * @param urls - Array of URLs to be indexed
 * @param type - Type of request: 'URL_UPDATED' or 'URL_DELETED'
 * @param credentials - Optional custom credentials
 * @param delayMs - Delay between requests in milliseconds (default: 1000)
 * @returns Promise with array of BatchIndexingResult
 */
export async function submitBatchUrls(
  urls: string[],
  type: IndexingType = 'URL_UPDATED',
  credentials?: GoogleCredentials,
  delayMs: number = 1000
): Promise<BatchIndexingResult[]> {
  const results: BatchIndexingResult[] = [];
  
  // Validate all URLs first
  const urlPattern = /^https?:\/\/.+/;
  const invalidUrls = urls.filter(url => !urlPattern.test(url));
  
  if (invalidUrls.length > 0) {
    throw new Error(`Invalid URLs found: ${invalidUrls.join(', ')}`);
  }

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    console.log(`Processing ${i + 1}/${urls.length}: ${url}`);
    
    const result = await submitUrlForIndexing(url, type, credentials);
    
    results.push({
      url,
      success: result.success,
      message: result.message,
      data: result.data,
      error: result.error,
    });
    
    // Add delay between requests to avoid rate limiting (except for the last request)
    if (i < urls.length - 1) {
      await delay(delayMs);
    }
  }
  
  return results;
}

/**
 * Helper function to create a delay
 * @param ms - Milliseconds to delay
 * @returns Promise that resolves after the delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Validate Google credentials
 * @param credentials - Optional custom credentials
 * @returns boolean indicating if credentials are valid
 */
export function validateCredentials(credentials?: GoogleCredentials): boolean {
  const clientEmail = credentials?.clientEmail || process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = credentials?.privateKey || process.env.GOOGLE_PRIVATE_KEY;
  
  return !!(clientEmail && privateKey);
}

/**
 * Generate a sitemap URL for indexing
 * @param siteUrl - The base site URL
 * @param path - Optional path to append
 * @returns Formatted URL string
 */
export function generateIndexingUrl(siteUrl: string, path?: string): string {
  const baseUrl = siteUrl.replace(/\/$/, ''); // Remove trailing slash
  if (path) {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${cleanPath}`;
  }
  return baseUrl;
}

/**
 * Parse indexing API error for better error messages
 * @param error - The error object from the API
 * @returns Formatted error message
 */
export function parseIndexingError(error: any): string {
  if (error?.response?.data?.error) {
    const apiError = error.response.data.error;
    if (apiError.message) {
      return apiError.message;
    }
    if (apiError.status) {
      return `API Error: ${apiError.status}`;
    }
  }
  
  if (error?.message) {
    return error.message;
  }
  
  return 'An unknown error occurred while communicating with the Google Indexing API';
}