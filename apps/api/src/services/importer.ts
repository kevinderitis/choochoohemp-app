import { makeSlug } from "../utils/slug.js";
import { Product } from "../models/Product.js";

type ImportResult = {
  created: number;
  updated: number;
  skipped: number;
};

const PLACEHOLDER_IMAGE = "/logo.png";
const PAGE_SIZE = 200;

async function fetchJson<T>(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Import failed for ${url}`);
  }

  return (await response.json()) as T;
}

function extractImage(value: unknown) {
  if (typeof value !== "string" || !value) return PLACEHOLDER_IMAGE;
  try {
    const parsed = JSON.parse(value);
    return parsed?.[0]?.url || PLACEHOLDER_IMAGE;
  } catch {
    return value;
  }
}

async function upsertProduct(payload: Record<string, unknown>) {
  const slug = makeSlug(String(payload.name || ""));
  if (!slug) return "skipped" as const;

  const existing = await Product.findOne({
    $or: [{ slug }, { name: String(payload.name) }]
  });

  const base = {
    name: String(payload.name || ""),
    slug,
    description: String(payload.description || "Product information available on request."),
    category: String(payload.category || "strains"),
    strainType: String(payload.strainType || "unknown"),
    image: String(payload.image || PLACEHOLDER_IMAGE),
    price: Number(payload.price || 0),
    stock: Number(payload.stock || 0),
    isActive: Boolean(payload.isActive ?? true),
    tags: Array.isArray(payload.tags) ? payload.tags : [],
    thc: String(payload.thc || ""),
    cbd: String(payload.cbd || ""),
    sourceUrl: String(payload.sourceUrl || ""),
    metadata: payload.metadata || {}
  };

  if (existing) {
    await Product.updateOne({ _id: existing._id }, { $set: base });
    return "updated" as const;
  }

  await Product.create(base);
  return "created" as const;
}

export async function importProducts() {
  const result: ImportResult = { created: 0, updated: 0, skipped: 0 };

  const strainMeta = await fetchJson<{ totalPages: number }>(
    `https://wishlist.choochoohemp.com/api/cch_products?limit=${PAGE_SIZE}&page=1&includeCounts=true`
  );

  for (let page = 1; page <= strainMeta.totalPages; page += 1) {
    const data = await fetchJson<{ products: Array<Record<string, unknown>>; totalPages: number }>(
      `https://wishlist.choochoohemp.com/api/cch_products?limit=${PAGE_SIZE}&page=${page}`
    );

    for (const item of data.products) {
      const status = await upsertProduct({
        name: item.name,
        description: item.description,
        category: "strains",
        strainType: item.strain_type,
        image: PLACEHOLDER_IMAGE,
        price: item.price_gram || item.price_joint || item.price_eighth || 0,
        stock: item.stock_jar || 0,
        isActive: item.is_active,
        tags: [item.grade, item.sub_category, ...(Array.isArray(item.effects) ? item.effects : [])].filter(Boolean),
        thc: "",
        cbd: "",
        sourceUrl: "https://wishlist.choochoohemp.com/strains",
        metadata: item
      });
      result[status] += 1;
    }
  }

  for (const domain of ["bakery", "nicotine"]) {
    const meta = await fetchJson<{ totalPages: number }>(
      `https://wishlist.choochoohemp.com/api/edbl_products?domain=${domain}&limit=${PAGE_SIZE}&page=1`
    );

    for (let page = 1; page <= meta.totalPages; page += 1) {
      const data = await fetchJson<{ products: Array<Record<string, unknown>> }>(
        `https://wishlist.choochoohemp.com/api/edbl_products?domain=${domain}&limit=${PAGE_SIZE}&page=${page}`
      );

      for (const item of data.products) {
        const status = await upsertProduct({
          name: item.name,
          description: item.description || "Editable description from Choo Choo Hemp admin.",
          category: domain === "bakery" ? "edibles" : "nicotine",
          image: extractImage(item.image_url),
          price: item.price || 0,
          stock: item.stock || 0,
          isActive: item.is_active,
          tags: [item.category, item.tags, item.domain].filter(Boolean),
          sourceUrl: `https://wishlist.choochoohemp.com/${domain === "bakery" ? "edibles" : "nicotine"}`,
          metadata: item
        });
        result[status] += 1;
      }
    }
  }

  return result;
}
