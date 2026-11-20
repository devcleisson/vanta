import { Badge } from "@/components/ui/misc";
import { ORDER_STATUS_LABEL } from "@/config/orders";
import type { OrderStatus } from "@/schemas/admin";

const TONE: Record<OrderStatus, "neutral" | "ink" | "success" | "warning" | "danger" | "outline"> = {
  pending: "warning",
  payment_approved: "ink",
  preparing: "neutral",
  shipped: "outline",
  delivered: "success",
  cancelled: "danger",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge tone={TONE[status]}>{ORDER_STATUS_LABEL[status]}</Badge>;
}
