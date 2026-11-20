"use client";

import { useEffect, useState } from "react";

export type ViaCepResult = { street: string; district: string; city: string; state: string };

/** Looks up a Brazilian CEP on the public ViaCEP API (no credentials needed). */
export function useViaCep(cep: string | undefined, onResult: (r: ViaCepResult) => void, skip?: string) {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  useEffect(() => {
    const digits = (cep ?? "").replace(/\D/g, "");
    if (digits.length !== 8 || digits === skip) return;
    const controller = new AbortController();
    setStatus("loading");
    fetch(`https://viacep.com.br/ws/${digits}/json/`, { signal: controller.signal })
      .then((r) => r.json())
      .then((d) => {
        if (d.erro) return setStatus("error");
        onResult({ street: d.logradouro ?? "", district: d.bairro ?? "", city: d.localidade ?? "", state: d.uf ?? "" });
        setStatus("idle");
      })
      .catch((e) => e?.name !== "AbortError" && setStatus("error"));
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cep, skip]);
  return status;
}
