export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Skeleton */}
      <div className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex gap-6 mb-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-8 bg-muted animate-pulse rounded-md"
                style={{ width: `${60 + Math.random() * 40}px` }}
              />
            ))}
          </div>

          {/* Search Bar Skeleton */}
          <div className="flex items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="h-10 bg-muted animate-pulse rounded-md" />
            </div>
            <div className="flex gap-2 ml-4">
              <div className="h-10 w-32 bg-muted animate-pulse rounded-md" />
              <div className="h-10 w-10 bg-muted animate-pulse rounded-md" />
              <div className="h-10 w-10 bg-muted animate-pulse rounded-md" />
            </div>
          </div>
        </div>
      </div>

      {/* Cards Grid Skeleton */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <MarketCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}

function MarketCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Image Skeleton */}
      <div className="relative">
        <div className="h-48 bg-muted animate-pulse" />
        {/* Active Badge Skeleton */}
        <div className="absolute top-3 right-3">
          <div className="h-6 w-16 bg-muted animate-pulse rounded-full" />
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="p-4 space-y-4">
        {/* Title Skeleton */}
        <div className="space-y-2">
          <div className="h-4 bg-muted animate-pulse rounded w-full" />
          <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
        </div>

        {/* YES/NO Options Skeleton */}
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
            <div className="h-4 w-8 bg-muted animate-pulse rounded" />
            <div className="h-4 w-12 bg-muted animate-pulse rounded" />
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
            <div className="h-4 w-6 bg-muted animate-pulse rounded" />
            <div className="h-4 w-12 bg-muted animate-pulse rounded" />
          </div>
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="space-y-1">
            <div className="h-3 w-16 bg-muted animate-pulse rounded" />
            <div className="h-4 w-12 bg-muted animate-pulse rounded" />
          </div>
          <div className="space-y-1">
            <div className="h-3 w-14 bg-muted animate-pulse rounded" />
            <div className="h-4 w-16 bg-muted animate-pulse rounded" />
          </div>
        </div>

        {/* End Time Skeleton */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="space-y-1">
            <div className="h-3 w-8 bg-muted animate-pulse rounded" />
            <div className="h-3 w-12 bg-muted animate-pulse rounded" />
          </div>
          <div className="h-3 w-10 bg-muted animate-pulse rounded" />
        </div>
      </div>
    </div>
  )
}
