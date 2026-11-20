import { AccountNav } from "@/components/account/account-nav";
import { requireUser } from "@/server/auth/session";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("/account");
  const first = (user.fullName ?? user.email).split(/[\s@]/)[0];
  return (
    <div className="container-x pb-24 pt-10 md:pt-14">
      <h1 className="display mb-8 break-words text-[clamp(2.25rem,7vw,5rem)] md:mb-12">Hi, {first}</h1>
      <div className="grid gap-8 md:grid-cols-[200px_1fr] md:gap-14">
        <AccountNav isAdmin={user.role === "admin"} />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
