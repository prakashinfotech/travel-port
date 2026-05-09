interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`animate-pulse rounded-md bg-gray-200 ${className}`} />
  )
}

export function FlightCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-32" />
        </div>
        <Skeleton className="h-8 w-16" />
        <div className="flex flex-col gap-2 items-end">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="flex flex-col gap-2 items-end">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
    </div>
  )
}

export function HotelCardSkeleton() {
  return (
    <div className="flex rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      <Skeleton className="h-48 w-48 flex-shrink-0" />
      <div className="flex flex-1 flex-col gap-3 p-5">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-full" />
        <div className="flex justify-between mt-auto">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
    </div>
  )
}

export function BookingCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm flex justify-between items-center">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-9 w-24" />
    </div>
  )
}
