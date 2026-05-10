import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const schema = z.object({
  PORT: z.coerce.number().default(5001),
  MONGODB_URI: z.string().default("mongodb://127.0.0.1:27017/choochoo-hemp"),
  JWT_SECRET: z.string().min(10).default("replace-this-with-a-long-secret"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  APP_URL: z.string().default("http://localhost:5173"),
  API_URL: z.string().default("http://localhost:5001"),
  ADMIN_EMAIL: z.string().email().default("admin@choochoohemp.com"),
  ADMIN_PASSWORD: z.string().min(8).default("ChangeMe123!"),
  VAPID_PUBLIC_KEY: z.string().optional().default(""),
  VAPID_PRIVATE_KEY: z.string().optional().default(""),
  VAPID_SUBJECT: z.string().default("mailto:admin@choochoohemp.com"),
  DELIVERY_FEE: z.coerce.number().default(80)
});

export const env = schema.parse(process.env);
