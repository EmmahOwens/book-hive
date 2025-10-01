import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const BookCardSkeleton = () => {
  return (
    <Card className="backdrop-blur-xl bg-white/60 dark:bg-black/40 border border-white/20 dark:border-white/10 shadow-apple-lg rounded-2xl overflow-hidden">
      {/* Cover Image Skeleton */}
      <Skeleton className="h-48 w-full rounded-none" />
      
      <CardHeader className="pb-2 sm:pb-3">
        <Skeleton className="h-5 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      
      <CardContent className="pb-3 sm:pb-4">
        {/* Description skeleton */}
        <div className="space-y-2 mb-4">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </div>
        
        {/* Tags skeleton */}
        <div className="flex gap-2 mb-4">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-12 rounded-full" />
        </div>
        
        {/* Availability skeleton */}
        <Skeleton className="h-12 w-full rounded-xl" />
      </CardContent>
      
      <CardFooter className="pt-0 pb-4 sm:pb-6 gap-2 sm:gap-3">
        <Skeleton className="h-9 flex-1 rounded-full" />
        <Skeleton className="h-9 flex-1 rounded-full" />
      </CardFooter>
    </Card>
  );
};
