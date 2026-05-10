import mongoose, { Schema } from "mongoose";

const productSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, default: "" },
    category: { type: String, enum: ["strains", "edibles", "nicotine"], required: true, index: true },
    strainType: { type: String, enum: ["indica", "sativa", "hybrid", "unknown"], default: "unknown" },
    image: { type: String, default: "/logo.png" },
    price: { type: Number, default: 0 },
    stock: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    tags: { type: [String], default: [] },
    thc: { type: String, default: "" },
    cbd: { type: String, default: "" },
    sourceUrl: { type: String, default: "" },
    metadata: { type: Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

export const Product = mongoose.model("Product", productSchema);
