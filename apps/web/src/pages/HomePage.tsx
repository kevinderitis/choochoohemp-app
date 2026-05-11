import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import type { Product } from "@choochoo/shared";
import { ChevronDown, ShoppingCart } from "lucide-react";
import { api } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { cn, formatCurrency } from "@/lib/utils";
import { BlurText } from "@/components/BlurText";
import { GlassCard } from "@/components/ui";
import { PwaPrompt } from "@/components/PwaPrompt";

type CatalogCategory = "strains" | "edibles" | "nicotine";
type StrainFilter = "all" | "indica" | "sativa" | "hybrid";
const HOME_SNAPSHOT_KEY = "choochoo-home-snapshot";

type HomeSnapshot = {
  scrollY: number;
  selectedCategory: CatalogCategory;
  selectedStrainFilter: StrainFilter;
  filtersCollapsed: boolean;
  filtersPinned: boolean;
  hasAutoCollapsed: boolean;
};

function readHomeSnapshot() {
  try {
    const raw = sessionStorage.getItem(HOME_SNAPSHOT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<HomeSnapshot>;
    const category =
      parsed.selectedCategory && ["strains", "edibles", "nicotine"].includes(parsed.selectedCategory)
        ? (parsed.selectedCategory as CatalogCategory)
        : "strains";
    const strainFilter =
      parsed.selectedStrainFilter && ["all", "indica", "sativa", "hybrid"].includes(parsed.selectedStrainFilter)
        ? (parsed.selectedStrainFilter as StrainFilter)
        : "all";

    return {
      scrollY: Number(parsed.scrollY || 0),
      selectedCategory: category,
      selectedStrainFilter: strainFilter,
      filtersCollapsed: Boolean(parsed.filtersCollapsed),
      filtersPinned: Boolean(parsed.filtersPinned),
      hasAutoCollapsed: Boolean(parsed.hasAutoCollapsed)
    } satisfies HomeSnapshot;
  } catch {
    return null;
  }
}

const categoryTabs: Array<{ id: CatalogCategory; label: string }> = [
  { id: "strains", label: "Strains" },
  { id: "edibles", label: "Edibles" },
  { id: "nicotine", label: "Nicotine" }
];

function getStrainTone(product: Product) {
  const strain = (product.strainType || "unknown").toLowerCase();
  if (strain === "sativa") return "bg-rose-500/15 text-rose-300";
  if (strain === "hybrid") return "bg-cyan-400/15 text-cyan-200";
  return "bg-violet-500/15 text-violet-200";
}

function getPromoStamp(product: Product) {
  const subCategory = String(product.metadata?.sub_category || "").toLowerCase();
  if (subCategory.includes("best value")) return "Best value";
  if (subCategory.includes("premium")) return "Premium";
  if (subCategory.includes("organic")) return "Organic";
  return "";
}

function getStartPrice(product: Product) {
  const metadata = product.metadata || {};
  const tiers = [
    { value: Number(metadata.price_quarter || 0), unit: "7g" },
    { value: Number(metadata.price_eighth || 0), unit: "3.5g" },
    { value: Number(metadata.price_gram || 0), unit: "1g" },
    { value: Number(metadata.price_joint || 0), unit: "joint" },
    { value: product.price || 0, unit: "unit" }
  ].filter((tier) => tier.value > 0);

  return tiers[0] || { value: product.price || 0, unit: "unit" };
}

function CategoryTabs({
  selectedCategory,
  setSelectedCategory
}: {
  selectedCategory: CatalogCategory;
  setSelectedCategory: (value: CatalogCategory) => void;
}) {
  return (
    <div className="flex justify-center">
      <div className="grid w-full max-w-xl grid-cols-3 items-center gap-2 rounded-full bg-[#101714] p-2 ring-1 ring-white/5">
        {categoryTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedCategory(tab.id)}
            className={cn(
              "rounded-full px-2 py-2.5 text-sm font-semibold transition",
              selectedCategory === tab.id ? "bg-emerald-300 text-night" : "text-mist/70 hover:bg-white/5 hover:text-white"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function StrainTypeTabs({
  selectedStrainFilter,
  setSelectedStrainFilter
}: {
  selectedStrainFilter: StrainFilter;
  setSelectedStrainFilter: (value: StrainFilter) => void;
}) {
  return (
    <div className="flex justify-center">
      <div className="flex w-full max-w-xl items-center justify-center gap-2 rounded-full bg-[#101714]/95 px-2 py-2 ring-1 ring-white/5">
        {[
          { id: "all", label: "All" },
          { id: "indica", label: "Indica" },
          { id: "sativa", label: "Sativa" },
          { id: "hybrid", label: "Hybrid" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedStrainFilter(tab.id as StrainFilter)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold transition",
              selectedStrainFilter === tab.id ? "bg-violet-500/90 text-white" : "text-mist/70 hover:bg-white/5 hover:text-white"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function StrainCard({ product, onOpen }: { product: Product; onOpen: () => void }) {
  const effects = product.tags.filter((tag) => !["5a+", "5a", "4a+", "4a", "3a+", "3a"].includes(tag.toLowerCase())).slice(0, 3);
  const grade = String(product.metadata?.grade || "");
  const stamp = getPromoStamp(product);
  const startPrice = getStartPrice(product);
  const strainType = product.strainType ? `${product.strainType[0].toUpperCase()}${product.strainType.slice(1)}` : "Hybrid";
  const indica = Number(product.metadata?.indica_percent || 0);
  const sativa = Number(product.metadata?.sativa_percent || 0);
  const percent = indica || sativa || 0;

  return (
    <motion.article whileHover={{ y: -4 }} className="mx-auto h-full w-full max-w-[320px]">
      <GlassCard className="relative flex h-full min-h-[208px] flex-col rounded-[1.7rem] bg-[#171717] p-4">
        {stamp ? (
          <div className="absolute right-3 top-3 rounded-[1rem] border border-lime-300/60 bg-rose-500 px-2.5 py-2 text-right text-[10px] font-extrabold uppercase leading-none text-white shadow-lg shadow-rose-950/40">
            {stamp}
          </div>
        ) : null}

        <div className={cn("mb-4 inline-flex w-fit items-center gap-3 rounded-[1rem] px-4 py-2 text-sm font-medium", getStrainTone(product))}>
          <span className="h-2.5 w-2.5 rounded-full bg-current opacity-90" />
          <span>
            {strainType} {percent ? `${percent}%` : ""}
          </span>
        </div>

        <div className="mb-3 flex items-center gap-3 pr-16">
          <h3 className="font-display text-[1.45rem] font-bold leading-tight text-white">{product.name.replace(/\s+[1-5]A\+?$/i, "")}</h3>
          {grade ? (
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#ffc081] text-lg font-black text-night">
              {grade}
            </span>
          ) : null}
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          {effects.map((effect) => (
            <span key={effect} className="rounded-2xl bg-white/[0.03] px-3 py-1 text-xs text-mist/65 ring-1 ring-white/5">
              {effect}
            </span>
          ))}
        </div>

        <div className="mt-auto flex items-center justify-center gap-2 text-sm text-mist/60">
          <span>Starts at</span>
          <span className="font-display text-[1.2rem] font-bold text-white">{Math.round(startPrice.value)}.-</span>
          <span>/{startPrice.unit}</span>
        </div>

        <div className="mt-4 grid gap-2">
          <Link to={`/product/${product.slug}`} onClick={onOpen} className="rounded-[1rem] bg-[#1976e9] px-5 py-3 text-center text-base font-semibold text-white">
            View more
          </Link>
        </div>
      </GlassCard>
    </motion.article>
  );
}

function ProductImageCard({ product, onOpen }: { product: Product; onOpen: () => void }) {
  return (
    <motion.article whileHover={{ y: -4 }} className="mx-auto h-full w-full max-w-[320px]">
      <GlassCard className="flex h-full min-h-[390px] flex-col overflow-hidden rounded-[1.7rem] bg-[#171717]">
        <div className="aspect-[1.15/1] overflow-hidden bg-black/40">
          <img src={product.image || "/logo.png"} alt={product.name} className="h-full w-full object-cover" />
        </div>
        <div className="flex flex-1 flex-col gap-3 p-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-300/80">{product.category}</p>
            <h3 className="mt-2 font-display text-xl font-bold text-white">{product.name}</h3>
            <p className="mt-2 line-clamp-2 text-sm text-mist/65">{product.description}</p>
          </div>
          <div className="mt-auto space-y-3">
            <span className="block text-center text-lg font-semibold text-emerald-200">{formatCurrency(product.price)}</span>
            <Link to={`/product/${product.slug}`} onClick={onOpen} className="block rounded-[1rem] bg-[#1976e9] px-4 py-3 text-center text-base font-semibold text-white">
              View more
            </Link>
          </div>
        </div>
      </GlassCard>
    </motion.article>
  );
}

export function HomePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const shouldRestoreCatalog = Boolean((location.state as { restoreCatalog?: boolean } | null)?.restoreCatalog);
  const initialSnapshot = shouldRestoreCatalog ? readHomeSnapshot() : null;
  const addToCart = useAppStore((state) => state.addToCart);
  const cartCount = useAppStore((state) => state.cart.reduce((sum, item) => sum + item.quantity, 0));
  const [selectedCategory, setSelectedCategory] = useState<CatalogCategory>(initialSnapshot?.selectedCategory || "strains");
  const [selectedStrainFilter, setSelectedStrainFilter] = useState<StrainFilter>(initialSnapshot?.selectedStrainFilter || "all");
  const [filtersCollapsed, setFiltersCollapsed] = useState(initialSnapshot?.filtersCollapsed ?? false);
  const [filtersPinned, setFiltersPinned] = useState(initialSnapshot?.filtersPinned ?? false);
  const [hasAutoCollapsed, setHasAutoCollapsed] = useState(initialSnapshot?.hasAutoCollapsed ?? false);
  const filtersWrapperRef = useRef<HTMLDivElement | null>(null);
  const productsGridRef = useRef<HTMLDivElement | null>(null);
  const suppressAutoCollapseRef = useRef(false);
  const lastScrollYRef = useRef(0);
  const lastGestureAtRef = useRef(0);
  const downScrollCountRef = useRef(0);
  const restoringCatalogRef = useRef(shouldRestoreCatalog);
  const pendingRestoreScrollRef = useRef<number | null>(null);
  const shouldReplaceRestoreStateRef = useRef(false);

  const { data } = useQuery({
    queryKey: ["products"],
    queryFn: async () => (await api.products()) as { products: Product[] }
  });

  const products = data?.products || [];

  const filteredProducts = useMemo(() => {
    const byCategory = products.filter((product) => product.category === selectedCategory);
    if (selectedCategory !== "strains" || selectedStrainFilter === "all") return byCategory;
    return byCategory.filter((product) => (product.strainType || "unknown").toLowerCase() === selectedStrainFilter);
  }, [products, selectedCategory, selectedStrainFilter]);

  function persistCatalogState() {
    const snapshot: HomeSnapshot = {
      scrollY: window.scrollY,
      selectedCategory,
      selectedStrainFilter,
      filtersCollapsed,
      filtersPinned,
      hasAutoCollapsed
    };
    sessionStorage.setItem(HOME_SNAPSHOT_KEY, JSON.stringify(snapshot));
  }

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useEffect(() => {
    persistCatalogState();
    window.addEventListener("scroll", persistCatalogState, { passive: true });
    return () => window.removeEventListener("scroll", persistCatalogState);
  }, [selectedCategory, selectedStrainFilter, filtersCollapsed, filtersPinned, hasAutoCollapsed]);

  useLayoutEffect(() => {
    if (!shouldRestoreCatalog || !initialSnapshot) return;

    restoringCatalogRef.current = true;
    pendingRestoreScrollRef.current = Number.isFinite(initialSnapshot.scrollY) ? initialSnapshot.scrollY : 0;
    shouldReplaceRestoreStateRef.current = true;
    suppressAutoCollapseRef.current = true;
    downScrollCountRef.current = 0;

    const restoreScroll = () => window.scrollTo({ top: Number.isFinite(initialSnapshot.scrollY) ? initialSnapshot.scrollY : 0, behavior: "auto" });
    restoreScroll();
    requestAnimationFrame(() => {
      restoreScroll();
    });
  }, [initialSnapshot, navigate, shouldRestoreCatalog]);

  useEffect(() => {
    if (pendingRestoreScrollRef.current === null) return;
    if (!filteredProducts.length) return;

    const targetScroll = pendingRestoreScrollRef.current;
    const restoreScroll = () => window.scrollTo({ top: targetScroll, behavior: "auto" });

    restoreScroll();
    requestAnimationFrame(() => {
      restoreScroll();
      requestAnimationFrame(() => {
        restoreScroll();
        pendingRestoreScrollRef.current = null;
        restoringCatalogRef.current = false;
        if (shouldReplaceRestoreStateRef.current) {
          shouldReplaceRestoreStateRef.current = false;
          navigate(location.pathname, { replace: true, state: null });
        }
      });
    });
  }, [filteredProducts]);

  useEffect(() => {
    if (restoringCatalogRef.current) {
      setFiltersCollapsed(true);
      setHasAutoCollapsed(true);
      suppressAutoCollapseRef.current = true;
      downScrollCountRef.current = 0;
      return;
    }
    setSelectedStrainFilter("all");
    setFiltersCollapsed(false);
    setFiltersPinned(false);
    setHasAutoCollapsed(false);
    suppressAutoCollapseRef.current = true;
    downScrollCountRef.current = 0;
  }, [selectedCategory]);

  useEffect(() => {
    if (restoringCatalogRef.current) {
      setFiltersCollapsed(true);
      setHasAutoCollapsed(true);
      suppressAutoCollapseRef.current = true;
      downScrollCountRef.current = 0;
      return;
    }
    setFiltersCollapsed(false);
    setFiltersPinned(false);
    setHasAutoCollapsed(false);
    suppressAutoCollapseRef.current = true;
    downScrollCountRef.current = 0;
  }, [selectedStrainFilter]);

  useEffect(() => {
    const stickyTop = 88;
    let lastOffset = -1;

    function updateOffset() {
      const wrapperTop = filtersWrapperRef.current?.getBoundingClientRect().top ?? stickyTop;
      const wrapperHeight = filtersWrapperRef.current?.getBoundingClientRect().height ?? 0;
      const stickyActive = wrapperTop <= stickyTop + 1;
      const nextOffset = stickyActive ? Math.max(0, Math.round(wrapperHeight - 12)) : 0;
      if (nextOffset !== lastOffset && productsGridRef.current) {
        lastOffset = nextOffset;
        productsGridRef.current.style.paddingTop = `${nextOffset}px`;
      }

      setFiltersPinned((current) => (current === stickyActive ? current : stickyActive));

      if (!stickyActive) {
        downScrollCountRef.current = 0;
      }
    }

    updateOffset();
    window.addEventListener("scroll", updateOffset, { passive: true });
    window.addEventListener("resize", updateOffset);

    return () => {
      window.removeEventListener("scroll", updateOffset);
      window.removeEventListener("resize", updateOffset);
    };
  }, [selectedCategory, selectedStrainFilter]);

  useEffect(() => {
    function registerDownGesture() {
      if (suppressAutoCollapseRef.current || hasAutoCollapsed || !filtersPinned) return;
      const now = Date.now();
      if (now - lastGestureAtRef.current < 180) return;
      lastGestureAtRef.current = now;
      downScrollCountRef.current += 1;

      if (downScrollCountRef.current >= 2) {
        setFiltersCollapsed(true);
        setHasAutoCollapsed(true);
      }
    }

    function onWheel(event: WheelEvent) {
      if (event.deltaY <= 0) return;
      suppressAutoCollapseRef.current = false;
      registerDownGesture();
    }

    function onTouchMove() {
      const currentY = window.scrollY;
      if (currentY - lastScrollYRef.current > 6) {
        suppressAutoCollapseRef.current = false;
        registerDownGesture();
      }
      lastScrollYRef.current = currentY;
    }

    lastScrollYRef.current = window.scrollY;
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, [filtersPinned, hasAutoCollapsed]);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-4 sm:px-6 lg:px-10">
      <div className="sticky top-0 z-30 pb-1 pt-1">
        <header className="rounded-full border border-white/10 bg-[#0b120f]/95 px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Choo Choo Hemp" className="h-12 w-12 rounded-2xl object-cover" />
              <div>
                <p className="font-display text-lg font-bold">Choo Choo Hemp</p>
                <p className="text-xs text-mist/60">Club catalog + delivery</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <PwaPrompt />
              <Link to="/checkout" onClick={persistCatalogState} className="relative rounded-full border border-white/10 bg-white/5 p-3 text-sm font-semibold">
                <ShoppingCart className="h-5 w-5" />
                {cartCount ? (
                  <span className="absolute -right-1 -top-1 rounded-full bg-emerald-300 px-1.5 py-0.5 text-[10px] font-bold text-night">
                    {cartCount}
                  </span>
                ) : null}
              </Link>
            </div>
          </div>
        </header>
      </div>

      <section className="-mx-4 sm:-mx-6 lg:-mx-10">
        <GlassCard className="overflow-hidden rounded-b-[2rem] rounded-t-none border-transparent bg-black shadow-none">
          <div className="relative isolate flex min-h-[calc(100svh-12.5rem)] flex-col justify-between overflow-hidden transform-gpu sm:min-h-[calc(100svh-11.5rem)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,84,58,0.26),transparent_34%),radial-gradient(circle_at_bottom,rgba(15,34,25,0.38),transparent_30%)]" />
            <div className="relative flex min-h-0 flex-1 items-stretch justify-center overflow-hidden">
              <img src="/choochoo-hero.png" alt="Choo Choo Hemp" className="h-full w-full object-cover object-center [object-position:center_36%]" />
            </div>
            <div className="relative border-t border-white/10 bg-gradient-to-t from-[#0d1512] via-[#0d1512]/98 to-[#0d1512]/92 px-5 py-6 text-center sm:px-8 sm:py-7">
              <p className="mx-auto max-w-4xl text-balance text-xs text-mist/80 sm:text-base">
                Discover the high-quality weed, edibles, and tobacco at Choo Choo Hemp, your trusted guide to cannabis culture and wellness in Thailand.
              </p>
              <a href="#catalog" className="mt-3 inline-flex flex-col items-center gap-1 text-mist/65 sm:mt-4">
                <span className="text-xs uppercase tracking-[0.32em]">Scroll to explore</span>
                <motion.span
                  animate={{ y: [0, 8, 0] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                  className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/5"
                >
                  <ChevronDown className="h-5 w-5" />
                </motion.span>
              </a>
            </div>
          </div>
        </GlassCard>
      </section>

      <section className="px-2 pb-3 pt-28 sm:pb-5 sm:pt-40">
        <div className="mx-auto max-w-5xl space-y-4 text-center">
          <BlurText
            text="Explore our catalog"
            className="mx-auto justify-center font-display text-3xl font-bold tracking-[-0.03em] text-white sm:text-5xl"
            delay={190}
            animateBy="words"
            direction="top"
            threshold={0.35}
            rootMargin="-40px"
            stepDuration={0.42}
          />
          <p className="mx-auto max-w-2xl text-sm text-mist/58 sm:text-base">
            Order premium strains, edibles, and nicotine online with fast local delivery.
          </p>
        </div>
        <div className="mx-auto mt-10 max-w-5xl overflow-hidden rounded-[2rem] bg-[#0d1512]/65 shadow-[0_30px_70px_rgba(0,0,0,0.28)] ring-1 ring-white/5">
          <img src="/catalog-showcase.png" alt="Strains, edibles, and nicotine showcase" className="h-auto w-full object-cover" />
        </div>
      </section>

      <section id="catalog" className="pt-5">
        <div ref={filtersWrapperRef} className="sticky top-[88px] z-20 -mx-1 mb-6 px-1 pb-4 pt-1">
          <div className="mx-auto w-full max-w-xl">
            <motion.button
              type="button"
              onClick={() => {
                setFiltersPinned(true);
                setFiltersCollapsed((current) => {
                  const next = !current;
                  if (!next) {
                    setHasAutoCollapsed(false);
                  }
                  return next;
                });
                suppressAutoCollapseRef.current = true;
                downScrollCountRef.current = 0;
              }}
              animate={{ opacity: filtersPinned ? 1 : 0, y: filtersPinned ? 0 : -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="mx-auto mb-2 flex h-10 items-center justify-center gap-2 rounded-full border border-white/10 bg-[#101714] px-4 text-mist/80 shadow-lg shadow-black/20"
              aria-label={filtersCollapsed ? "Open filters" : "Close filters"}
            >
              <ChevronDown className={cn("h-4 w-4 transition-transform", filtersCollapsed ? "rotate-180" : "")} />
              <span className="text-[11px] font-semibold uppercase tracking-[0.28em]">Filters</span>
            </motion.button>

            <motion.div
              animate={{
                y: filtersCollapsed && filtersPinned ? -24 : 0,
                maxHeight: filtersCollapsed && filtersPinned ? 0 : 180,
                opacity: filtersCollapsed && filtersPinned ? 0 : 1
              }}
              transition={{ duration: 0.24, ease: "easeOut" }}
              className={cn("overflow-hidden", filtersCollapsed && filtersPinned ? "pointer-events-none" : "pointer-events-auto")}
            >
              <div className="space-y-2.5">
                <CategoryTabs selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} />
                {selectedCategory === "strains" ? (
                  <StrainTypeTabs selectedStrainFilter={selectedStrainFilter} setSelectedStrainFilter={setSelectedStrainFilter} />
                ) : null}
              </div>
            </motion.div>
          </div>
        </div>

        <div
          ref={productsGridRef}
          className={cn(
            "mx-auto grid w-full justify-center gap-4",
            selectedCategory === "strains" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          )}
        >
          {filteredProducts.map((product) => (
            <div key={product.id}>
              {selectedCategory === "strains" ? (
                <StrainCard product={product} onOpen={persistCatalogState} />
              ) : (
                <ProductImageCard product={product} onOpen={persistCatalogState} />
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
