import { useQuery } from "@tanstack/react-query";
import type { Product } from "@choochoo/shared";
import { ArrowLeft, Heart, X } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { cn, formatCurrency } from "@/lib/utils";
import { GlassCard } from "@/components/ui";

export function ProductPage() {
  const navigate = useNavigate();
  const { slug = "" } = useParams();
  const addToCart = useAppStore((state) => state.addToCart);
  const { data } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => (await api.product(slug)) as { product: Product }
  });

  const product = data?.product;
  if (!product) return <div className="p-8">Loading...</div>;

  const metadata = product.metadata || {};
  const grade = String(metadata.grade || "");
  const tiers = [
    { amount: "7g", price: Number(metadata.price_quarter || 0) },
    { amount: "14g", price: Number(metadata.price_half || 0) },
    { amount: "28g", price: Number(metadata.price_ounce || 0) },
    { amount: "50g", price: Number(metadata.price_50g || 0) },
    { amount: "100g", price: Number(metadata.price_100g || 0) }
  ].filter((item) => item.price > 0);
  const effects = product.tags.filter((tag) => !["5a+", "5a", "4a+", "4a", "3a+", "3a"].includes(tag.toLowerCase())).slice(0, 6);
  const strainTone =
    product.category === "strains"
      ? product.strainType === "sativa"
        ? "bg-rose-500/15 text-rose-300"
        : product.strainType === "hybrid"
          ? "bg-cyan-400/15 text-cyan-200"
          : "bg-violet-500/15 text-violet-200"
      : "bg-emerald-500/15 text-emerald-200";
  const percent = Number(metadata.indica_percent || metadata.sativa_percent || 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 sm:py-6">
      <GlassCard className="flex min-h-[calc(100svh-2rem)] flex-col rounded-[2rem] p-5 sm:min-h-[calc(100svh-3rem)] sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-bold text-white sm:text-[2rem]">{product.name.replace(/\s+[1-5]A\+?$/i, "")}</h1>
            {grade ? (
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#ffc081] text-lg font-black text-night">
                {grade}
              </span>
            ) : null}
          </div>
          <button
            onClick={() => navigate("/", { state: { restoreCatalog: true } })}
            className="grid h-10 w-10 place-items-center rounded-full text-mist/75 transition hover:bg-white/5 hover:text-white"
          >
            <X className="h-7 w-7" />
          </button>
        </div>

        <div className="mt-5">
          <div className={cn("inline-flex items-center gap-3 rounded-[1rem] px-4 py-2 text-xs font-medium sm:text-sm", strainTone)}>
            <span className="h-2.5 w-2.5 rounded-full bg-current opacity-90" />
            <span>
              {product.strainType ? `${product.strainType[0].toUpperCase()}${product.strainType.slice(1)}` : product.category} {percent ? `${percent}%` : ""}
            </span>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {effects.map((tag) => (
            <span key={tag} className="rounded-2xl bg-white/[0.03] px-3 py-1.5 text-xs text-mist/70 ring-1 ring-white/5 sm:text-sm">
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-7 overflow-hidden rounded-[1.7rem] bg-white/[0.02] ring-1 ring-white/5">
          {tiers.length > 0 ? (
            <>
              <div className="grid grid-cols-[1fr_1fr_1.1fr] bg-white/[0.05] px-4 py-3 text-center text-sm uppercase tracking-[0.18em] text-mist/55 sm:text-base sm:tracking-[0.12em]">
                <span>Amount</span>
                <span>Price</span>
                <span>Wishlist</span>
              </div>
              {tiers.map((tier) => (
                <div key={tier.amount} className="grid grid-cols-[1fr_1fr_1.1fr] items-center border-t border-white/5 px-4 py-3 text-center">
                  <span className="text-base text-mist/75 sm:text-lg">{tier.amount}</span>
                  <span className="text-base font-semibold text-white sm:text-lg">{Math.round(tier.price)}.-</span>
                  <div className="flex justify-center">
                    <button
                      onClick={() =>
                        addToCart({
                          lineId: `${product.id}-${tier.amount}`,
                          productId: product.id,
                          sourceProductId: product.id,
                          name: product.name,
                          variantLabel: tier.amount,
                          price: tier.price,
                          image: product.image,
                          quantity: 1
                        })
                      }
                      className="inline-flex min-w-[96px] items-center justify-center gap-2 rounded-[0.9rem] bg-[#1976e9] px-3 py-2 text-sm font-semibold text-white sm:min-w-[112px] sm:px-4 sm:py-2.5"
                    >
                      <Heart className="h-4 w-4" />
                      Add
                    </button>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="space-y-5 p-5 sm:grid sm:grid-cols-[240px_1fr] sm:items-start sm:gap-6 sm:space-y-0 sm:p-6">
              <img src={product.image || "/logo.png"} alt={product.name} className="h-full min-h-[200px] w-full rounded-[1.4rem] object-cover" />
              <div className="space-y-4">
                <p className="text-sm text-mist/70">{product.description}</p>
                <div className="text-xl font-bold text-emerald-200 sm:text-2xl">{formatCurrency(product.price)}</div>
                <button
                  onClick={() =>
                    addToCart({
                      productId: product.id,
                      sourceProductId: product.id,
                      name: product.name,
                      price: product.price,
                      image: product.image,
                      quantity: 1
                    })
                  }
                  className="rounded-[1rem] bg-[#1976e9] px-4 py-2.5 text-sm font-semibold text-white sm:px-5 sm:py-3"
                >
                  Add to cart
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-auto flex justify-center pt-6">
          <button
            onClick={() => navigate("/", { state: { restoreCatalog: true } })}
            className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/85 ring-1 ring-white/5 transition hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </div>
      </GlassCard>
    </div>
  );
}
