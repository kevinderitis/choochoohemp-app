import express from "express";
import { z } from "zod";
import { mockProducts } from "../constants/mockProducts.js";
import { requireAdmin } from "../middleware/auth.js";
import { Product } from "../models/Product.js";
import { importProducts } from "../services/importer.js";
import { asyncHandler, HttpError } from "../utils/http.js";
import { makeSlug } from "../utils/slug.js";

const router = express.Router();

const productSchema = z.object({
  name: z.string().min(2),
  description: z.string().default(""),
  category: z.enum(["strains", "edibles", "nicotine"]),
  strainType: z.enum(["indica", "sativa", "hybrid", "unknown"]).optional().default("unknown"),
  image: z.string().default("/logo.png"),
  price: z.coerce.number().min(0),
  stock: z.coerce.number().min(0),
  isActive: z.boolean().default(true),
  tags: z.array(z.string()).default([]),
  thc: z.string().optional().default(""),
  cbd: z.string().optional().default(""),
  sourceUrl: z.string().optional().default("")
});

router.get(
  "/products",
  asyncHandler(async (req, res) => {
    const category = String(req.query.category || "");
    const search = String(req.query.search || "");
    const sort = String(req.query.sort || "updatedAt-desc");
    const filter: Record<string, unknown> = { isActive: true };

    if (category) filter.category = category;
    if (search) filter.name = { $regex: search, $options: "i" };

    const sortMap: Record<string, Record<string, 1 | -1>> = {
      "price-asc": { price: 1 },
      "price-desc": { price: -1 },
      "name-asc": { name: 1 },
      "updatedAt-desc": { updatedAt: -1 }
    };

    const products = await Product.find(filter).sort(sortMap[sort] || sortMap["updatedAt-desc"]).lean();
    const safeProducts =
      products.length > 0
        ? products
        : mockProducts.map((item, index) => ({
            _id: `mock-${index}`,
            ...item,
            isActive: true,
            sourceUrl: "",
            metadata: {},
            createdAt: new Date(),
            updatedAt: new Date()
          }));

    res.json({
      products: safeProducts.map((product) => ({
        id: String(product._id),
        name: product.name,
        slug: product.slug,
        description: product.description,
        category: product.category,
        strainType: product.strainType,
        image: product.image,
        price: product.price,
        stock: product.stock,
        isActive: product.isActive,
        tags: product.tags,
        thc: product.thc,
        cbd: product.cbd,
        sourceUrl: product.sourceUrl,
        metadata: product.metadata || {},
        createdAt: new Date(product.createdAt).toISOString(),
        updatedAt: new Date(product.updatedAt).toISOString()
      }))
    });
  })
);

router.get(
  "/products/:slug",
  asyncHandler(async (req, res) => {
    const product = await Product.findOne({ slug: req.params.slug }).lean();
    if (!product) throw new HttpError(404, "Product not found");
    res.json({
      product: {
        id: String(product._id),
        ...product,
        metadata: product.metadata || {},
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString()
      }
    });
  })
);

router.post(
  "/admin/products",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const body = productSchema.parse(req.body);
    const product = await Product.create({ ...body, slug: makeSlug(body.name) });
    res.status(201).json({ product });
  })
);

router.put(
  "/admin/products/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const body = productSchema.partial().parse(req.body);
    const updates = body.name ? { ...body, slug: makeSlug(body.name) } : body;
    const product = await Product.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true });
    if (!product) throw new HttpError(404, "Product not found");
    res.json({ product });
  })
);

router.delete(
  "/admin/products/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) throw new HttpError(404, "Product not found");
    res.json({ message: "Product deleted" });
  })
);

router.post(
  "/admin/products/import",
  requireAdmin,
  asyncHandler(async (_req, res) => {
    const result = await importProducts();
    res.json({ message: "Import finished", result });
  })
);

export const productsRouter = router;
