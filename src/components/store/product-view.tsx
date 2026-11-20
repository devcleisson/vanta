"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Accordion, AccordionItem } from "@/components/ui/accordion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { siteConfig } from "@/config/site";
import { formatPrice } from "@/lib/format";
import type { ProductDetailData } from "@/types/catalog";
import { Price } from "./price";
import { ProductGallery } from "./product-gallery";
import { ProductPurchase, useVariantSelection } from "./product-purchase";
import { SizeGuideTables } from "./size-guide";

export function ProductView({ product }: { product: ProductDetailData }) {
  const selection = useVariantSelection(product);
  const [guideOpen, setGuideOpen] = useState(false);

  const images = useMemo(() => {
    const forColor = product.images.filter((i) => i.colorId === selection.colorId);
    return forColor.length ? forColor : product.images;
  }, [product.images, selection.colorId]);

  return (
    <div className="grid gap-8 md:grid-cols-[1.35fr_1fr] md:gap-10 lg:gap-16">
      <div className="-mx-4 sm:-mx-6 md:mx-0">
        <ProductGallery images={images} name={product.name} />
      </div>

      <div className="md:sticky md:top-24 md:self-start">
        <nav aria-label="Trilha" className="mb-5 text-[13px] text-smoke">
          <Link href="/shop" className="link-underline">Shop</Link>
          {product.category && (
            <>
              <span className="mx-2">/</span>
              <Link href={`/shop/${product.category.slug}`} className="link-underline">{product.category.name}</Link>
            </>
          )}
        </nav>
        {product.isNew && <p className="mb-3 inline-block bg-ink px-2 py-1 text-[11px] font-semibold text-paper">Novo</p>}
        <h1 className="display-tight text-[32px] leading-[0.95] sm:text-[40px]">{product.name}</h1>
        <Price price={product.price} salePrice={product.salePrice} size="lg" className="mt-4" />
        <p className="mt-1 text-[13px] text-smoke">
          ou 3× de {formatPrice(Math.ceil((product.salePrice && product.salePrice < product.price ? product.salePrice : product.price) / 3))} sem juros
        </p>

        <div className="mt-8">
          <ProductPurchase product={product} selection={selection} onOpenSizeGuide={() => setGuideOpen(true)} />
        </div>

        <Accordion type="multiple" defaultValue={["description"]} className="mt-10 border-t border-stone">
          <AccordionItem value="description" title="Descrição">
            <p>{product.description}</p>
          </AccordionItem>
          <AccordionItem value="details" title="Composição e cuidados">
            <ul className="list-disc space-y-1 pl-5">
              {product.details.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </AccordionItem>
          <AccordionItem value="shipping" title="Envio">
            <p>
              Frete grátis na modalidade Econômica para compras acima de {formatPrice(siteConfig.freeShippingFrom)}. Pedidos
              aprovados até 14h saem no mesmo dia útil. Calcule o prazo exato para o seu CEP no carrinho.
            </p>
            <Link href="/help/envio" className="mt-2 inline-block underline underline-offset-4">Prazos por região</Link>
          </AccordionItem>
          <AccordionItem value="returns" title="Trocas e devoluções">
            <p>
              Primeira troca grátis em até 30 dias após o recebimento. Devoluções por arrependimento em até 7 dias, com
              reembolso integral. A peça deve estar sem uso e com etiqueta.
            </p>
            <Link href="/help/trocas-e-devolucoes" className="mt-2 inline-block underline underline-offset-4">Política completa</Link>
          </AccordionItem>
          <AccordionItem value="guide" title="Guia de tamanhos">
            <button type="button" onClick={() => setGuideOpen(true)} className="underline underline-offset-4">
              Abrir tabela de medidas
            </button>
          </AccordionItem>
        </Accordion>
      </div>

      <Dialog open={guideOpen} onOpenChange={setGuideOpen}>
        <DialogContent title="Guia de tamanhos" description="Medidas da peça em centímetros." className="max-w-2xl">
          <SizeGuideTables />
        </DialogContent>
      </Dialog>
    </div>
  );
}
