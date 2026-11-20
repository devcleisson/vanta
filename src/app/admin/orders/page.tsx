import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { OrderStatusBadge } from "@/components/admin/status-badge";
import { FilterBar, FilterLabel, PageHeader, Panel, Table, filterInput } from "@/components/admin/ui";
import { EmptyState } from "@/components/ui/misc";
import { ORDER_STATUS_LABEL } from "@/config/orders";
import { formatDateTime, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { orderStatusValues } from "@/schemas/admin";
import { listAdminOrders } from "@/server/services/admin/orders-admin";

export const metadata = { title: "Pedidos" };

type SP = { q?: string; status?: string; from?: string; to?: string; page?: string };

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const status = orderStatusValues.includes(sp.status as never) ? sp.status : undefined;
  const data = await listAdminOrders({ ...sp, status, page: Number(sp.page) || 1 });
  const qs = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...sp, ...patch })) if (v) p.set(k, v);
    const s = p.toString();
    return `/admin/orders${s ? `?${s}` : ""}`;
  };
  const totalAll = data.counts.reduce((n, c) => n + c.n, 0);

  return (
    <>
      <PageHeader title="Pedidos" description={`${data.total} ${data.total === 1 ? "pedido" : "pedidos"} encontrados`} />

      <nav aria-label="Filtrar por status" className="scrollbar-none mb-5 flex gap-1 overflow-x-auto border-b border-stone">
        {[undefined, ...orderStatusValues].map((s) => {
          const n = s ? data.counts.find((c) => c.status === s)?.n ?? 0 : totalAll;
          const active = status === s;
          return (
            <Link
              key={s ?? "all"}
              href={qs({ status: s, page: undefined })}
              aria-current={active ? "page" : undefined}
              className={cn("-mb-px shrink-0 whitespace-nowrap border-b-2 px-3 py-2.5 text-[13px]", active ? "border-ink font-semibold" : "border-transparent text-smoke hover:text-ink")}
            >
              {s ? ORDER_STATUS_LABEL[s] : "Todos"} <span className="tabular-nums text-smoke">{n}</span>
            </Link>
          );
        })}
      </nav>

      <FilterBar resetHref="/admin/orders">
        {status && <input type="hidden" name="status" value={status} />}
        <FilterLabel label="Buscar">
          <input name="q" defaultValue={sp.q} placeholder="Número, nome ou e-mail" className={cn(filterInput, "w-64")} />
        </FilterLabel>
        <FilterLabel label="De">
          <input type="date" name="from" defaultValue={sp.from} className={filterInput} />
        </FilterLabel>
        <FilterLabel label="Até">
          <input type="date" name="to" defaultValue={sp.to} className={filterInput} />
        </FilterLabel>
      </FilterBar>

      <Panel>
        {data.rows.length === 0 ? (
          <EmptyState icon={<ShoppingCart strokeWidth={1.25} />} title="Nenhum pedido encontrado" description="Ajuste a busca ou os filtros." />
        ) : (
          <Table>
            <thead>
              <tr><th>Pedido</th><th>Data</th><th>Cliente</th><th>Itens</th><th>Pagamento</th><th>Status</th><th className="text-right">Total</th></tr>
            </thead>
            <tbody>
              {data.rows.map((o) => (
                <tr key={o.id} className="hover:bg-concrete/40">
                  <td><Link href={`/admin/orders/${o.id}`} className="font-medium hover:underline">{o.number}</Link></td>
                  <td className="whitespace-nowrap text-smoke">{formatDateTime(o.createdAt)}</td>
                  <td><p className="max-w-52 truncate">{o.customerName}</p><p className="max-w-52 truncate text-[12px] text-smoke">{o.email}</p></td>
                  <td className="tabular-nums">{o.items}</td>
                  <td className="text-smoke">{o.paymentProvider === "stripe" ? "Stripe (teste)" : o.paymentProvider === "simulated" ? "Simulado" : "—"}</td>
                  <td><OrderStatusBadge status={o.status} /></td>
                  <td className="text-right font-medium tabular-nums">{formatPrice(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Panel>

      {data.pageCount > 1 && (
        <nav aria-label="Paginação" className="mt-5 flex items-center justify-between text-[13px]">
          <span className="text-smoke">Página {data.page} de {data.pageCount}</span>
          <div className="flex gap-2">
            {data.page > 1 && <Link href={qs({ page: String(data.page - 1) })} className="border border-stone bg-paper px-3 py-2 hover:border-ink">Anterior</Link>}
            {data.page < data.pageCount && <Link href={qs({ page: String(data.page + 1) })} className="border border-stone bg-paper px-3 py-2 hover:border-ink">Próxima</Link>}
          </div>
        </nav>
      )}
    </>
  );
}
