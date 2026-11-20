import { Package } from "lucide-react";
import Link from "next/link";
import { DeleteProductButton, FlagToggle } from "@/components/admin/product-row-actions";
import { FilterBar, FilterLabel, PageHeader, Panel, Table, filterInput } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { ProductImage } from "@/components/store/product-image";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { listAdminProducts } from "@/server/services/admin/catalog-admin";
import { listCategories } from "@/server/services/catalog";

export const metadata = { title: "Produtos" };

type SP = { q?: string; category?: string; status?: string; stock?: string };

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const [products, categories] = await Promise.all([listAdminProducts(sp), listCategories()]);

  return (
    <>
      <PageHeader
        title="Produtos"
        description={`${products.length} ${products.length === 1 ? "produto" : "produtos"}`}
        actions={<Button asChild><Link href="/admin/products/new">Novo produto</Link></Button>}
      />
      <FilterBar resetHref="/admin/products">
        <FilterLabel label="Buscar">
          <input name="q" defaultValue={sp.q} placeholder="Nome ou URL" className={cn(filterInput, "w-56")} />
        </FilterLabel>
        <FilterLabel label="Categoria">
          <select name="category" defaultValue={sp.category ?? ""} className={filterInput}>
            <option value="">Todas</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </FilterLabel>
        <FilterLabel label="Status">
          <select name="status" defaultValue={sp.status ?? ""} className={filterInput}>
            <option value="">Todos</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
            <option value="sale">Em promoção</option>
          </select>
        </FilterLabel>
        <FilterLabel label="Estoque">
          <select name="stock" defaultValue={sp.stock ?? ""} className={filterInput}>
            <option value="">Qualquer</option>
            <option value="low">Com variação baixa</option>
            <option value="out">Esgotados</option>
          </select>
        </FilterLabel>
      </FilterBar>

      <Panel>
        {products.length === 0 ? (
          <EmptyState icon={<Package strokeWidth={1.25} />} title="Nenhum produto encontrado" description="Ajuste os filtros ou cadastre um novo produto." />
        ) : (
          <Table>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Preço</th>
                <th>Estoque</th>
                <th className="text-center">Ativo</th>
                <th className="text-center">Novo</th>
                <th className="text-center">Mais vendido</th>
                <th className="text-center">Destaque</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className={cn("hover:bg-concrete/40", !p.isActive && "text-smoke")}>
                  <td>
                    <div className="flex min-w-60 items-center gap-3">
                      <div className="relative h-14 w-11 shrink-0 bg-concrete">
                        {p.image && <ProductImage src={p.image} alt="" fill sizes="44px" className="object-cover" />}
                      </div>
                      <div>
                        <Link href={`/admin/products/${p.id}`} className="font-medium text-ink hover:underline">{p.name}</Link>
                        <p className="text-[12px] text-smoke">{p.category ?? "Sem categoria"} — {p.salesCount} vendidos</p>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap tabular-nums">
                    {p.salePrice != null && p.salePrice < p.price ? (
                      <>
                        <span className="font-medium">{formatPrice(p.salePrice)}</span>
                        <span className="ml-1.5 text-[12px] text-smoke line-through">{formatPrice(p.price)}</span>
                      </>
                    ) : (
                      formatPrice(p.price)
                    )}
                  </td>
                  <td className="whitespace-nowrap tabular-nums">
                    <span className={cn(p.stock === 0 && "font-medium text-danger")}>{p.stock} un.</span>
                    {p.lowVariants > 0 && p.stock > 0 && <p className="text-[12px] text-warning">{p.lowVariants} variação(ões) baixa(s)</p>}
                  </td>
                  <td className="text-center"><FlagToggle productId={p.id} flag="isActive" value={p.isActive} label={`Ativo: ${p.name}`} /></td>
                  <td className="text-center"><FlagToggle productId={p.id} flag="isNew" value={p.isNew} label={`Novo: ${p.name}`} /></td>
                  <td className="text-center"><FlagToggle productId={p.id} flag="isBestSeller" value={p.isBestSeller} label={`Mais vendido: ${p.name}`} /></td>
                  <td className="text-center"><FlagToggle productId={p.id} flag="isFeatured" value={p.isFeatured} label={`Destaque: ${p.name}`} /></td>
                  <td className="whitespace-nowrap text-right">
                    <Link href={`/admin/products/${p.id}`} className="mr-4 text-[13px] underline-offset-4 hover:underline">Editar</Link>
                    <DeleteProductButton productId={p.id} name={p.name} />
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Panel>
    </>
  );
}
