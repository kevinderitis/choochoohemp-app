const API_BASE = import.meta.env.VITE_API_BASE || "/api";

function getToken() {
  return localStorage.getItem("choochoo-token") || "";
}

async function request<T>(path: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {})
    },
    ...options
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Request failed");
  return data as T;
}

export const api = {
  register: (body: unknown) => request<{ token: string; user: unknown }>("/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login: (body: unknown) => request<{ token: string; user: unknown }>("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  me: () => request<{ user: unknown }>("/auth/me"),
  products: (params = "") => request<{ products: unknown[] }>(`/products${params}`),
  product: (slug: string) => request<{ product: unknown }>(`/products/${slug}`),
  createOrder: (body: unknown) => request<{ order: unknown }>("/orders", { method: "POST", body: JSON.stringify(body) }),
  myOrders: () => request<{ orders: unknown[] }>("/orders/my"),
  adminOrders: (status = "") => request<{ orders: unknown[]; metrics: unknown }>(`/admin/orders${status ? `?status=${status}` : ""}`),
  adminOrder: (id: string) => request<{ order: unknown }>(`/admin/orders/${id}`),
  updateOrderStatus: (id: string, status: string) =>
    request<{ order: unknown }>(`/admin/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  customers: () => request<{ customers: unknown[] }>("/admin/customers"),
  settings: () => request<{ settings: unknown }>("/settings"),
  updateSettings: (body: unknown) => request<{ settings: unknown }>("/admin/settings", { method: "PUT", body: JSON.stringify(body) }),
  createProduct: (body: unknown) => request<{ product: unknown }>("/products/admin/products", { method: "POST", body: JSON.stringify(body) }),
  updateProduct: (id: string, body: unknown) =>
    request<{ product: unknown }>(`/products/admin/products/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteProduct: (id: string) => request<{ message: string }>(`/products/admin/products/${id}`, { method: "DELETE" }),
  importProducts: () => request<{ message: string; result: unknown }>("/products/admin/products/import", { method: "POST" }),
  pushConfig: () => request<{ enabled: boolean; publicKey: string }>("/notifications/config"),
  subscribePush: (subscription: unknown) =>
    request<{ message: string }>("/notifications/subscribe", { method: "POST", body: JSON.stringify({ subscription }) }),
  unsubscribePush: (endpoint: string) =>
    request<{ message: string }>("/notifications/unsubscribe", { method: "POST", body: JSON.stringify({ endpoint }) }),
  sendNotification: (body: unknown) =>
    request<{ message: string }>("/notifications/admin/notifications/send", { method: "POST", body: JSON.stringify(body) })
};
