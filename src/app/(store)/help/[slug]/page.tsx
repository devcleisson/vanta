import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { helpPages } from "@/config/help";
import { cn } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = helpPages[(await params).slug];
  return page ? { title: page.title, description: page.description, alternates: { canonical: `/help/${(await params).slug}` } } : { title: "Página não encontrada" };
}

export default async function HelpPage({ params }: Props) {
  const { slug } = await params;
  const page = helpPages[slug];
  if (!page) notFound();
  return (
    <div className="container-x grid gap-10 pb-24 pt-10 md:grid-cols-[220px_1fr] md:pt-14">
      <nav aria-label="Ajuda" className="order-2 md:order-1">
        <ul className="space-y-1 text-[14px]">
          {Object.entries(helpPages).map(([key, p]) => (
            <li key={key}>
              <Link href={`/help/${key}`} aria-current={key === slug ? "page" : undefined} className={cn("block py-1.5", key === slug ? "font-semibold" : "text-graphite hover:text-ink")}>
                {p.title}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <article className="order-1 max-w-2xl md:order-2">
        <h1 className="display mb-3 text-[clamp(2.5rem,7vw,5rem)]">{page.heading}</h1>
        <p className="mb-10 text-[15px] text-smoke">{page.title}</p>
        {page.body}
      </article>
    </div>
  );
}
