import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { Order, Product } from "@choochoo/shared";
import { api } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { formatCurrency, statusLabel } from "@/lib/utils";
import { GlassCard } from "@/components/ui";

type LoginForm = { email: string; password: string };

export function AdminPage() {
  const queryClient = useQueryClient();
  const { register, handleSubmit } = useForm<LoginForm>({
    defaultValues: { email: "admin@choochoohemp.com", password: "ChangeMe123!" }
  });
  const user = useAppStore((state) => state.user);
  const setUser = useAppStore((state) => state.setUser);

  const login = useMutation({
    mutationFn: async (values: LoginForm) => {
      const response = await api.login(values);
      localStorage.setItem("choochoo-token", response.token);
      return response;
    },
    onSuccess: (response: { user: any }) => {
      setUser(response.user);
      toast.success("Admin session ready");
    },
    onError: (error: Error) => toast.error(error.message)
  });

  const ordersQuery = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => (await api.adminOrders()) as { orders: Order[]; metrics: { todaysOrders: number; estimatedSales: number; pendingOrders: number; activeProducts: number } },
    enabled: user?.role === "admin",
    refetchInterval: 8000
  });

  const productsQuery = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => (await api.products()) as { products: Product[] },
    enabled: user?.role === "admin"
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.updateOrderStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-orders"] })
  });

  const importMutation = useMutation({
    mutationFn: () => api.importProducts(),
    onSuccess: () => {
      toast.success("Catalog synced");
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    }
  });

  if (user?.role !== "admin") {
    return (
      <div className="mx-auto max-w-md p-4">
        <GlassCard className="p-8">
          <h1 className="font-display text-3xl font-bold">Admin login</h1>
          <form className="mt-6 space-y-4" onSubmit={handleSubmit((values) => login.mutate(values))}>
            <input {...register("email", { required: true })} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3" />
            <input {...register("password", { required: true })} type="password" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3" />
            <button className="w-full rounded-2xl bg-emerald-300 px-4 py-3 font-semibold text-night">Sign in</button>
          </form>
        </GlassCard>
      </div>
    );
  }

  const metrics = ordersQuery.data?.metrics;
  const orders = ordersQuery.data?.orders || [];
  const products = productsQuery.data?.products || [];

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-4xl font-bold">Admin panel</h1>
        <button onClick={() => importMutation.mutate()} className="rounded-full bg-emerald-300 px-4 py-2 font-semibold text-night">
          Sync products
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          ["Orders today", metrics?.todaysOrders || 0],
          ["Estimated sales", formatCurrency(metrics?.estimatedSales || 0)],
          ["Pending", metrics?.pendingOrders || 0],
          ["Active products", metrics?.activeProducts || 0]
        ].map(([label, value]) => (
          <GlassCard key={label} className="p-5">
            <p className="text-sm text-mist/55">{label}</p>
            <p className="mt-3 font-display text-3xl font-bold">{value}</p>
          </GlassCard>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <GlassCard className="p-5">
          <h2 className="font-display text-2xl font-bold">Orders</h2>
          <div className="mt-4 space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="rounded-2xl border border-white/10 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{order.customer.name}</p>
                    <p className="text-sm text-mist/55">{formatCurrency(order.total)}</p>
                  </div>
                  <select
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-2"
                    value={order.status}
                    onChange={(event) => updateStatus.mutate({ id: order.id, status: event.target.value })}
                  >
                    {["pending", "accepted", "preparing", "out_for_delivery", "delivered", "cancelled"].map((status) => (
                      <option key={status} value={status}>
                        {statusLabel(status)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <h2 className="font-display text-2xl font-bold">Products</h2>
          <div className="mt-4 space-y-3">
            {products.slice(0, 8).map((product) => (
              <div key={product.id} className="flex items-center justify-between rounded-2xl border border-white/10 p-3">
                <div>
                  <p className="font-semibold">{product.name}</p>
                  <p className="text-sm text-mist/55">{product.category}</p>
                </div>
                <p className="text-sm text-emerald-200">{formatCurrency(product.price)}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
