export const siteConfig = {
  name: "VANTA",
  slogan: "Beyond the ordinary.",
  description:
    "VANTA é streetwear premium feito em São Paulo: malhas pesadas, modelagens precisas e uma paleta reduzida ao essencial.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  email: "atendimento@vanta.store",
  instagram: "https://instagram.com/",
  /** Free shipping threshold in cents. */
  freeShippingFrom: 49900,
  lowStockThreshold: 3,
  maxQuantityPerItem: 10,
};

export const mainNav = [
  { label: "Shop all", href: "/shop" },
  { label: "New arrivals", href: "/shop?sort=newest&new=1" },
  { label: "T-Shirts", href: "/shop/t-shirts" },
  { label: "Hoodies", href: "/shop/hoodies" },
  { label: "Sweatshirts", href: "/shop/sweatshirts" },
  { label: "Pants", href: "/shop/pants" },
  { label: "Outerwear", href: "/shop/outerwear" },
  { label: "Accessories", href: "/shop/accessories" },
];

/** Editorial photography (Unsplash licence). Rendered in monochrome to fit the brand. */
export const editorialImages = {
  hero: "https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=2400&q=80",
  campaignA: "https://images.unsplash.com/photo-1588117260148-b47818741c74?auto=format&fit=crop&w=1600&q=80",
  campaignB: "https://images.unsplash.com/photo-1586396847415-2c76ae7e79fc?auto=format&fit=crop&w=1600&q=80",
  collection: "https://images.unsplash.com/photo-1559406041-c7d2b2e98690?auto=format&fit=crop&w=2400&q=80",
};
