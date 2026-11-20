import Link from "next/link";
import { mainNav, siteConfig } from "@/config/site";

const groups = [
  { title: "Loja", links: mainNav.slice(0, 1).concat(mainNav.slice(2)) },
  {
    title: "Ajuda",
    links: [
      { label: "Envio e prazos", href: "/help/envio" },
      { label: "Trocas e devoluções", href: "/help/trocas-e-devolucoes" },
      { label: "Guia de tamanhos", href: "/help/guia-de-tamanhos" },
      { label: "Fale conosco", href: "/help/contato" },
    ],
  },
  {
    title: "VANTA",
    links: [
      { label: "Sobre a marca", href: "/help/sobre" },
      { label: "Minha conta", href: "/account" },
      { label: "Privacidade", href: "/help/privacidade" },
      { label: "Termos de uso", href: "/help/termos" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="dark-surface mt-auto overflow-hidden bg-ink text-paper">
      <div className="container-x grid gap-10 pb-14 pt-16 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="max-w-sm">
          <p className="text-[15px] leading-relaxed text-paper/70">{siteConfig.description}</p>
          <p className="mt-6 text-[13px] text-paper/50">
            Atendimento de segunda a sexta, 9h às 18h
            <br />
            <a href={`mailto:${siteConfig.email}`} className="link-underline text-paper">
              {siteConfig.email}
            </a>
          </p>
        </div>
        {groups.map((g) => (
          <nav key={g.title} aria-label={g.title}>
            <p className="text-[13px] text-paper/50">{g.title}</p>
            <ul className="mt-4 space-y-2.5 text-[14px]">
              {g.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="link-underline">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="container-x flex flex-col gap-3 border-t border-paper/15 py-6 text-[12px] text-paper/50 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} VANTA. Marca fictícia criada para portfólio.</p>
        <p>Pagamentos processados em ambiente de teste. Nenhuma cobrança real é feita.</p>
      </div>
      <p
        aria-hidden
        className="display pointer-events-none select-none whitespace-nowrap text-center text-[25.5vw] leading-[0.74] text-paper"
        style={{ marginBottom: "-0.06em" }}
      >
        VANTA
      </p>
    </footer>
  );
}
