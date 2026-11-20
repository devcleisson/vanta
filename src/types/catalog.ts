export type ColorOption = { id: string; name: string; slug: string; hex: string };
export type SizeOption = { id: string; label: string; sortOrder: number };

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  price: number;
  salePrice: number | null;
  isNew: boolean;
  isBestSeller: boolean;
  category: { name: string; slug: string } | null;
  image: { url: string; alt: string } | null;
  hoverImage: { url: string; alt: string } | null;
  colors: ColorOption[];
  inStock: boolean;
  /** Set when the product has exactly one purchasable variant (quick add without choices). */
  singleVariantId: string | null;
};

export type ProductVariantData = {
  id: string;
  sku: string;
  stock: number;
  sizeId: string;
  colorId: string;
};

export type ProductDetailData = Omit<ProductCardData, "image" | "hoverImage" | "singleVariantId"> & {
  description: string;
  details: string[];
  images: { id: string; url: string; alt: string; colorId: string | null }[];
  sizes: SizeOption[];
  variants: ProductVariantData[];
  salesCount: number;
  createdAt: string;
};

export type CatalogSort = "newest" | "price-asc" | "price-desc" | "best-sellers";

export type CatalogQuery = {
  q?: string;
  category?: string;
  sizes?: string[];
  colors?: string[];
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  onSale?: boolean;
  isNew?: boolean;
  sort?: CatalogSort;
  page?: number;
  perPage?: number;
};
