import { AppShell } from "@/components/app-shell";
import { Skeleton } from "@/components/ui/skeleton";

export default function HomeLoading() {
  return (
    <AppShell
      title="Study desk"
      subtitle="Pick a topic, open a study pack, attach sources, then generate when you are ready."
    >
      <div className="flex flex-col gap-8" aria-busy="true" aria-live="polite">
        <span className="sr-only">Loading study desk</span>
        <div className="space-y-3">
          <Skeleton className="h-3 w-16" />
          <div className="flex gap-2">
            <Skeleton className="h-11 w-28 rounded-xl" />
            <Skeleton className="h-11 w-36 rounded-xl" />
            <Skeleton className="h-11 w-24 rounded-xl" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-end justify-between">
            <div className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-4 w-40" />
            </div>
            <Skeleton className="h-11 w-36" />
          </div>
          <div className="overflow-hidden rounded-xl border border-border/80">
            <Skeleton className="h-16 w-full rounded-none" />
            <Skeleton className="h-16 w-full rounded-none" />
            <Skeleton className="h-16 w-full rounded-none" />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
