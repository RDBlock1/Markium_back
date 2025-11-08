import { Skeleton } from "./skeleton";

const TabContentSkeleton = () => (
    <div className="space-y-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-32 w-full" />
    </div>
);

export default TabContentSkeleton;