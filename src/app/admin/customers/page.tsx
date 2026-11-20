import { Users } from "lucide-react";
import Link from "next/link";
import { FilterBar, FilterLabel, PageHeader, Panel, Table, filterInput } from "@/components/admin/ui";
import { Badge, EmptyState } from "@/components/ui/misc";
import { formatDate, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { listCustomers } from "@/server/services/admin/customers-admin";

export const metadata = { title: "Clientes" };

type SP = { q?: string; segment?: string; sort?: string };

export default async function CustomersPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const customers = await listCustomers(sp);
  return (
    <>
      <PageHeader title="Clientes" description={`${customers.length} ${customers.length === 1 ? "conta" : "contas"}`} />
      <FilterBar resetHref="/admin/customers">
        <FilterLabel label="Buscar">
          <input name="q" defaultValue={sp.q} placeholder="Nome ou e-mail" className={cn(filterInput, "w-64")} />
        </FilterLabel>
        <FilterLabel label="Segmento">
          <select name="segment" defaultValue={sp.segment ?? ""} className={filterInput}>
            <option value="">Todos</option>
            <option value="buyers">Com pedidos</option>
            <option value="no-orders">Sem pedidos</option>
            <option value="admins">Administradores</option>
          </select>
        </FilterLabel>
        <FilterLabel label="Ordenar">
          <select name="sort" defaultValue={sp.sort ?? ""} className={filterInput}>
            <option value="">Cadastro mais recente</option>
            <option value="spent">Maior valor gasto</option>
            <option value="orders">Mais pedidos</option>
            <option value="name">Nome</option>
          </select>
        </FilterLabel>
      </FilterBar>
      <Panel>
        {customers.length === 0 ? (
          <EmptyState icon={<Users strokeWidth={1.25} />} title="Nenhum cliente encontrado" />
        ) : (
          <Table>
            <thead><tr><th>Cliente</th><th>Cadastro</th><th>Pedidos</th><th>Total gasto</th><th>Último pedido</th></tr></thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-concrete/40">
                  <td>
                    <Link href={`/admin/customers/${c.id}`} className="font-medium hover:underline">{c.fullName ?? "Sem nome"}</Link>
                    {c.role === "admin" && <Badge tone="ink" className="ml-2">Admin</Badge>}
                    <p className="text-[12px] text-smoke">{c.email}</p>
                  </td>
                  <td className="whitespace-nowrap text-smoke">{formatDate(c.createdAt)}</td>
                  <td className="tabular-nums">{c.orders}</td>
                  <td className="tabular-nums">{formatPrice(c.spent)}</td>
                  <td className="whitespace-nowrap text-smoke">{c.lastOrder ? formatDate(c.lastOrder) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Panel>
    </>
  );
}
