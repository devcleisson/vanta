import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main id="main" className="flex min-h-dvh flex-col bg-ink text-paper dark-surface">
      <div className="container-x py-6"><Logo /></div>
      <div className="container-x flex flex-1 flex-col justify-center pb-24">
        <p className="display text-[clamp(6rem,28vw,22rem)] leading-[0.8]">404</p>
        <p className="mt-8 max-w-md text-[17px] text-paper/80">Esta página não existe ou o produto saiu do catálogo.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild variant="inverse" size="lg"><Link href="/shop">Ir para a loja</Link></Button>
          <Button asChild variant="outline-inverse" size="lg"><Link href="/">Página inicial</Link></Button>
        </div>
      </div>
    </main>
  );
}
