import { AlertTriangle, BarChart3 } from "lucide-react";
import Link from "next/link";
import { HBarList, MonthlyRevenue, OrdersBars, RevenueLine } from "@/components/admin/charts";
import { GenerateDemoButton, RemoveDemoButton } from "@/components/admin/demo-data-controls";
import { OrderStatusBadge } from "@/components/admin/status-badge";
import { PageHeader, Panel, Table } from "@/components/admin/ui";
import { EmptyState } from "@/components/ui/misc";
import { ORDER_STATUS_FLOW, ORDER_STATUS_LABEL } from "@/config/orders";
import { formatDateTime, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getDashboard } from "@/server/services/admin/dashboard";
import { countDemoOrders } from "@/server/services/admin/demo-data";

const PERIODS = [7, 30, 90, 365];

function Delta({ value }: { value: number | null }) {
  if (value == null || !Number.isFinite(value)) return <span className="text-smoke">sem base anterior</span>;
  const pct = Math.round(value * 100);
  return (
    <span className={cn(pct > 0 ? "text-success" : pct < 0 ? "text-danger" : "text-smoke")}>
      {pct > 0 ? "▲" : pct < 0 ? "▼" : "•"} {Math.abs(pct)}% <span className="text-smoke">vs. período anterior</span>
    </span>
  );
}

function Kpi({ label, value, foot, href }: { label: string; value: string; foot?: React.ReactNode; href?: string }) {
  const body = (
    <>
      <p className="text-[13px] text-smoke">{label}</p>
      <p className="mt-2 text-[28px] font-semibold tracking-tight tabular-nums">{value}</p>
      {foot && <p className="mt-1 text-[12px]">{foot}</p>}
    </>
  );
  return href ? (
    <Link href={href} className="block border border-stone bg-paper p-5 transition-colors hover:border-ink">{body}</Link>
  ) : (
    <div className="border border-stone bg-paper p-5">{body}</div>
  );
}

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const days = PERIODS.includes(Number((await searchParams).days)) ? Number((await searchParams).days) : 30;
  const [data, demoCount] = await Promise.all([getDashboard(days), countDemoOrders()]);

  if (!data.hasData) {
    return (
      <>
        <PageHeader title="Visão geral" />
        <Panel>
          <EmptyState
            icon={<BarChart3 strokeWidth={1.25} />}
            title="Ainda não há pedidos"
            description="Os indicadores aparecem assim que a loja receber o primeiro pedido. Para explorar o painel agora, gere um histórico fictício de 150 dias."
            action={<GenerateDemoButton />}
          />
        </Panel>
      </>
    );
  }

  const k = data.kpis;
  const statusRows = [...ORDER_STATUS_FLOW, "cancelled" as const].map((st) => ({
    label: ORDER_STATUS_LABEL[st],
    value: data.statusDist.find((d) => d.status === st)?.value ?? 0,
  }));

  return (
    <>
      <PageHeader
        title="Visão geral"
        description="Receita e pedidos consideram apenas pedidos com pagamento aprovado."
        actions={
          <div className="flex items-center gap-2">
            {demoCount > 0 ? <RemoveDemoButton count={demoCount} /> : <GenerateDemoButton label="Gerar histórico de demonstração" />}
            <nav aria-label="Período" className="flex border border-stone bg-paper">
              {PERIODS.map((p) => (
                <Link
                  key={p}
                  href={`/admin?days=${p}`}
                  aria-current={p === days ? "true" : undefined}
                  className={cn("inline-flex h-9 items-center px-3 text-[13px]", p === days ? "bg-ink text-paper" : "hover:bg-concrete")}
                >
                  {p === 365 ? "12 meses" : `${p} dias`}
                </Link>
              ))}
            </nav>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Kpi label="Receita" value={formatPrice(k.revenue)} foot={<Delta value={k.revenueDelta} />} />
        <Kpi label="Pedidos pagos" value={String(k.orders)} foot={<Delta value={k.ordersDelta} />} href="/admin/orders" />
        <Kpi label="Ticket médio" value={formatPrice(k.avgTicket)} foot={<Delta value={k.avgTicketDelta} />} />
        <Kpi label="Produtos vendidos" value={String(k.itemsSold)} foot={<span className="text-smoke">unidades no período</span>} />
        <Kpi
          label="Variações com estoque baixo"
          value={String(k.lowStock)}
          foot={<span className={k.lowStock ? "text-warning" : "text-smoke"}>3 unidades ou menos</span>}
          href="/admin/products?stock=low"
        />
        <Kpi label="Clientes cadastrados" value={String(k.customers)} foot={<span className="text-smoke">+{k.newCustomers} no período</span>} href="/admin/customers" />
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-[1.6fr_1fr]">
        <Panel title="Receita diária">
          <div className="p-4 pt-5">
            <RevenueLine data={data.series} />
          </div>
        </Panel>
        <Panel title="Produtos mais vendidos" action={<span className="text-[12px] text-smoke">unidades</span>}>
          <div className="p-5">
            {data.topProducts.length ? (
              <HBarList rows={data.topProducts.map((p) => ({ label: p.name.replace(/^VANTA /, ""), value: p.quantity, hint: formatPrice(p.revenue) }))} />
            ) : (
              <p className="text-[14px] text-smoke">Sem vendas no período.</p>
            )}
          </div>
        </Panel>
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-3">
        <Panel title="Pedidos por dia">
          <div className="p-4 pt-5">
            <OrdersBars data={data.series} />
          </div>
        </Panel>
        <Panel title="Distribuição de pedidos por status">
          <div className="p-5">
            <HBarList rows={statusRows} />
          </div>
        </Panel>
        <Panel title="Evolução da receita (12 meses)">
          <div className="p-4 pt-5">
            <MonthlyRevenue data={data.monthly} />
          </div>
        </Panel>
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-[1.6fr_1fr]">
        <Panel title="Pedidos recentes" action={<Link href="/admin/orders" className="text-[13px] underline underline-offset-4">Ver todos</Link>}>
          <Table>
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Cliente</th>
                <th>Status</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {data.recentOrders.map((o) => (
                <tr key={o.id} className="hover:bg-concrete/50">
                  <td>
                    <Link href={`/admin/orders/${o.id}`} className="font-medium hover:underline">{o.number}</Link>
                    <p className="text-[12px] text-smoke">{formatDateTime(o.createdAt)}</p>
                  </td>
                  <td className="max-w-48 truncate">{o.customerName}</td>
                  <td><OrderStatusBadge status={o.status} /></td>
                  <td className="text-right tabular-nums">{formatPrice(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Panel>
        <Panel title="Estoque baixo" action={<Link href="/admin/products?stock=low" className="text-[13px] underline underline-offset-4">Gerenciar</Link>}>
          {data.lowStockList.length ? (
            <ul className="divide-y divide-stone">
              {data.lowStockList.map((v) => (
                <li key={v.variantId} className="flex items-center justify-between gap-3 px-5 py-3 text-[14px]">
                  <Link href={`/admin/products/${v.productId}`} className="min-w-0 hover:underline">
                    <p className="truncate font-medium">{v.name}</p>
                    <p className="text-[12px] text-smoke">{v.sku}</p>
                  </Link>
                  <span className={cn("inline-flex items-center gap-1.5 text-[13px] font-medium", v.stock === 0 ? "text-danger" : "text-warning")}>
                    <AlertTriangle className="size-3.5" />
                    {v.stock === 0 ? "Esgotado" : `${v.stock} un.`}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="p-5 text-[14px] text-smoke">Nenhuma variação com estoque baixo.</p>
          )}
        </Panel>
      </div>
    </>
  );
}
