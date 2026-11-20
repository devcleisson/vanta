import { AccountSync } from "@/components/layout/account-sync";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { CartDrawer } from "@/components/store/cart-drawer";
import { QuickView } from "@/components/store/quick-view";
import { getCurrentUser } from "@/server/auth/session";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <>
      <Header user={user ? { name: user.fullName ?? user.email, role: user.role } : null} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
      <CartDrawer />
      <QuickView />
      <AccountSync userId={user?.id ?? null} />
    </>
  );
}
