import type { Metadata } from "next";
import { FavoritesClient } from "@/components/store/favorites-page";
import { getCurrentUser } from "@/server/auth/session";

export const metadata: Metadata = { title: "Favoritos", robots: { index: false } };

export default async function FavoritesPage() {
  const user = await getCurrentUser();
  return (
    <div className="container-x pb-24 pt-10 md:pt-14">
      <h1 className="display mb-10 text-[clamp(2.5rem,7vw,5.5rem)]">Wishlist</h1>
      <FavoritesClient signedIn={Boolean(user)} />
    </div>
  );
}
