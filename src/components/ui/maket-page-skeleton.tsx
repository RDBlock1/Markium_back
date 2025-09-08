'use client';

import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function MarketPageSkeleton() {
  return (
    <div className="w-full md:max-w-[90%] mx-auto">
      {/* Header Section Skeleton */}
      <div className="w-full flex flex-col md:flex-row lg:justify-between space-x-4 p-6 border mt-4 mx-4 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="flex gap-4 md:w-full">
          {/* Image skeleton */}
          <Skeleton className="w-20 h-20 rounded-lg" />
          
          <div className="w-full space-y-3">
            {/* Badges skeleton */}
            <div className="flex gap-2">
              <Skeleton className="w-16 h-5 rounded-full" />
              <Skeleton className="w-20 h-5 rounded-full" />
              <Skeleton className="w-18 h-5 rounded-full" />
            </div>
            
            {/* Title skeleton */}
            <Skeleton className="w-3/4 h-8" />
            
            {/* Meta info skeleton */}
            <div className="flex gap-4">
              <Skeleton className="w-24 h-4" />
              <Skeleton className="w-20 h-4" />
              <Skeleton className="w-28 h-4" />
            </div>
          </div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="md:w-full lg:flex justify-end">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mt-6 md:mt-0">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex flex-col p-3 bg-white dark:bg-gray-800 rounded-lg border space-y-2">
                <Skeleton className="w-full h-3" />
                <Skeleton className="w-3/4 h-6" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Market Outcomes Skeleton */}
      <div className="w-full p-4 border mt-4 mx-4 rounded-lg">
        <Skeleton className="w-48 h-6 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-4 border rounded-lg bg-white dark:bg-gray-800 space-y-3">
              <div className="flex justify-between items-center">
                <Skeleton className="w-24 h-4" />
                <Skeleton className="w-12 h-5 rounded-full" />
              </div>
              <Skeleton className="w-20 h-3" />
              <Skeleton className="w-full h-2 rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Trading Section Skeleton */}
      <div className="w-full flex flex-col lg:flex-row mt-4 gap-4">
        {/* Chart skeleton */}
        <div className="flex-1">
          <Card className="p-6">
            <Skeleton className="w-full h-96" />
          </Card>
        </div>
        
        {/* Trading panel skeleton */}
        <div className="w-full lg:w-96">
          <Card className="p-6 space-y-4">
            <Skeleton className="w-32 h-6" />
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="w-24 h-4" />
                  <Skeleton className="w-full h-10" />
                </div>
              ))}
            </div>
            <Skeleton className="w-full h-12" />
          </Card>
        </div>
      </div>

      {/* Tabs Section Skeleton */}
      <div className="w-full mx-4 mt-4">
        {/* Tab navigation skeleton */}
        <div className="flex border-b">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="w-28 h-10 mr-2 rounded-t-lg" />
          ))}
        </div>
        
        {/* Tab content skeleton */}
        <div className="mt-6 space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="p-6">
              <div className="space-y-3">
                <Skeleton className="w-1/4 h-6" />
                <Skeleton className="w-full h-4" />
                <Skeleton className="w-3/4 h-4" />
                <Skeleton className="w-5/6 h-4" />
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Loading message */}
      <div className="text-center py-8">
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <span className="text-muted-foreground">Loading market data...</span>
        </div>
      </div>
    </div>
  );
}