import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} aria-label="VANTA — página inicial" className={cn("display inline-block text-[22px] leading-none tracking-[-0.02em]", className)}>
      VANTA
    </Link>
  );
}
