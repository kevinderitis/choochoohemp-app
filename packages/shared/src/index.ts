export type UserRole = "customer" | "admin";

export type ProductCategory = "strains" | "edibles" | "nicotine";
export type StrainType = "indica" | "sativa" | "hybrid" | "unknown";
export type PaymentMethod = "cash" | "card";
export type PaymentStatus = "pending" | "paid" | "failed";
export type OrderStatus =
  | "pending"
  | "accepted"
  | "preparing"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: ProductCategory;
  strainType?: StrainType;
  image: string;
  price: number;
  stock: number;
  isActive: boolean;
  tags: string[];
  thc?: string;
  cbd?: string;
  sourceUrl?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  lineId?: string;
  productId: string;
  sourceProductId?: string;
  name: string;
  variantLabel?: string;
  price: number;
  image: string;
  quantity: number;
}

export interface CustomerProfile {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  role: UserRole;
}

export interface Order {
  id: string;
  customer: CustomerProfile;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  address: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  deliveryFee: number;
  openingHours: string;
  paymentMethods: PaymentMethod[];
  legalMessage: string;
  contactLine: string;
  contactWhatsapp: string;
  contactEmail: string;
  deliveryPolicy: string;
  termsText: string;
  privacyText: string;
}
