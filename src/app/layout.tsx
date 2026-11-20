import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { Toaster } from "sonner";
import { siteConfig } from "@/config/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "VANTA — Beyond the ordinary",
    template: "%s — VANTA",
  },
  description: siteConfig.description,
  applicationName: "VANTA",
  keywords: ["streetwear", "streetwear premium", "hoodie", "camiseta oversized", "moda urbana", "VANTA"],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "VANTA",
    title: "VANTA — Beyond the ordinary",
    description: siteConfig.description,
    url: siteConfig.url,
  },
  twitter: { card: "summary_large_image", title: "VANTA — Beyond the ordinary", description: siteConfig.description },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={GeistSans.variable}>
      <body className="flex min-h-dvh flex-col">
        <a href="#main" className="sr-only z-[100] bg-ink px-4 py-3 text-paper focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
          Pular para o conteúdo
        </a>
        {children}
        <Toaster
          position="bottom-center"
          toastOptions={{
            classNames: {
              toast: "!rounded-none !border-ink !bg-ink !text-paper !font-sans",
              description: "!text-paper/70",
              actionButton: "!rounded-none !bg-paper !text-ink",
            },
          }}
        />
      </body>
    </html>
  );
}
