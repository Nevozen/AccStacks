import { Skeleton } from "@/components/ui/skeleton";

export default function ApplicationLoading() {
  return (
    <div className="space-y-grid" role="status" aria-label="Loading workspace">
      <Skeleton className="h-8 w-36" />
      <div className="grid gap-grid md:grid-cols-12">
        <Skeleton className="h-44 rounded-xl border md:col-span-7" />
        <Skeleton className="h-44 rounded-xl border md:col-span-5" />
      </div>
      <Skeleton className="h-40 rounded-xl border" />
    </div>
  );
}
