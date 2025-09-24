// app/api/indexing/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { 
  submitUrlForIndexing, 
  submitBatchUrls, 
  getUrlIndexingStatus,
  IndexingType,
  validateCredentials 
} from '@/lib/google-indexing';

// Type definitions for API requests
interface SingleUrlRequest {
  url: string;
  type?: IndexingType;
}

interface BatchUrlsRequest {
  urls: string[];
  type?: IndexingType;
  delayMs?: number;
}

interface StatusRequest {
  url: string;
}

// POST endpoint for submitting URLs
export async function POST(request: NextRequest) {
  try {
    // Validate credentials before processing
    if (!validateCredentials()) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Google Indexing API credentials are not configured' 
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    
    // Check if it's a batch request
    if (Array.isArray(body.urls)) {
      const { urls, type = 'URL_UPDATED', delayMs = 1000 }: BatchUrlsRequest = body;
      
      if (urls.length === 0) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'URLs array cannot be empty' 
          },
          { status: 400 }
        );
      }
      
      if (urls.length > 100) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Maximum 100 URLs can be submitted at once' 
          },
          { status: 400 }
        );
      }
      
      const results = await submitBatchUrls(urls, type, undefined, delayMs);
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;
      
      return NextResponse.json({
        success: failureCount === 0,
        message: `Processed ${results.length} URLs: ${successCount} successful, ${failureCount} failed`,
        results,
        summary: {
          total: results.length,
          successful: successCount,
          failed: failureCount,
        }
      });
    } 
    
    // Single URL request
    else if (body.url) {
      const { url, type = 'URL_UPDATED' }: SingleUrlRequest = body;
      
      const result = await submitUrlForIndexing(url, type);
      
      return NextResponse.json(result, { 
        status: result.success ? 200 : 400 
      });
    } 
    
    else {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request body. Expected "url" or "urls" field' 
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('API Route Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { 
        success: false, 
        error: `Internal server error: ${errorMessage}` 
      },
      { status: 500 }
    );
  }
}

// GET endpoint for checking indexing status
export async function GET(request: NextRequest) {
  try {
    // Validate credentials before processing
    if (!validateCredentials()) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Google Indexing API credentials are not configured' 
        },
        { status: 500 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get('url');
    
    if (!url) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'URL parameter is required' 
        },
        { status: 400 }
      );
    }
    
    const result = await getUrlIndexingStatus(url);
    
    return NextResponse.json(result, { 
      status: result.success ? 200 : 400 
    });
  } catch (error) {
    console.error('API Route Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { 
        success: false, 
        error: `Internal server error: ${errorMessage}` 
      },
      { status: 500 }
    );
  }
}