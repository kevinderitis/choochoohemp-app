import { useQuery } from "@tanstack/react-query";
import type { Order } from "@choochoo/shared";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { statusLabel } from "@/lib/utils";
import { AuthCard } from "@/components/AuthCard";
import { GlassCard } from "@/components/ui";

export function ProfilePage() {
  const user = useAppStore((state) => state.user);
  const { data } = useQuery({
    queryKey: ["my-orders"],
    queryFn: async () => (await api.myOrders()) as { orders: Order[] },
    refetchInterval: 10000
  });

  const orders = data?.orders || [];

  if (!user) {
    return (
      <div className="mx-auto max-w-xl p-4">
        <AuthCard />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-4xl font-bold">My orders</h1>
        <Link to="/" className="text-sm text-emerald-200">Continue shopping</Link>
      </div>
      {orders.map((order) => (
        <GlassCard key={order.id} className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-mist/60">{new Date(order.createdAt).toLocaleString()}</p>
              <h2 className="font-display text-2xl font-bold">Order {order.id.slice(-6).toUpperCase()}</h2>
            </div>
            <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-sm text-emerald-100">
              {statusLabel(order.status)}
            </span>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}
