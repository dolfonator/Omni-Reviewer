import { AppShell } from "@/components/app-shell";
import { Skeleton } from "@/components/ui/skeleton";

export default function ReviewerLoading() {
  return (
    <AppShell>
      <div className="flex flex-col gap-8" aria-busy="true" aria-live="polite">
        <span className="sr-only">Loading study pack</span>
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-64" />
        </div>

        <div className="space-y-3">
          <div className="flex items-end justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-72" />
            </div>
            <Skeleton className="h-11 w-24" />
          </div>
          <div className="overflow-hidden rounded-xl border border-border/80">
            <Skeleton className="h-16 w-full rounded-none" />
            <Skeleton className="h-16 w-full rounded-none" />
          </div>
        </div>

        <div className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-80" />
          <Skeleton className="h-11 w-32" />
        </div>

        <div className="space-y-3">
          <Skeleton className="h-4 w-16" />
          <div className="flex gap-2 border-b border-border pb-2">
            <Skeleton className="h-11 w-24 rounded-none" />
            <Skeleton className="h-11 w-24 rounded-none" />
            <Skeleton className="h-11 w-24 rounded-none" />
            <Skeleton className="h-11 w-24 rounded-none" />
          </div>
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    </AppShell>
  );
}
