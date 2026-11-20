import { Skeleton } from "@/components/ui/misc";

export default function Loading() {
  return (
    <div className="container-x pb-24 pt-10 md:pt-14" aria-busy aria-label="Carregando produtos">
      <Skeleton className="h-16 w-2/3 max-w-xl md:h-24" />
      <div className="mt-10 grid gap-10 lg:grid-cols-[240px_1fr]">
        <div className="hidden space-y-4 lg:block">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-3/4" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="aspect-[4/5]" />
              <Skeleton className="mt-3 h-4 w-2/3" />
              <Skeleton className="mt-2 h-4 w-1/3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
