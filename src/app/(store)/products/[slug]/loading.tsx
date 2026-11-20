import { Skeleton } from "@/components/ui/misc";

export default function Loading() {
  return (
    <div className="container-x grid gap-10 pb-20 pt-6 md:grid-cols-[1.35fr_1fr] md:pt-10" aria-busy aria-label="Carregando produto">
      <div className="grid gap-1.5 md:grid-cols-2">
        <Skeleton className="aspect-[4/5]" />
        <Skeleton className="hidden aspect-[4/5] md:block" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-6 w-1/4" />
        <Skeleton className="mt-8 h-10 w-1/2" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}
