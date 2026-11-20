import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EditorialImage } from "@/components/store/editorial-image";
import { Newsletter } from "@/components/store/newsletter";
import { ProductCard, ProductGrid } from "@/components/store/product-card";
import { ProductImage } from "@/components/store/product-image";
import { SectionHeading } from "@/components/store/section-heading";
import { editorialImages } from "@/config/site";
import { getBestSellers, getNewArrivals, listCategories } from "@/server/services/catalog";

export default async function HomePage() {
  const [newArrivals, bestSellers, categories] = await Promise.all([getNewArrivals(8), getBestSellers(8), listCategories()]);

  return (
    <>
      {/* Hero */}
      <section aria-labelledby="hero-title" className="dark-surface relative flex min-h-[100svh] items-end overflow-hidden bg-ink text-paper">
        <EditorialImage src={editorialImages.hero} alt="Modelo vestindo jaqueta preta VANTA contra parede escura" priority className="opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-ink/30" aria-hidden />
        <div className="container-x relative pb-10 pt-40 sm:pb-14">
          <h1 id="hero-title" className="display text-[clamp(3.4rem,13.2vw,13rem)]">
            {["Beyond", "the", "ordinary"].map((word, i) => (
              <span key={word} className="block overflow-hidden pb-[0.04em]">
                <span className="block animate-rise" style={{ animationDelay: `${120 + i * 110}ms` }}>
                  {word}
                </span>
              </span>
            ))}
          </h1>
          <div className="mt-8 flex animate-fade flex-col gap-6 [animation-delay:600ms] sm:flex-row sm:items-end sm:justify-between">
            <p className="max-w-sm text-[15px] leading-relaxed text-paper/80">
              Fleece de 450 g/m², algodão pesado e cortes precisos. A coleção de inverno já está no ar.
            </p>
            <Button asChild size="lg" variant="inverse" className="w-full sm:w-auto sm:min-w-56">
              <Link href="/shop">SHOP NOW</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* New arrivals */}
      <section aria-labelledby="new-title" className="container-x py-20 md:py-28">
        <SectionHeading id="new-title" title="New arrivals" href="/shop?sort=newest&new=1" />
        <div className="scrollbar-none -mx-4 flex snap-x gap-3 overflow-x-auto px-4 sm:-mx-6 sm:px-6 md:mx-0 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:px-0 xl:grid-cols-4">
          {newArrivals.map((p, i) => (
            <ProductCard key={p.id} product={p} priority={i < 2} className="w-[68vw] shrink-0 snap-start sm:w-[42vw] md:w-auto" />
          ))}
        </div>
      </section>

      {/* Editorial campaign */}
      <section aria-labelledby="campaign-title" className="grid md:grid-cols-2">
        <div className="relative aspect-[4/5] bg-graphite md:aspect-auto md:min-h-[90vh]">
          <EditorialImage src={editorialImages.campaignA} alt="Modelo em conjunto cinza sentada em banco de concreto" sizes="(min-width: 768px) 50vw, 100vw" />
        </div>
        <div className="flex flex-col justify-between gap-12 bg-paper px-4 py-16 sm:px-10 md:px-14 md:py-20 lg:px-20">
          <div>
            <h2 id="campaign-title" className="display text-[clamp(2.75rem,6.5vw,6.5rem)]">
              The
              <br />
              uniform
            </h2>
            <p className="mt-8 max-w-md text-[16px] leading-relaxed text-graphite">
              Cinza, preto e osso. Peças que funcionam juntas sem esforço, feitas em São Paulo com malhas que ficam melhores
              a cada lavagem. Menos escolhas, mais uso.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/shop/hoodies">Ver hoodies</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/shop/pants">Ver calças</Link>
              </Button>
            </div>
          </div>
          <div className="relative hidden aspect-[16/10] w-full max-w-lg self-end bg-graphite md:block">
            <EditorialImage src={editorialImages.campaignB} alt="Modelo de preto encostada em parede clara" sizes="35vw" />
          </div>
        </div>
      </section>

      {/* Shop by category */}
      <section aria-labelledby="categories-title" className="container-x py-20 md:py-28">
        <SectionHeading id="categories-title" title="Shop by category" href="/shop" linkLabel="Shop all" />
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
          {categories.map((c) => (
            <li key={c.id}>
              <Link href={`/shop/${c.slug}`} className="group relative block aspect-square overflow-hidden bg-concrete md:aspect-[4/3]">
                {c.imageUrl && (
                  <ProductImage
                    src={c.imageUrl}
                    alt=""
                    fill
                    sizes="(min-width: 768px) 33vw, 50vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                  />
                )}
                <span className="display-tight absolute bottom-3 left-3 text-[clamp(1.25rem,3vw,2.25rem)] leading-none sm:bottom-5 sm:left-5">
                  {c.name}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Best sellers */}
      <section aria-labelledby="best-title" className="container-x pb-20 md:pb-28">
        <SectionHeading id="best-title" title="Best sellers" href="/shop?sort=best-sellers" />
        <ProductGrid products={bestSellers} />
      </section>

      {/* Collection banner */}
      <section aria-labelledby="collection-title" className="dark-surface relative overflow-hidden bg-ink text-paper">
        <EditorialImage src={editorialImages.collection} alt="Fachada de loja com porta de aço fechada" className="opacity-55" />
        <div className="container-x relative flex min-h-[70vh] flex-col justify-end py-14 md:min-h-[80vh] md:py-20">
          <p className="text-[14px] text-paper/70">Coleção Heavyweight</p>
          <h2 id="collection-title" className="display mt-3 text-[clamp(3rem,10vw,9.5rem)]">
            Built
            <br />
            to last
          </h2>
          <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <p className="max-w-md text-[15px] leading-relaxed text-paper/80">
              Moletons e crewnecks em fleece escovado de alta gramatura, com ribanas largas e costuras reforçadas.
            </p>
            <Button asChild size="lg" variant="outline-inverse" className="sm:min-w-56">
              <Link href="/shop/sweatshirts">Explorar a coleção</Link>
            </Button>
          </div>
        </div>
      </section>

      <Newsletter />
    </>
  );
}
