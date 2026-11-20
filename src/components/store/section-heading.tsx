import Link from "next/link";

export function SectionHeading({ title, href, linkLabel, id }: { title: string; href?: string; linkLabel?: string; id?: string }) {
  return (
    <div className="mb-8 flex items-end justify-between gap-6 md:mb-10">
      <h2 id={id} className="display text-[clamp(2rem,5.2vw,4.25rem)]">{title}</h2>
      {href && (
        <Link href={href} className="link-underline shrink-0 pb-1 text-[14px] font-medium">
          {linkLabel ?? "Ver tudo"}
        </Link>
      )}
    </div>
  );
}
