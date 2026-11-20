"use client";

import { Dialog as D } from "radix-ui";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { ProductImage } from "./product-image";

type Img = { id: string; url: string; alt: string };

export function ProductGallery({ images, name }: { images: Img[]; name: string }) {
  const [zoomIndex, setZoomIndex] = useState<number | null>(null);
  const [active, setActive] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActive(0);
    scroller.current?.scrollTo({ left: 0 });
  }, [images]);

  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    setActive(Math.round(el.scrollLeft / el.clientWidth));
  };

  if (!images.length) return <div className="aspect-[4/5] bg-concrete" />;

  return (
    <>
      {/* Mobile: swipeable carousel */}
      <div className="relative md:hidden">
        <div ref={scroller} onScroll={onScroll} className="scrollbar-none flex snap-x snap-mandatory overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setZoomIndex(i)}
              className="relative aspect-[4/5] w-full shrink-0 snap-center bg-concrete"
              aria-label={`Ampliar imagem ${i + 1} de ${images.length}`}
            >
              <ProductImage src={img.url} alt={img.alt} fill priority={i === 0} sizes="100vw" className="object-cover" />
            </button>
          ))}
        </div>
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5" aria-hidden>
            {images.map((img, i) => (
              <span key={img.id} className={cn("h-0.5 w-5 bg-ink/25 transition-colors", i === active && "bg-ink")} />
            ))}
          </div>
        )}
      </div>

      {/* Desktop: editorial grid */}
      <div className="hidden gap-1.5 md:grid md:grid-cols-2">
        {images.map((img, i) => (
          <button
            key={img.id}
            type="button"
            onClick={() => setZoomIndex(i)}
            className={cn(
              "group relative aspect-[4/5] cursor-zoom-in overflow-hidden bg-concrete",
              images.length % 2 === 1 && i === 0 && "col-span-2 aspect-[4/3]",
            )}
            aria-label={`Ampliar imagem ${i + 1} de ${images.length}`}
          >
            <ProductImage
              src={img.url}
              alt={img.alt}
              fill
              priority={i < 2}
              sizes="(min-width: 1280px) 30vw, 45vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.025]"
            />
            <span className="absolute bottom-3 right-3 inline-flex size-9 items-center justify-center bg-paper/80 opacity-0 transition-opacity group-hover:opacity-100">
              <ZoomIn className="size-4" />
            </span>
          </button>
        ))}
      </div>

      <Lightbox images={images} index={zoomIndex} onIndexChange={setZoomIndex} name={name} />
    </>
  );
}

function Lightbox({
  images,
  index,
  onIndexChange,
  name,
}: {
  images: Img[];
  index: number | null;
  onIndexChange: (i: number | null) => void;
  name: string;
}) {
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  const open = index !== null;
  const img = open ? images[index] : null;

  const go = (dir: 1 | -1) => {
    if (index === null) return;
    setZoomed(false);
    onIndexChange((index + dir + images.length) % images.length);
  };

  return (
    <D.Root open={open} onOpenChange={(o) => !o && (onIndexChange(null), setZoomed(false))}>
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-50 bg-concrete data-[state=open]:animate-fade" />
        <D.Content
          className="fixed inset-0 z-50 flex outline-none data-[state=open]:animate-fade"
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") go(1);
            if (e.key === "ArrowLeft") go(-1);
          }}
        >
          <D.Title className="sr-only">{name} — visualização ampliada</D.Title>
          <D.Description className="sr-only">Use as setas para navegar e clique na imagem para aproximar.</D.Description>
          {img && (
            <div
              className={cn("relative h-full w-full overflow-hidden", zoomed ? "cursor-zoom-out" : "cursor-zoom-in")}
              onClick={() => setZoomed((z) => !z)}
              onMouseMove={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`);
              }}
            >
              <ProductImage
                src={img.url}
                alt={img.alt}
                fill
                sizes="100vw"
                className="object-contain transition-transform duration-300 ease-out"
                style={{ transform: zoomed ? "scale(2.2)" : "scale(1)", transformOrigin: origin }}
              />
            </div>
          )}
          <D.Close className="absolute right-4 top-4 inline-flex size-12 items-center justify-center bg-paper hover:bg-stone" aria-label="Fechar">
            <X className="size-5" />
          </D.Close>
          {images.length > 1 && (
            <>
              <button onClick={() => go(-1)} className="absolute left-4 top-1/2 inline-flex size-12 -translate-y-1/2 items-center justify-center bg-paper hover:bg-stone" aria-label="Imagem anterior">
                <ChevronLeft className="size-5" />
              </button>
              <button onClick={() => go(1)} className="absolute right-4 top-1/2 inline-flex size-12 -translate-y-1/2 items-center justify-center bg-paper hover:bg-stone" aria-label="Próxima imagem">
                <ChevronRight className="size-5" />
              </button>
              <p className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-paper px-3 py-1.5 text-[13px] tabular-nums">
                {(index ?? 0) + 1} / {images.length}
              </p>
            </>
          )}
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}
