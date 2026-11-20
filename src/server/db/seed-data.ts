/**
 * Demo catalog for VANTA. Used by the seed script and by the product-art generator.
 * Prices are in cents (BRL).
 */

export type GarmentKind =
  | "tee"
  | "tee-oversized"
  | "longsleeve"
  | "sweatshirt"
  | "hoodie"
  | "jacket"
  | "cargo"
  | "sweatpant"
  | "shorts"
  | "cap"
  | "bag";

export type BackPrint = "large" | "small" | "slogan" | "none";

export const seedCategories = [
  { name: "T-Shirts", slug: "t-shirts", description: "Malhas de algodão de gramatura alta, cortes retos e oversized.", sortOrder: 1 },
  { name: "Hoodies", slug: "hoodies", description: "Moletons com capuz em fleece pesado, construídos para durar.", sortOrder: 2 },
  { name: "Sweatshirts", slug: "sweatshirts", description: "Crewnecks e manga longa com acabamento canelado.", sortOrder: 3 },
  { name: "Pants", slug: "pants", description: "Cargos, sweatpants e shorts com modelagem relaxada.", sortOrder: 4 },
  { name: "Outerwear", slug: "outerwear", description: "Jaquetas de sarja e nylon para a cidade.", sortOrder: 5 },
  { name: "Accessories", slug: "accessories", description: "Bonés e bolsas que completam o uniforme.", sortOrder: 6 },
] as const;

export const seedSizes = [
  { label: "PP", sortOrder: 1 },
  { label: "P", sortOrder: 2 },
  { label: "M", sortOrder: 3 },
  { label: "G", sortOrder: 4 },
  { label: "GG", sortOrder: 5 },
  { label: "XGG", sortOrder: 6 },
  { label: "Único", sortOrder: 7 },
] as const;

export const seedColors = [
  { name: "Black", slug: "black", hex: "#151515" },
  { name: "Bone", slug: "bone", hex: "#E4DED2" },
  { name: "Ash", slug: "ash", hex: "#8D8C89" },
  { name: "Graphite", slug: "graphite", hex: "#3C3D3F" },
  { name: "Olive", slug: "olive", hex: "#4A4D3B" },
  { name: "Sand", slug: "sand", hex: "#BDAE94" },
  { name: "Optic White", slug: "white", hex: "#F3F3F1" },
] as const;

export type SeedProduct = {
  name: string;
  slug: string;
  category: (typeof seedCategories)[number]["slug"];
  kind: GarmentKind;
  backPrint: BackPrint;
  price: number;
  salePrice?: number;
  colors: (typeof seedColors)[number]["slug"][];
  sizes: (typeof seedSizes)[number]["label"][];
  isNew?: boolean;
  isBestSeller?: boolean;
  isFeatured?: boolean;
  salesCount: number;
  /** Days before "today" the product was published (drives "mais recentes"). */
  ageDays: number;
  description: string;
  details: string[];
};

const APPAREL = ["PP", "P", "M", "G", "GG", "XGG"] as SeedProduct["sizes"];
const ONE = ["Único"] as SeedProduct["sizes"];

export const seedProducts: SeedProduct[] = [
  {
    name: "VANTA Essential Tee",
    slug: "vanta-essential-tee",
    category: "t-shirts",
    kind: "tee",
    backPrint: "small",
    price: 18990,
    colors: ["black", "white", "ash"],
    sizes: APPAREL,
    isBestSeller: true,
    salesCount: 412,
    ageDays: 60,
    description:
      "A camiseta que sustenta todo o resto. Algodão penteado de 220 g/m², gola canelada que não deforma e caimento reto, pensada para ser usada todos os dias e envelhecer bem.",
    details: ["100% algodão penteado, 220 g/m²", "Gola canelada 2×1 com reforço", "Logo VANTA em silk na nuca", "Lavar do avesso, água fria"],
  },
  {
    name: "VANTA Oversized Core",
    slug: "vanta-oversized-core",
    category: "t-shirts",
    kind: "tee-oversized",
    backPrint: "large",
    price: 22990,
    salePrice: 18990,
    colors: ["black", "bone", "graphite"],
    sizes: APPAREL,
    isBestSeller: true,
    isFeatured: true,
    salesCount: 368,
    ageDays: 40,
    description:
      "Ombro caído, corpo largo e comprimento estendido. A Oversized Core leva o wordmark VANTA em escala grande nas costas e um acabamento lavado que deixa o toque macio desde o primeiro uso.",
    details: ["100% algodão, 260 g/m²", "Modelagem oversized — se preferir mais justa, peça um tamanho abaixo", "Estampa em silk à base d'água", "Pré-lavada: encolhimento mínimo"],
  },
  {
    name: "VANTA Logo Tee",
    slug: "vanta-logo-tee",
    category: "t-shirts",
    kind: "tee",
    backPrint: "slogan",
    price: 19990,
    colors: ["white", "black"],
    sizes: APPAREL,
    isNew: true,
    salesCount: 96,
    ageDays: 6,
    description:
      "Corte clássico com o manifesto da marca nas costas. Malha encorpada, costura dupla na barra e etiqueta impressa para não pinicar.",
    details: ["100% algodão, 220 g/m²", "Estampa traseira Beyond the ordinary", "Etiqueta impressa, sem atrito", "Fabricada em São Paulo"],
  },
  {
    name: "VANTA Shadow Hoodie",
    slug: "vanta-shadow-hoodie",
    category: "hoodies",
    kind: "hoodie",
    backPrint: "large",
    price: 54990,
    colors: ["black", "graphite", "ash"],
    sizes: APPAREL,
    isBestSeller: true,
    isFeatured: true,
    salesCount: 287,
    ageDays: 75,
    description:
      "Fleece escovado de 450 g/m², capuz duplo que mantém a forma e bolso canguru reforçado. O Shadow Hoodie é a peça mais pesada da coleção — e a mais vestida.",
    details: ["80% algodão, 20% poliéster, 450 g/m²", "Capuz forrado em duas camadas", "Punhos e barra em ribana 2×2", "Ilhoses metálicos foscos"],
  },
  {
    name: "VANTA Heavyweight Sweatshirt",
    slug: "vanta-heavyweight-sweatshirt",
    category: "sweatshirts",
    kind: "sweatshirt",
    backPrint: "none",
    price: 42990,
    salePrice: 35990,
    colors: ["ash", "bone", "black"],
    sizes: APPAREL,
    isBestSeller: true,
    salesCount: 203,
    ageDays: 90,
    description:
      "Crewneck de fleece pesado com recorte raglan e ribanas largas. Silhueta quadrada, limpa, sem nada além do pequeno wordmark no peito.",
    details: ["80% algodão, 20% poliéster, 420 g/m²", "Ribanas largas de 8 cm na barra", "Wordmark bordado em linha tom sobre tom", "Interior felpado"],
  },
  {
    name: "VANTA Premium Long Sleeve",
    slug: "vanta-premium-long-sleeve",
    category: "sweatshirts",
    kind: "longsleeve",
    backPrint: "slogan",
    price: 27990,
    colors: ["black", "bone", "graphite"],
    sizes: APPAREL,
    isNew: true,
    salesCount: 74,
    ageDays: 4,
    description:
      "Manga longa em jersey de algodão Pima, com punhos canelados e o manifesto da marca ao longo das costas. Leve o suficiente para usar sozinha, encorpada para sobrepor.",
    details: ["100% algodão Pima, 240 g/m²", "Punhos canelados 1×1", "Estampa traseira em silk", "Costuras laterais deslocadas"],
  },
  {
    name: "VANTA Urban Cargo",
    slug: "vanta-urban-cargo",
    category: "pants",
    kind: "cargo",
    backPrint: "none",
    price: 48990,
    colors: ["black", "olive", "sand"],
    sizes: ["P", "M", "G", "GG", "XGG"],
    isNew: true,
    isFeatured: true,
    salesCount: 142,
    ageDays: 10,
    description:
      "Sarja de algodão com elastano, bolsos cargo fole e cós com regulagem interna. Perna reta e ampla, com barra que acomoda bem sobre o tênis.",
    details: ["97% algodão, 3% elastano", "Seis bolsos, dois cargo com lapela", "Cós com elástico interno e passantes", "Zíper YKK fosco"],
  },
  {
    name: "VANTA Relaxed Sweatpant",
    slug: "vanta-relaxed-sweatpant",
    category: "pants",
    kind: "sweatpant",
    backPrint: "none",
    price: 38990,
    colors: ["ash", "black"],
    sizes: APPAREL,
    salesCount: 118,
    ageDays: 55,
    description:
      "A calça de moletom que combina com o Shadow Hoodie. Mesmo fleece de 450 g/m², cós com cordão chato e punhos canelados no tornozelo.",
    details: ["80% algodão, 20% poliéster, 450 g/m²", "Cordão chato com ponteira metálica", "Bolsos laterais embutidos", "Punhos canelados"],
  },
  {
    name: "VANTA Essential Shorts",
    slug: "vanta-essential-shorts",
    category: "pants",
    kind: "shorts",
    backPrint: "none",
    price: 24990,
    colors: ["black", "ash", "sand"],
    sizes: ["P", "M", "G", "GG"],
    salesCount: 88,
    ageDays: 35,
    description:
      "Shorts de moletom leve com comprimento acima do joelho, cós elástico e cordão. O par natural da Essential Tee nos dias quentes.",
    details: ["100% algodão, 300 g/m²", "Comprimento de entrepernas: 18 cm (tam. M)", "Bolso traseiro com lapela", "Cós elástico com cordão"],
  },
  {
    name: "VANTA Signature Jacket",
    slug: "vanta-signature-jacket",
    category: "outerwear",
    kind: "jacket",
    backPrint: "large",
    price: 89990,
    colors: ["black", "olive"],
    sizes: ["P", "M", "G", "GG"],
    isNew: true,
    isFeatured: true,
    salesCount: 57,
    ageDays: 2,
    description:
      "Jaqueta de trabalho em sarja encerada, com gola de bico, botões de pressão e dois bolsos de peito com lapela. O wordmark nas costas é aplicado em tela, não em vinil.",
    details: ["100% algodão encerado, 320 g/m²", "Forro em tafetá", "Botões de pressão em metal fosco", "Wordmark traseiro aplicado em tela"],
  },
  {
    name: "VANTA Minimal Cap",
    slug: "vanta-minimal-cap",
    category: "accessories",
    kind: "cap",
    backPrint: "none",
    price: 15990,
    colors: ["black", "bone", "olive"],
    sizes: ONE,
    salesCount: 231,
    ageDays: 80,
    description:
      "Boné de seis gomos em sarja lavada, aba curva e fecho traseiro em fivela de metal. O wordmark vem bordado em linha tom sobre tom.",
    details: ["100% algodão lavado", "Regulagem traseira com fivela", "Ilhoses bordados", "Tamanho único (54–60 cm)"],
  },
  {
    name: "VANTA Street Bag",
    slug: "vanta-street-bag",
    category: "accessories",
    kind: "bag",
    backPrint: "none",
    price: 32990,
    colors: ["black", "graphite"],
    sizes: ONE,
    isNew: true,
    salesCount: 64,
    ageDays: 8,
    description:
      "Bolsa transversal em nylon ripstop resistente à água, com bolso frontal, divisória interna e alça ajustável com fivela de engate rápido.",
    details: ["Nylon ripstop com revestimento PU", "Capacidade: 3 litros", "Zíperes de fácil manuseio", "Alça ajustável de 70 a 130 cm"],
  },
];

/** Deterministic pseudo-random stock so every demo looks the same. */
export function seedStock(productIndex: number, colorIndex: number, sizeIndex: number): number {
  const n = (productIndex * 31 + colorIndex * 17 + sizeIndex * 7) % 23;
  if (n === 0) return 0; // some sold-out combinations
  if (n < 3) return n; // some low stock
  return 6 + n;
}

export const seedCoupons = [
  { code: "VANTA10", description: "10% de desconto em todo o site", type: "percent" as const, value: 10, minSubtotal: 0 },
  { code: "BEYOND50", description: "R$ 50 de desconto em compras acima de R$ 400", type: "fixed" as const, value: 5000, minSubtotal: 40000 },
  { code: "FRETEGRATIS", description: "Frete grátis em qualquer pedido", type: "free_shipping" as const, value: 0, minSubtotal: 0 },
];

export function productImagePath(slug: string, color: string, view: "front" | "back") {
  return `/images/products/${slug}/${color}-${view}.svg`;
}
