export type CartItemInput = { variantId: string; quantity: number };

export type CartLineIssue = "unavailable" | "out_of_stock" | "reduced";

export type PricedCartLine = {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  image: string | null;
  sizeLabel: string;
  colorName: string;
  colorHex: string;
  sku: string;
  unitPrice: number;
  compareAtPrice: number | null;
  requestedQuantity: number;
  quantity: number;
  stock: number;
  lineTotal: number;
  issue: CartLineIssue | null;
  /** Sibling variants of the same product, so size/colour can be changed in the cart. */
  options: { variantId: string; sizeLabel: string; sizeOrder: number; colorName: string; stock: number }[];
};

export type ShippingOption = {
  id: "standard" | "express" | "pickup";
  label: string;
  description: string;
  price: number;
  days: string;
};

export type CouponResult = {
  code: string;
  valid: boolean;
  message: string;
  description?: string | null;
  type?: "percent" | "fixed" | "free_shipping";
};

export type CartQuote = {
  lines: PricedCartLine[];
  itemCount: number;
  subtotal: number;
  discount: number;
  shipping: { options: ShippingOption[]; selected: ShippingOption | null; cep: string | null };
  total: number;
  coupon: CouponResult | null;
  hasIssues: boolean;
};
