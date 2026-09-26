import { Skeleton } from "@/components/ui/skeleton"

export default function BuilderLoading() {
  return (
    <div className="flex h-[calc(100svh-64px)] flex-col" aria-busy aria-label="Loading the editor">
      <div className="flex h-14 items-center gap-3 border-b border-line px-4">
        <Skeleton className="h-5 w-48" />
      </div>
      <div className="mx-auto flex w-full max-w-[720px] flex-col gap-4 px-4 pt-8">
        <Skeleton className="h-28 w-full rounded-card" />
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-card" />
        ))}
      </div>
    </div>
  )
}
