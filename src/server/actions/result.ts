import type { z } from "zod";

export type ActionResult<T = undefined> =
  | { ok: true; data: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export function fromZodError(error: z.ZodError): ActionResult<never> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return { ok: false, error: error.issues[0]?.message ?? "Dados inválidos.", fieldErrors };
}

export function failure(error: unknown, fallback = "Algo deu errado. Tente novamente."): ActionResult<never> {
  if (error instanceof Error && error.message && !error.message.startsWith("Failed query")) {
    return { ok: false, error: error.message };
  }
  console.error(error);
  return { ok: false, error: fallback };
}
