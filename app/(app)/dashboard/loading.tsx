import { CardGrid } from "@/components/site/cards"
import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <div className="container-site flex flex-col gap-8 py-12" aria-busy aria-label="Loading your forms">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-9 w-48" />
      </div>
      <CardGrid>
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex flex-col gap-6 rounded-card bg-surface p-6 shadow-card">
            <Skeleton className="h-6 w-16 rounded-pill" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </CardGrid>
    </div>
  )
}
