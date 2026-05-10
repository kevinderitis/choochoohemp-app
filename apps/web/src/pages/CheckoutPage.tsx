import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
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

export function CheckoutPage() {
  const navigate = useNavigate();
  const cart = useAppStore((state) => state.cart);
  const clearCart = useAppStore((state) => state.clearCart);
  const user = useAppStore((state) => state.user);
  const { register, handleSubmit } = useForm<CheckoutForm>({
    defaultValues: {
      name: user?.name || "",
      phone: user?.phone || "",
      address: user?.address || "",
      notes: ""
    }
  });

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = 80;

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
    <div className="mx-auto grid max-w-6xl gap-6 p-4 lg:grid-cols-[1.1fr_0.9fr]">
      <GlassCard className="p-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="font-display text-3xl font-bold">Cart</h1>
          <Link to="/" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-mist/80">
            Back to menu
          </Link>
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
                <input {...register(key as keyof CheckoutForm, { required: true })} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none" />
              </label>
            ))}
            <label className="block space-y-2">
              <span className="text-sm text-mist/70">Delivery notes</span>
              <textarea {...register("notes")} className="min-h-28 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none" />
            </label>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-mist/70">
              Cash is enabled. Card is visible in the roadmap but still coming soon.
            </div>
            <button disabled={mutation.isPending || cart.length === 0} className="w-full rounded-2xl bg-emerald-300 px-4 py-3 font-semibold text-night">
              Confirm order
            </button>
          </form>
        ) : (
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-mist/75">
              You can review your cart now. Sign in or create an account only when you are ready to complete the purchase.
            </div>
            <AuthCard />
          </div>
        )}
      </GlassCard>

      <GlassCard className="p-6">
        <h2 className="font-display text-2xl font-bold">Your cart</h2>
        <div className="mt-6 space-y-4">
          {cart.map((item) => (
            <div key={item.lineId || item.productId} className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 p-3">
              <div>
                <p className="font-semibold">{item.name}</p>
                {item.variantLabel ? <p className="text-sm text-mist/60">{item.variantLabel}</p> : null}
                <p className="text-sm text-mist/60">Qty {item.quantity}</p>
              </div>
              <p>{formatCurrency(item.price * item.quantity)}</p>
            </div>
          ))}
          <div className="border-t border-white/10 pt-4 text-sm text-mist/70">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
            <div className="mt-2 flex justify-between"><span>Delivery</span><span>{formatCurrency(deliveryFee)}</span></div>
            <div className="mt-4 flex justify-between font-display text-2xl text-white"><span>Total</span><span>{formatCurrency(subtotal + deliveryFee)}</span></div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
