"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main id="main" className="container-x flex min-h-[70dvh] flex-col justify-center py-24">
      <h1 className="display text-[clamp(2.5rem,8vw,5rem)]">Something broke</h1>
      <p className="mt-6 max-w-md text-[16px] text-graphite">
        Não conseguimos carregar esta página. Tente novamente; se continuar, volte mais tarde.
        {error.digest && <span className="mt-2 block text-[13px] text-smoke">Código: {error.digest}</span>}
      </p>
      <div className="mt-8 flex gap-3">
        <Button size="lg" onClick={reset}>Tentar novamente</Button>
        <Button asChild size="lg" variant="outline"><Link href="/">Página inicial</Link></Button>
      </div>
    </main>
  );
}
