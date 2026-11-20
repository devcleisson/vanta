import type { OrderStatus } from "@/schemas/admin";

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pendente",
  payment_approved: "Pagamento aprovado",
  preparing: "Em preparação",
  shipped: "Enviado",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

export const ORDER_STATUS_FLOW: OrderStatus[] = ["pending", "payment_approved", "preparing", "shipped", "delivered"];

/** Which status changes an administrator may make from each state. */
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["payment_approved", "cancelled"],
  payment_approved: ["preparing", "cancelled"],
  preparing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

export const PAYMENT_STATUS_LABEL = {
  pending: "Aguardando",
  approved: "Aprovado",
  failed: "Recusado",
  refunded: "Reembolsado",
  expired: "Expirado",
} as const;

export const SHIPPING_METHOD_LABEL: Record<string, string> = {
  standard: "Econômica",
  express: "Expressa",
  pickup: "Retirada na loja",
};
