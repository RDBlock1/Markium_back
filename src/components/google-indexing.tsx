// components/google-indexing.tsx
'use client';

import { useState } from 'react';
import { useGoogleIndexing, useBatchIndexing, useIndexingQueue } from '@/hooks/use-google-indexing';
import { IndexingType } from '@/lib/google-indexing';

// Component for indexing single URLs
export function IndexingButton({ 
  url, 
  type = 'URL_UPDATED' as IndexingType,
  className = '',
  children 
}: { 
  url?: string; 
  type?: IndexingType;
  className?: string;
  children?: React.ReactNode;
}) {
  const { loading, success, error, indexUrl, indexCurrentPage } = useGoogleIndexing({
    onSuccess: (data) => {
      console.log('Indexing successful:', data);
    },
    onError: (error) => {
      console.error('Indexing failed:', error);
    },
  });

  const handleClick = async () => {
    if (url) {
      await indexUrl(url, type);
    } else {
      await indexCurrentPage(type);
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
          loading 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        } ${className}`}
      >
        {loading ? 'Indexing...' : children || 'Request Indexing'}
      </button>
      
      {success && (
        <p className="mt-2 text-sm text-green-600">
          ✅ URL successfully submitted for indexing
        </p>
      )}
      
      {error && (
        <p className="mt-2 text-sm text-red-600">
          ❌ Error: {error}
        </p>
      )}
    </div>
  );
}

// Component for batch indexing
export function BatchIndexingForm() {
  const [urls, setUrls] = useState<string>('');
  const [indexingType, setIndexingType] = useState<IndexingType>('URL_UPDATED');
  const { loading, success, error, data, indexUrls } = useBatchIndexing({
    delayMs: 1000,
    onSuccess: (data) => {
      console.log('Batch indexing completed:', data);
    },
    onError: (error) => {
      console.error('Batch indexing failed:', error);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const urlList = urls.split('\n').filter(url => url.trim());
    if (urlList.length > 0) {
      await indexUrls(urlList, indexingType);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Batch URL Indexing</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="urls" className="block text-sm font-medium text-gray-700 mb-2">
            URLs (one per line, max 100)
          </label>
          <textarea
            id="urls"
            value={urls}
            onChange={(e) => setUrls(e.target.value)}
            rows={10}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://markiumpro.com/page1&#10;https://markiumpro.com/page2&#10;https://markiumpro.com/page3"
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
            Indexing Type
          </label>
          <select
            id="type"
            value={indexingType}
            onChange={(e) => setIndexingType(e.target.value as IndexingType)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          >
            <option value="URL_UPDATED">URL Updated (Add/Update)</option>
            <option value="URL_DELETED">URL Deleted (Remove)</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading || !urls.trim()}
          className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
            loading || !urls.trim()
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {loading ? 'Processing...' : 'Submit URLs for Indexing'}
        </button>
      </form>

      {/* Results Display */}
      {data && data.summary && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">Results:</h3>
          <div className="space-y-1 text-sm">
            <p>Total URLs: {data.summary.total}</p>
            <p className="text-green-600">✅ Successful: {data.summary.successful}</p>
            <p className="text-red-600">❌ Failed: {data.summary.failed}</p>
          </div>
          
          {data.results && data.results.length > 0 && (
            <details className="mt-4">
              <summary className="cursor-pointer font-medium">View Details</summary>
              <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                {data.results.map((result: any, index: number) => (
                  <div 
                    key={index} 
                    className={`p-2 rounded text-xs ${
                      result.success ? 'bg-green-100' : 'bg-red-100'
                    }`}
                  >
                    <p className="font-medium">{result.url}</p>
                    <p>{result.message}</p>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">Error: {error}</p>
        </div>
      )}
    </div>
  );
}

// Component for checking indexing status
export function IndexingStatusChecker() {
  const [url, setUrl] = useState('');
  const { loading, success, error, data, getStatus } = useGoogleIndexing();

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      await getStatus(url);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Check Indexing Status</h2>
      
      <form onSubmit={handleCheck} className="space-y-4">
        <div>
          <label htmlFor="status-url" className="block text-sm font-medium text-gray-700 mb-2">
            URL to Check
          </label>
          <input
            id="status-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://markiumpro.com/page"
            disabled={loading}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading || !url.trim()}
          className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
            loading || !url.trim()
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {loading ? 'Checking...' : 'Check Status'}
        </button>
      </form>

      {data && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">Status Information:</h3>
          <pre className="text-xs overflow-x-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">Error: {error}</p>
        </div>
      )}
    </div>
  );
}

// Component for managing indexing queue
export function IndexingQueueManager() {
  const { queueSize, addToQueue, clearQueue } = useIndexingQueue();
  const [newUrl, setNewUrl] = useState('');

  const handleAddToQueue = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUrl.trim()) {
      addToQueue(newUrl, 'URL_UPDATED');
      setNewUrl('');
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-3">Indexing Queue</h3>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Queue Size: <span className="font-bold">{queueSize}</span> URLs
        </p>
      </div>

      <form onSubmit={handleAddToQueue} className="mb-4">
        <div className="flex gap-2">
          <input
            type="url"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Add URL to queue"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Add
          </button>
        </div>
      </form>

      <button
        onClick={clearQueue}
        disabled={queueSize === 0}
        className={`w-full px-4 py-2 rounded-md font-medium transition-colors ${
          queueSize === 0
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-red-600 hover:bg-red-700 text-white'
        }`}
      >
        Clear Queue
      </button>
    </div>
  );
}

// Dashboard component combining all features
export function GoogleIndexingDashboard() {
  const [activeTab, setActiveTab] = useState<'single' | 'batch' | 'status' | 'queue'>('single');

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">
          Google Indexing API Dashboard
        </h1>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg shadow-md p-1 flex gap-1">
            {[
              { key: 'single', label: 'Single URL' },
              { key: 'batch', label: 'Batch URLs' },
              { key: 'status', label: 'Check Status' },
              { key: 'queue', label: 'Queue Manager' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="animate-fadeIn">
          {activeTab === 'single' && (
            <div className="max-w-xl mx-auto bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4">Index Single URL</h2>
              <IndexingButton className="w-full">
                Index Current Page
              </IndexingButton>
            </div>
          )}

          {activeTab === 'batch' && <BatchIndexingForm />}
          {activeTab === 'status' && <IndexingStatusChecker />}
          {activeTab === 'queue' && (
            <div className="max-w-xl mx-auto">
              <IndexingQueueManager />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}