import Link from "next/link";
import { notFound } from "next/navigation";
import { CustomerRoleToggle } from "@/components/admin/customer-role-toggle";
import { OrderStatusBadge } from "@/components/admin/status-badge";
import { PageHeader, Panel, Table } from "@/components/admin/ui";
import { formatCep, formatCpf, formatDate, formatDateTime, formatPhone, formatPrice } from "@/lib/format";
import { getCurrentUser } from "@/server/auth/session";
import { getCustomer } from "@/server/services/admin/customers-admin";

export const metadata = { title: "Cliente" };

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [customer, me] = await Promise.all([getCustomer(id), getCurrentUser()]);
  if (!customer) notFound();
  const st = customer.stats;

  return (
    <>
      <Link href="/admin/customers" className="text-[13px] text-smoke hover:text-ink">Clientes</Link>
      <PageHeader
        title={customer.fullName ?? customer.email}
        description={`Cliente desde ${formatDate(customer.createdAt)}`}
        actions={<CustomerRoleToggle customerId={customer.id} role={customer.role} disabled={me?.id === customer.id} />}
      />
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Total gasto", formatPrice(st.spent)],
          ["Pedidos", String(st.orders)],
          ["Ticket médio", formatPrice(st.avgTicket)],
          ["Peças compradas", String(st.itemsBought)],
        ].map(([label, value]) => (
          <div key={label} className="border border-stone bg-paper p-5">
            <p className="text-[13px] text-smoke">{label}</p>
            <p className="mt-2 text-[24px] font-semibold tabular-nums">{value}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <Panel title="Histórico de pedidos">
          {customer.orders.length ? (
            <Table>
              <thead><tr><th>Pedido</th><th>Data</th><th>Itens</th><th>Status</th><th className="text-right">Total</th></tr></thead>
              <tbody>
                {customer.orders.map((o) => (
                  <tr key={o.id}>
                    <td><Link href={`/admin/orders/${o.id}`} className="font-medium hover:underline">{o.number}</Link></td>
                    <td className="whitespace-nowrap text-smoke">{formatDateTime(o.createdAt)}</td>
                    <td className="max-w-64 truncate text-smoke">{o.items.map((i) => `${i.quantity}× ${i.productName.replace(/^VANTA /, "")}`).join(", ")}</td>
                    <td><OrderStatusBadge status={o.status} /></td>
                    <td className="text-right tabular-nums">{formatPrice(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <p className="p-5 text-[14px] text-smoke">Nenhum pedido ainda.</p>
          )}
        </Panel>
        <div className="space-y-4">
          <Panel title="Dados cadastrais">
            <dl className="space-y-3 p-5 text-[14px]">
              <div><dt className="text-[12px] text-smoke">E-mail</dt><dd>{customer.email}</dd></div>
              <div><dt className="text-[12px] text-smoke">Telefone</dt><dd>{customer.phone ? formatPhone(customer.phone) : "—"}</dd></div>
              <div><dt className="text-[12px] text-smoke">CPF</dt><dd>{customer.cpf ? formatCpf(customer.cpf) : "—"}</dd></div>
              <div><dt className="text-[12px] text-smoke">Perfil</dt><dd>{customer.role === "admin" ? "Administrador" : "Cliente"}</dd></div>
            </dl>
          </Panel>
          <Panel title="Endereços">
            {customer.addresses.length ? (
              <ul className="divide-y divide-stone text-[14px]">
                {customer.addresses.map((a) => (
                  <li key={a.id} className="px-5 py-3">
                    <p className="font-medium">{a.label}{a.isDefault && <span className="ml-2 text-[12px] text-smoke">padrão</span>}</p>
                    <p>{a.street}, {a.number}{a.complement && ` — ${a.complement}`}</p>
                    <p className="text-smoke">{a.district}, {a.city}/{a.state} — {formatCep(a.cep)}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-5 text-[14px] text-smoke">Nenhum endereço salvo.</p>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
