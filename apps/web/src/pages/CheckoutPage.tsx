import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Truck } from "lucide-react";
import { api } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import { AuthCard } from "@/components/AuthCard";
import { GlassCard } from "@/components/ui";

type CheckoutForm = {
  name: string;
  phone: string;
  address: string;
  notes: string;
};

const FREE_DELIVERY_THRESHOLD = 500;
const DEFAULT_DELIVERY_FEE = 80;

export function CheckoutPage() {
  const navigate = useNavigate();
  const cart = useAppStore((state) => state.cart);
  const clearCart = useAppStore((state) => state.clearCart);
  const user = useAppStore((state) => state.user);
  const [showAuth, setShowAuth] = useState(false);
  const { register, handleSubmit } = useForm<CheckoutForm>({
    defaultValues: {
      name: user?.name || "",
      phone: user?.phone || "",
      address: user?.address || "",
      notes: ""
    }
  });

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const qualifiesForFreeDelivery = subtotal >= FREE_DELIVERY_THRESHOLD;
  const deliveryFee = cart.length === 0 ? 0 : qualifiesForFreeDelivery ? 0 : DEFAULT_DELIVERY_FEE;
  const amountToFreeDelivery = Math.max(FREE_DELIVERY_THRESHOLD - subtotal, 0);
  const total = subtotal + deliveryFee;

  const mutation = useMutation({
    mutationFn: (values: CheckoutForm) =>
      api.createOrder({
        ...values,
        paymentMethod: "cash",
        items: cart.map((item) => ({ productId: item.sourceProductId || item.productId, quantity: item.quantity }))
      }),
    onSuccess: () => {
      toast.success("Order confirmed");
      clearCart();
      navigate("/profile");
    },
    onError: (error: Error) => toast.error(error.message)
  });

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 pb-28 pt-4 lg:grid-cols-[1.1fr_0.9fr]">
      <GlassCard className="overflow-hidden bg-[#121614] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-emerald-300/65">Checkout</p>
            <h1 className="font-display text-3xl font-bold text-white">Cart</h1>
            {user?.name ? (
              <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.05] px-3 py-1.5 text-sm text-mist/75">
                <span className="h-2 w-2 rounded-full bg-emerald-300" />
                {user.name}
              </div>
            ) : (
              <button
                onClick={() => setShowAuth((current) => !current)}
                className="inline-flex items-center gap-2 rounded-full bg-white/[0.05] px-3 py-1.5 text-sm text-mist/75 transition hover:bg-white/[0.08] hover:text-white"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-300" />
                Login or register
              </button>
            )}
          </div>
        </div>

        {user ? (
          <form className="mt-6 space-y-4" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
            {[
              ["name", "Full name"],
              ["phone", "Phone / WhatsApp"],
              ["address", "Delivery address"]
            ].map(([key, label]) => (
              <label key={key} className="block space-y-2">
                <span className="text-sm text-mist/70">{label}</span>
                <input {...register(key as keyof CheckoutForm, { required: true })} className="w-full rounded-2xl bg-white/5 px-4 py-3 outline-none ring-1 ring-white/5" />
              </label>
            ))}
            <label className="block space-y-2">
              <span className="text-sm text-mist/70">Delivery notes</span>
              <textarea {...register("notes")} className="min-h-28 w-full rounded-2xl bg-white/5 px-4 py-3 outline-none ring-1 ring-white/5" />
            </label>
            <div className="rounded-2xl bg-white/5 p-4 text-sm text-mist/70 ring-1 ring-white/5">
              Cash is enabled. Card is visible in the roadmap but still coming soon.
            </div>
            <button disabled={mutation.isPending || cart.length === 0} className="w-full rounded-2xl bg-emerald-300 px-4 py-3 font-semibold text-night">
              Confirm order
            </button>
          </form>
        ) : (
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl bg-white/5 p-4 text-sm text-mist/75 ring-1 ring-white/5">
              You can review your cart now. Sign in or create an account only when you are ready to complete the purchase.
            </div>
            {showAuth ? <AuthCard initialMode="login" /> : null}
          </div>
        )}
      </GlassCard>

      <GlassCard className="overflow-hidden bg-[#121614] p-6">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-300/12 text-emerald-200">
            <Truck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold text-white">Your order</h2>
            <p className="text-sm text-mist/60">Review items before checkout</p>
          </div>
        </div>
        <div className="mt-6 space-y-4">
          {cart.length ? (
            <>
              {cart.map((item) => (
                <div key={item.lineId || item.productId} className="flex items-center justify-between gap-4 rounded-[1.4rem] bg-white/[0.03] p-4 ring-1 ring-white/5">
                  <div className="space-y-1">
                    <p className="font-semibold text-white">{item.name}</p>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-mist/58">
                      {item.variantLabel ? <span>{item.variantLabel}</span> : null}
                      <span>Qty {item.quantity}</span>
                    </div>
                  </div>
                  <p className="font-semibold text-emerald-100">{formatCurrency(item.price * item.quantity)}</p>
                </div>
              ))}
              <div className="rounded-[1.5rem] bg-white/[0.03] p-4 text-sm text-mist/70 ring-1 ring-white/5">
                {!qualifiesForFreeDelivery ? (
                  <p className="mb-3 text-emerald-200/90">Add {formatCurrency(amountToFreeDelivery)} more to unlock free delivery.</p>
                ) : (
                  <p className="mb-3 text-emerald-200/90">Free delivery unlocked.</p>
                )}
                <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                {cart.length ? (
                  <div className="mt-2 flex justify-between">
                    <span>Delivery</span>
                    <span>{qualifiesForFreeDelivery ? "Free delivery" : formatCurrency(deliveryFee)}</span>
                  </div>
                ) : null}
                <div className="mt-4 flex justify-between font-display text-2xl text-white"><span>Total</span><span>{formatCurrency(total)}</span></div>
              </div>
            </>
          ) : (
            <div className="rounded-[1.6rem] bg-white/[0.03] p-6 text-center text-mist/60 ring-1 ring-white/5">
              Your cart is empty. Add products to start an order.
            </div>
          )}
        </div>
      </GlassCard>

      <div className="fixed bottom-4 left-1/2 z-30 -translate-x-1/2 px-4">
        <Link
          to="/"
          state={{ restoreCatalog: true }}
          className="inline-flex min-w-[220px] items-center justify-center gap-2 rounded-full bg-[#101714]/95 px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(0,0,0,0.35)] ring-1 ring-white/6 backdrop-blur-xl transition hover:bg-[#141c18]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to menu
        </Link>
      </div>
    </div>
  );
}
