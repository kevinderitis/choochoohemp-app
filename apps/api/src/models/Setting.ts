import mongoose, { Schema } from "mongoose";
import { env } from "../config/env.js";

const settingSchema = new Schema(
  {
    singleton: { type: String, unique: true, default: "app" },
    deliveryFee: { type: Number, default: env.DELIVERY_FEE },
    openingHours: { type: String, default: "Daily 12:00 - 23:00" },
    paymentMethods: { type: [String], default: ["cash"] },
    legalMessage: {
      type: String,
      default: "Available only for adults of legal age and where local regulations allow it."
    },
    contactLine: { type: String, default: "https://link.choochoohemp.com/XI0W" },
    contactWhatsapp: { type: String, default: "" },
    contactEmail: { type: String, default: env.ADMIN_EMAIL },
    deliveryPolicy: { type: String, default: "Delivery availability depends on coverage area, stock and opening hours." },
    termsText: { type: String, default: "For members and customers only, subject to local regulations and club policies." },
    privacyText: { type: String, default: "We use personal data only to process orders, support delivery and improve service." }
  },
  { timestamps: true }
);

export const Setting = mongoose.model("Setting", settingSchema);
