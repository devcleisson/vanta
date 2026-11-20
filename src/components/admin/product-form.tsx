"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDown, ArrowUp, ImagePlus, Link2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { ProductImage } from "@/components/store/product-image";
import { cn, slugify } from "@/lib/utils";
import { productFormSchema, type ProductFormInput } from "@/schemas/admin";
import { saveProductAction, uploadImageAction } from "@/server/actions/admin";
import { DeleteProductButton } from "./product-row-actions";

type Options = {
  categories: { id: string; name: string }[];
  sizes: { id: string; label: string }[];
  colors: { id: string; name: string; hex: string }[];
};

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-6 border-t border-stone py-8 lg:grid-cols-[260px_1fr]">
      <div>
        <h2 className="text-[15px] font-semibold">{title}</h2>
        {description && <p className="mt-1 text-[13px] leading-relaxed text-smoke">{description}</p>}
      </div>
      <div>{children}</div>
    </section>
  );
}

export function ProductForm({ options, defaults, productId }: { options: Options; defaults?: ProductFormInput; productId?: string }) {
  const router = useRouter();
  const [slugEdited, setSlugEdited] = useState(Boolean(productId));
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProductFormInput>({
    resolver: zodResolver(productFormSchema),
    defaultValues: defaults ?? {
      name: "",
      slug: "",
      description: "",
      details: "",
      categoryId: "",
      price: "" as unknown as number,
      salePrice: "",
      isActive: true,
      isNew: true,
      isBestSeller: false,
      isFeatured: false,
      variants: [],
      images: [],
    },
  });
  const { register, control, setValue, handleSubmit, formState, getValues } = form;
  const errors = formState.errors;
  const variants = useFieldArray({ control, name: "variants" });
  const images = useFieldArray({ control, name: "images" });
  const watchedVariants = useWatch({ control, name: "variants" }) ?? [];
  const watchedImages = useWatch({ control, name: "images" }) ?? [];
  const slug = useWatch({ control, name: "slug" });
  const flags = useWatch({ control, name: ["isActive", "isNew", "isBestSeller", "isFeatured"] });

  const selectedSizes = [...new Set(watchedVariants.map((v) => v.sizeId))];
  const selectedColors = [...new Set(watchedVariants.map((v) => v.colorId))];

  /** Rebuilds the variant matrix (size × colour), keeping stock/SKU of combinations that remain. */
  const rebuildMatrix = (sizeIds: string[], colorIds: string[]) => {
    const current = getValues("variants");
    const base = (getValues("slug") || slugify(getValues("name")) || "produto").replace(/^vanta-/, "").toUpperCase();
    const next = [];
    for (const colorId of colorIds) {
      for (const sizeId of sizeIds) {
        const existing = current.find((v) => v.sizeId === sizeId && v.colorId === colorId);
        const size = options.sizes.find((s) => s.id === sizeId)!;
        const color = options.colors.find((c) => c.id === colorId)!;
        next.push(
          existing ?? {
            sizeId,
            colorId,
            sku: `VNT-${base}-${slugify(color.name).toUpperCase().slice(0, 3)}-${size.label === "Único" ? "UN" : size.label.toUpperCase()}`,
            stock: 0,
          },
        );
      }
    }
    variants.replace(next);
  };

  const toggleSize = (id: string) =>
    rebuildMatrix(selectedSizes.includes(id) ? selectedSizes.filter((s) => s !== id) : options.sizes.map((s) => s.id).filter((s) => s === id || selectedSizes.includes(s)), selectedColors);
  const toggleColor = (id: string) =>
    rebuildMatrix(selectedSizes, selectedColors.includes(id) ? selectedColors.filter((c) => c !== id) : [...selectedColors, id]);

  const onUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", file);
      const res = await uploadImageAction(fd);
      if (res.ok) images.append({ url: res.data.url, alt: getValues("name"), colorId: selectedColors[0] ?? null });
      else toast.error(`${file.name}: ${res.error}`);
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const onSubmit = handleSubmit(async (data) => {
    const res = await saveProductAction(data, productId);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(res.message ?? "Produto salvo.");
    if (!productId) router.replace(`/admin/products/${res.data.id}`);
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <Section title="Informações" description="Nome, URL amigável e textos exibidos na página do produto.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome" htmlFor="name" error={errors.name?.message}>
            <Input
              id="name"
              aria-invalid={!!errors.name}
              {...register("name", {
                onChange: (e) => {
                  if (!slugEdited) setValue("slug", slugify(e.target.value));
                },
              })}
            />
          </Field>
          <Field label="URL" htmlFor="slug" error={errors.slug?.message} hint={`/products/${slug || "…"}`}>
            <Input id="slug" aria-invalid={!!errors.slug} {...register("slug", { onChange: () => setSlugEdited(true) })} />
          </Field>
          <Field label="Categoria" htmlFor="categoryId" error={errors.categoryId?.message}>
            <Select id="categoryId" aria-invalid={!!errors.categoryId} {...register("categoryId")}>
              <option value="">Selecione</option>
              {options.categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </Field>
          <div />
          <Field label="Descrição" htmlFor="description" error={errors.description?.message} className="sm:col-span-2">
            <Textarea id="description" rows={4} aria-invalid={!!errors.description} {...register("description")} />
          </Field>
          <Field label="Detalhes e cuidados" htmlFor="details" hint="Um item por linha." optional className="sm:col-span-2">
            <Textarea id="details" rows={4} {...register("details")} />
          </Field>
        </div>
      </Section>

      <Section title="Preço e promoção" description="Valores em reais. O preço promocional, quando preenchido, aparece com o preço original riscado.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Preço (R$)" htmlFor="price" error={errors.price?.message}>
            <Input id="price" type="number" step="0.01" min="0" inputMode="decimal" aria-invalid={!!errors.price} {...register("price")} />
          </Field>
          <Field label="Preço promocional (R$)" htmlFor="salePrice" error={errors.salePrice?.message} optional>
            <Input id="salePrice" type="number" step="0.01" min="0" inputMode="decimal" aria-invalid={!!errors.salePrice} {...register("salePrice")} />
          </Field>
        </div>
      </Section>

      <Section title="Visibilidade" description="Controla onde o produto aparece na loja.">
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ["isActive", "Ativo na loja", "Desative para esconder sem excluir."],
              ["isNew", "Novo", "Selo “Novo” e seção New arrivals."],
              ["isBestSeller", "Mais vendido", "Prioridade na seção Best sellers."],
              ["isFeatured", "Destaque", "Prioridade em Complete the look."],
            ] as const
          ).map(([key, label, hint], i) => (
            <label key={key} className="flex cursor-pointer gap-3 border border-stone p-4 hover:border-smoke">
              <Checkbox checked={Boolean(flags[i])} onCheckedChange={(v) => setValue(key, Boolean(v), { shouldDirty: true })} className="mt-0.5" />
              <span>
                <span className="block text-[14px] font-medium">{label}</span>
                <span className="block text-[13px] text-smoke">{hint}</span>
              </span>
            </label>
          ))}
        </div>
      </Section>

      <Section title="Variações e estoque" description="Escolha tamanhos e cores. Cada combinação vira uma variação com SKU e estoque próprios.">
        <div className="space-y-6">
          <div>
            <p className="mb-2 text-[13px] font-medium">Tamanhos</p>
            <div className="flex flex-wrap gap-1.5">
              {options.sizes.map((s) => {
                const on = selectedSizes.includes(s.id);
                return (
                  <button key={s.id} type="button" aria-pressed={on} onClick={() => toggleSize(s.id)} className={cn("h-10 min-w-12 border px-3 text-[13px] font-medium", on ? "border-ink bg-ink text-paper" : "border-stone hover:border-ink")}>
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <p className="mb-2 text-[13px] font-medium">Cores</p>
            <div className="flex flex-wrap gap-1.5">
              {options.colors.map((c) => {
                const on = selectedColors.includes(c.id);
                return (
                  <button key={c.id} type="button" aria-pressed={on} onClick={() => toggleColor(c.id)} className={cn("inline-flex h-10 items-center gap-2 border px-3 text-[13px]", on ? "border-ink bg-ink text-paper" : "border-stone hover:border-ink")}>
                    <span className="size-3.5 rounded-full ring-1 ring-current/30" style={{ backgroundColor: c.hex }} />
                    {c.name}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-[12px] text-smoke">
              Faltando um tamanho ou cor? <Link href="/admin/attributes" className="underline">Gerencie os atributos</Link>.
            </p>
          </div>

          {errors.variants && <p className="text-[13px] text-danger" role="alert">{errors.variants.message ?? errors.variants.root?.message ?? "Revise as variações."}</p>}

          {variants.fields.length > 0 && (
            <div className="overflow-x-auto border border-stone">
              <table className="w-full min-w-[520px] text-[14px]">
                <thead className="bg-concrete/60 text-left text-[12px] text-smoke">
                  <tr>
                    <th className="h-10 px-3 font-medium">Variação</th>
                    <th className="px-3 font-medium">SKU</th>
                    <th className="w-32 px-3 font-medium">Estoque</th>
                  </tr>
                </thead>
                <tbody>
                  {variants.fields.map((field, i) => {
                    const v = watchedVariants[i] ?? field;
                    const size = options.sizes.find((s) => s.id === v.sizeId);
                    const color = options.colors.find((c) => c.id === v.colorId);
                    const stock = Number(v.stock);
                    return (
                      <tr key={field.id} className="border-t border-stone">
                        <td className="px-3 py-2">
                          <span className="inline-flex items-center gap-2">
                            <span className="size-3 rounded-full ring-1 ring-ink/20" style={{ backgroundColor: color?.hex }} />
                            {color?.name} / {size?.label}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <input aria-label={`SKU ${color?.name} ${size?.label}`} className="h-9 w-full border border-stone px-2 font-mono text-[12px] uppercase outline-none focus:border-ink" {...register(`variants.${i}.sku`)} />
                          {errors.variants?.[i]?.sku && <p className="mt-1 text-[12px] text-danger">{errors.variants[i]?.sku?.message}</p>}
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min={0}
                            aria-label={`Estoque ${color?.name} ${size?.label}`}
                            className={cn("h-9 w-full border px-2 text-right tabular-nums outline-none focus:border-ink", stock === 0 ? "border-danger/50" : stock <= 3 ? "border-warning/60" : "border-stone")}
                            {...register(`variants.${i}.stock`)}
                          />
                          {errors.variants?.[i]?.stock && <p className="mt-1 text-[12px] text-danger">{errors.variants[i]?.stock?.message}</p>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-stone bg-concrete/40 text-[13px]">
                    <td className="px-3 py-2 font-medium" colSpan={2}>Total em estoque</td>
                    <td className="px-3 py-2 text-right font-medium tabular-nums">{watchedVariants.reduce((n, v) => n + (Number(v.stock) || 0), 0)} un.</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </Section>

      <Section title="Imagens" description="A primeira imagem de cada cor é a principal; a segunda aparece ao passar o mouse no catálogo. JPG, PNG, WebP ou AVIF até 5 MB.">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple className="sr-only" id="image-upload" onChange={(e) => onUpload(e.target.files)} />
            <Button type="button" variant="outline" loading={uploading} onClick={() => fileRef.current?.click()}>
              <ImagePlus /> Enviar imagens
            </Button>
            <div className="flex min-w-64 flex-1 gap-2">
              <label htmlFor="image-url" className="sr-only">URL da imagem</label>
              <Input id="image-url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="ou cole a URL de uma imagem" className="h-11" />
              <Button
                type="button"
                variant="outline"
                className="h-11"
                disabled={!/^(https:\/\/|\/)/.test(imageUrl.trim())}
                onClick={() => {
                  images.append({ url: imageUrl.trim(), alt: getValues("name"), colorId: selectedColors[0] ?? null });
                  setImageUrl("");
                }}
              >
                <Link2 /> Adicionar
              </Button>
            </div>
          </div>

          {images.fields.length === 0 ? (
            <p className="border border-dashed border-stone p-8 text-center text-[14px] text-smoke">Nenhuma imagem ainda.</p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {images.fields.map((field, i) => {
                const img = watchedImages[i] ?? field;
                return (
                  <li key={field.id} className="flex gap-3 border border-stone p-2">
                    <div className="relative h-28 w-22 shrink-0 bg-concrete">
                      <ProductImage src={img.url} alt={img.alt ?? ""} fill sizes="88px" className="object-cover" />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <select aria-label="Cor da imagem" className="h-9 border border-stone bg-paper px-2 text-[13px] outline-none focus:border-ink" {...register(`images.${i}.colorId`, { setValueAs: (v) => (v ? v : null) })}>
                        <option value="">Todas as cores</option>
                        {options.colors.filter((c) => selectedColors.includes(c.id) || c.id === img.colorId).map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <input aria-label="Texto alternativo" placeholder="Texto alternativo" className="h-9 border border-stone px-2 text-[13px] outline-none focus:border-ink" {...register(`images.${i}.alt`)} />
                      <div className="mt-auto flex gap-1">
                        <button type="button" className="inline-flex size-8 items-center justify-center hover:bg-concrete disabled:opacity-30" disabled={i === 0} onClick={() => images.move(i, i - 1)} aria-label="Mover para cima"><ArrowUp className="size-4" /></button>
                        <button type="button" className="inline-flex size-8 items-center justify-center hover:bg-concrete disabled:opacity-30" disabled={i === images.fields.length - 1} onClick={() => images.move(i, i + 1)} aria-label="Mover para baixo"><ArrowDown className="size-4" /></button>
                        <button type="button" className="ml-auto inline-flex size-8 items-center justify-center text-danger hover:bg-danger/5" onClick={() => images.remove(i)} aria-label="Remover imagem"><Trash2 className="size-4" /></button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Section>

      <div className="sticky bottom-0 z-10 -mx-4 flex items-center justify-between gap-3 border-t border-stone bg-paper/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
        <div>{productId && <DeleteProductButton productId={productId} name={getValues("name")} redirectTo="/admin/products" />}</div>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={() => router.push("/admin/products")}>Cancelar</Button>
          <Button type="submit" loading={formState.isSubmitting}>{productId ? "Salvar alterações" : "Criar produto"}</Button>
        </div>
      </div>
    </form>
  );
}
