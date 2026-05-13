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

export function BusCardSkeleton() {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
        <Skeleton className="h-7 w-24" />
      </div>
      <div className="flex items-center gap-6">
        <div className="space-y-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-4 w-12" />
        </div>
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32 mx-auto" />
          <Skeleton className="h-px w-full" />
          <Skeleton className="h-4 w-28 mx-auto" />
        </div>
        <div className="space-y-2 text-right">
          <Skeleton className="ml-auto h-6 w-20" />
          <Skeleton className="ml-auto h-4 w-12" />
        </div>
      </div>
    </div>
  )
}

export function TrainCardSkeleton() {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-3">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="flex items-center gap-6">
        <div className="space-y-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-4 w-12" />
        </div>
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-36 mx-auto" />
          <Skeleton className="h-px w-full" />
          <Skeleton className="h-4 w-24 mx-auto" />
        </div>
        <div className="space-y-2 text-right">
          <Skeleton className="ml-auto h-6 w-20" />
          <Skeleton className="ml-auto h-4 w-12" />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="rounded-lg border border-gray-200 p-3">
            <Skeleton className="h-4 w-12 mx-auto" />
            <Skeleton className="mx-auto mt-2 h-5 w-16" />
            <Skeleton className="mx-auto mt-2 h-5 w-14 rounded-full" />
            <Skeleton className="mx-auto mt-2 h-4 w-12" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function CabCardSkeleton() {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-4">
          <Skeleton className="h-14 w-20 flex-shrink-0 rounded-lg" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-full max-w-md" />
            <Skeleton className="h-4 w-36" />
          </div>
        </div>
        <div className="space-y-2 text-right">
          <Skeleton className="ml-auto h-7 w-24" />
          <Skeleton className="ml-auto h-4 w-20" />
          <Skeleton className="ml-auto h-9 w-24" />
        </div>
      </div>
    </div>
  )
}
