import type { ProductCategory, StrainType } from "@choochoo/shared";

export const mockProducts: Array<{
  name: string;
  slug: string;
  description: string;
  category: ProductCategory;
  strainType?: StrainType;
  image: string;
  price: number;
  stock: number;
  tags: string[];
  thc?: string;
  cbd?: string;
}> = [
  {
    name: "Midnight Express",
    slug: "midnight-express",
    description: "A balanced night-forward hybrid with earthy sweetness and a smooth finish.",
    category: "strains",
    strainType: "hybrid",
    image: "/logo.png",
    price: 320,
    stock: 24,
    tags: ["featured", "hybrid", "premium"],
    thc: "21%",
    cbd: "0.8%"
  },
  {
    name: "Emerald Cloud Gummies",
    slug: "emerald-cloud-gummies",
    description: "Soft fruit gummies curated for discreet, member-only ordering.",
    category: "edibles",
    image: "/logo.png",
    price: 180,
    stock: 40,
    tags: ["gummies", "sweet"]
  },
  {
    name: "Zyn Mint Medium",
    slug: "zyn-mint-medium",
    description: "Nicotine pouch option imported as a placeholder when live sync is unavailable.",
    category: "nicotine",
    image: "/logo.png",
    price: 80,
    stock: 36,
    tags: ["nicotine", "mint"]
  }
];
