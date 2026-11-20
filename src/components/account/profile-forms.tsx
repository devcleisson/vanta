"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { formatCpf, formatPhone } from "@/lib/format";
import { profileSchema, type ProfileInput } from "@/schemas/account";
import { changePasswordSchema, type ChangePasswordInput } from "@/schemas/auth";
import { updateProfileAction } from "@/server/actions/account";
import { changePasswordAction } from "@/server/actions/auth";

export function ProfileForm({ email, defaults }: { email: string; defaults: ProfileInput }) {
  const router = useRouter();
  const { register, handleSubmit, formState } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: { ...defaults, phone: formatPhone(defaults.phone ?? ""), cpf: formatCpf(defaults.cpf ?? "") },
  });
  const e = formState.errors;
  return (
    <form
      noValidate
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={handleSubmit(async (data) => {
        const res = await updateProfileAction(data);
        if (res.ok) {
          toast.success(res.message ?? "Dados salvos.");
          router.refresh();
        } else toast.error(res.error);
      })}
    >
      <Field label="Nome completo" htmlFor="fullName" error={e.fullName?.message} className="sm:col-span-2">
        <Input id="fullName" autoComplete="name" aria-invalid={!!e.fullName} {...register("fullName")} />
      </Field>
      <Field label="E-mail" htmlFor="email-ro" hint="Para alterar o e-mail, fale com o atendimento.">
        <Input id="email-ro" value={email} disabled readOnly />
      </Field>
      <Field label="Telefone" htmlFor="phone" error={e.phone?.message} optional>
        <Input id="phone" type="tel" aria-invalid={!!e.phone} {...register("phone", { onChange: (ev) => (ev.target.value = formatPhone(ev.target.value)) })} />
      </Field>
      <Field label="CPF" htmlFor="cpf" error={e.cpf?.message} optional>
        <Input id="cpf" inputMode="numeric" aria-invalid={!!e.cpf} {...register("cpf", { onChange: (ev) => (ev.target.value = formatCpf(ev.target.value)) })} />
      </Field>
      <div className="sm:col-span-2">
        <Button type="submit" loading={formState.isSubmitting}>Salvar dados</Button>
      </div>
    </form>
  );
}

export function ChangePasswordForm({ requireCurrent }: { requireCurrent: boolean }) {
  const { register, handleSubmit, formState, reset } = useForm<ChangePasswordInput>({ resolver: zodResolver(changePasswordSchema) });
  const e = formState.errors;
  return (
    <form
      noValidate
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={handleSubmit(async (data) => {
        const res = await changePasswordAction(data);
        if (res.ok) {
          toast.success(res.message ?? "Senha atualizada.");
          reset({ currentPassword: "", password: "", confirmPassword: "" });
        } else toast.error(res.error);
      })}
    >
      {requireCurrent && (
        <Field label="Senha atual" htmlFor="currentPassword" className="sm:col-span-2">
          <Input id="currentPassword" type="password" autoComplete="current-password" {...register("currentPassword")} />
        </Field>
      )}
      <Field label="Nova senha" htmlFor="newPassword" error={e.password?.message}>
        <Input id="newPassword" type="password" autoComplete="new-password" aria-invalid={!!e.password} {...register("password")} />
      </Field>
      <Field label="Confirme a nova senha" htmlFor="confirmNewPassword" error={e.confirmPassword?.message}>
        <Input id="confirmNewPassword" type="password" autoComplete="new-password" aria-invalid={!!e.confirmPassword} {...register("confirmPassword")} />
      </Field>
      <div className="sm:col-span-2">
        <Button type="submit" variant="outline" loading={formState.isSubmitting}>Alterar senha</Button>
      </div>
    </form>
  );
}
