"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { forwardRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  type ForgotPasswordInput,
  type LoginInput,
  type RegisterInput,
  type ResetPasswordInput,
} from "@/schemas/auth";
import { forgotPasswordAction, loginAction, registerAction, resetPasswordAction } from "@/server/actions/auth";

const PasswordInput = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>((props, ref) => {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input ref={ref} type={visible ? "text" : "password"} className="pr-12" {...props} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-1 top-1 inline-flex size-10 items-center justify-center text-smoke hover:text-ink"
        aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
});
PasswordInput.displayName = "PasswordInput";

function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="border border-danger/50 bg-danger/5 px-4 py-3 text-[14px] text-danger">
      {message}
    </p>
  );
}

const aria = (err?: string, id?: string) => ({ "aria-invalid": Boolean(err), "aria-describedby": err ? `${id}-error` : undefined });

export function LoginForm({ next, demoHint }: { next?: string; demoHint?: { admin: string; customer: string; password: string; adminPassword: string } }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState, setValue } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });
  const onSubmit = handleSubmit(async (data) => {
    setError(null);
    const res = await loginAction(data, next);
    if (!res.ok) return setError(res.error);
    router.replace(res.data.redirectTo);
    router.refresh();
  });
  const e = formState.errors;
  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <FormError message={error} />
      <Field label="E-mail" htmlFor="email" error={e.email?.message}>
        <Input id="email" type="email" autoComplete="email" {...register("email")} {...aria(e.email?.message, "email")} />
      </Field>
      <Field label="Senha" htmlFor="password" error={e.password?.message}>
        <PasswordInput id="password" autoComplete="current-password" {...register("password")} {...aria(e.password?.message, "password")} />
      </Field>
      <div className="flex justify-end">
        <Link href="/forgot-password" className="text-[13px] underline underline-offset-4">Esqueci minha senha</Link>
      </div>
      <Button type="submit" size="lg" className="w-full" loading={formState.isSubmitting}>Entrar</Button>
      {demoHint && (
        <div className="space-y-2 bg-concrete p-4 text-[13px]">
          <p className="font-medium">Contas de demonstração</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="h-8 border border-ink px-3 hover:bg-ink hover:text-paper" onClick={() => { setValue("email", demoHint.customer); setValue("password", demoHint.password); }}>
              Cliente
            </button>
            <button type="button" className="h-8 border border-ink px-3 hover:bg-ink hover:text-paper" onClick={() => { setValue("email", demoHint.admin); setValue("password", demoHint.adminPassword); }}>
              Administrador
            </button>
          </div>
        </div>
      )}
    </form>
  );
}

export function RegisterForm({ next }: { next?: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });
  const onSubmit = handleSubmit(async (data) => {
    setError(null);
    const res = await registerAction(data, next);
    if (!res.ok) return setError(res.error);
    if (res.data.redirectTo) {
      router.replace(res.data.redirectTo);
      router.refresh();
    } else setNotice(res.message ?? "Conta criada.");
  });
  const e = formState.errors;
  if (notice) return <p role="status" className="border border-ink p-5 text-[15px]">{notice}</p>;
  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <FormError message={error} />
      <Field label="Nome completo" htmlFor="fullName" error={e.fullName?.message}>
        <Input id="fullName" autoComplete="name" {...register("fullName")} {...aria(e.fullName?.message, "fullName")} />
      </Field>
      <Field label="E-mail" htmlFor="email" error={e.email?.message}>
        <Input id="email" type="email" autoComplete="email" {...register("email")} {...aria(e.email?.message, "email")} />
      </Field>
      <Field label="Senha" htmlFor="password" error={e.password?.message} hint="Mínimo de 8 caracteres.">
        <PasswordInput id="password" autoComplete="new-password" {...register("password")} {...aria(e.password?.message, "password")} />
      </Field>
      <Field label="Confirme a senha" htmlFor="confirmPassword" error={e.confirmPassword?.message}>
        <PasswordInput id="confirmPassword" autoComplete="new-password" {...register("confirmPassword")} {...aria(e.confirmPassword?.message, "confirmPassword")} />
      </Field>
      <Button type="submit" size="lg" className="w-full" loading={formState.isSubmitting}>Criar conta</Button>
      <p className="text-[12px] text-smoke">
        Ao criar a conta você concorda com os <Link href="/help/termos" className="underline">termos de uso</Link> e a{" "}
        <Link href="/help/privacidade" className="underline">política de privacidade</Link>.
      </p>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<{ message: string; link?: string } | null>(null);
  const { register, handleSubmit, formState } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });
  const onSubmit = handleSubmit(async (data) => {
    setError(null);
    const res = await forgotPasswordAction(data);
    if (!res.ok) return setError(res.error);
    setSent({ message: res.message ?? "", link: res.data.resetLink });
  });
  const e = formState.errors;
  if (sent) {
    return (
      <div role="status" className="space-y-4">
        <p className="border border-ink p-5 text-[15px]">{sent.message}</p>
        {sent.link && (
          <div className="bg-concrete p-4 text-[13px]">
            <p className="font-medium">Modo demonstração</p>
            <p className="mt-1 text-graphite">Sem provedor de e-mail configurado, o link de redefinição aparece aqui:</p>
            <Link href={sent.link} className="mt-2 inline-block break-all underline underline-offset-4">Criar nova senha</Link>
          </div>
        )}
      </div>
    );
  }
  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <FormError message={error} />
      <Field label="E-mail da conta" htmlFor="email" error={e.email?.message}>
        <Input id="email" type="email" autoComplete="email" {...register("email")} {...aria(e.email?.message, "email")} />
      </Field>
      <Button type="submit" size="lg" className="w-full" loading={formState.isSubmitting}>Enviar link de recuperação</Button>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token?: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<ResetPasswordInput>({ resolver: zodResolver(resetPasswordSchema), defaultValues: { token } });
  const onSubmit = handleSubmit(async (data) => {
    setError(null);
    const res = await resetPasswordAction(data);
    if (!res.ok) return setError(res.error);
    router.replace("/account?password=updated");
    router.refresh();
  });
  const e = formState.errors;
  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <FormError message={error} />
      <input type="hidden" {...register("token")} />
      <Field label="Nova senha" htmlFor="password" error={e.password?.message} hint="Mínimo de 8 caracteres.">
        <PasswordInput id="password" autoComplete="new-password" {...register("password")} {...aria(e.password?.message, "password")} />
      </Field>
      <Field label="Confirme a nova senha" htmlFor="confirmPassword" error={e.confirmPassword?.message}>
        <PasswordInput id="confirmPassword" autoComplete="new-password" {...register("confirmPassword")} {...aria(e.confirmPassword?.message, "confirmPassword")} />
      </Field>
      <Button type="submit" size="lg" className="w-full" loading={formState.isSubmitting}>Salvar nova senha</Button>
    </form>
  );
}
