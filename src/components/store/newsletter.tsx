"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { subscribeNewsletterAction } from "@/server/actions/catalog";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <section aria-labelledby="newsletter-title" className="bg-concrete">
      <div className="container-x grid gap-8 py-20 md:grid-cols-2 md:items-end md:py-28">
        <div>
          <h2 id="newsletter-title" className="display text-[clamp(2.5rem,7vw,5.5rem)]">
            First
            <br />
            to know
          </h2>
          <p className="mt-6 max-w-md text-[15px] leading-relaxed text-graphite">
            Lançamentos, reposições e drops limitados chegam primeiro por e-mail. Um envio por semana, no máximo.
          </p>
        </div>
        {done ? (
          <p className="border-t border-ink pt-5 text-[17px] font-medium" role="status">{done}</p>
        ) : (
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              setError(null);
              start(async () => {
                const res = await subscribeNewsletterAction(email);
                if (res.ok) {
                  setDone(res.message ?? "Inscrição confirmada.");
                  toast.success("Inscrição confirmada");
                } else setError(res.error);
              });
            }}
          >
            <label htmlFor="newsletter-email" className="text-[13px] font-medium">E-mail</label>
            <div className="mt-2 flex border-b border-ink">
              <input
                id="newsletter-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@email.com"
                autoComplete="email"
                aria-invalid={!!error}
                aria-describedby={error ? "newsletter-error" : undefined}
                className="h-14 w-full bg-transparent text-lg outline-none placeholder:text-smoke"
              />
              <Button type="submit" variant="link" loading={pending} className="h-14 shrink-0 px-2 text-[15px] font-semibold">
                Inscrever
              </Button>
            </div>
            {error && <p id="newsletter-error" className="mt-2 text-[13px] text-danger" role="alert">{error}</p>}
            <p className="mt-3 text-[12px] text-smoke">Você pode cancelar a qualquer momento pelo link no rodapé dos e-mails.</p>
          </form>
        )}
      </div>
    </section>
  );
}
