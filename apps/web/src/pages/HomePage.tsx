import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import type { Product } from "@choochoo/shared";
import { ChevronDown, ShoppingCart, SlidersHorizontal, X } from "lucide-react";
import { api } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { cn, formatCurrency } from "@/lib/utils";
import { BlurText } from "@/components/BlurText";
import { GlassCard } from "@/components/ui";
import { PwaPrompt } from "@/components/PwaPrompt";

type CatalogCategory = "strains" | "edibles" | "nicotine";
type StrainFilter = "all" | "indica" | "sativa" | "hybrid";
type SortOption = "featured" | "price-asc" | "price-desc" | "name-asc";
const HOME_SNAPSHOT_KEY = "choochoo-home-snapshot";

type HomeSnapshot = {
  scrollY: number;
  selectedCategory: CatalogCategory;
  selectedStrainFilter: StrainFilter;
  selectedGrades: string[];
  sortBy: SortOption;
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
      selectedGrades: Array.isArray(parsed.selectedGrades) ? parsed.selectedGrades.filter((value): value is string => typeof value === "string") : [],
      sortBy:
        parsed.sortBy && ["featured", "price-asc", "price-desc", "name-asc"].includes(parsed.sortBy)
          ? (parsed.sortBy as SortOption)
          : "featured"
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
  setSelectedCategory,
  filtersOpen,
  setFiltersOpen,
  activeFiltersCount
}: {
  selectedCategory: CatalogCategory;
  setSelectedCategory: (value: CatalogCategory) => void;
  filtersOpen: boolean;
  setFiltersOpen: (value: boolean) => void;
  activeFiltersCount: number;
}) {
  return (
    <div className="mx-auto flex w-full max-w-5xl items-center gap-2 rounded-[1.5rem] bg-[#101714]/96 p-2 ring-1 ring-white/5 backdrop-blur-xl">
      <div className="grid min-w-0 flex-1 grid-cols-3 items-center gap-2">
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
      <button
        type="button"
        onClick={() => setFiltersOpen(!filtersOpen)}
        className={cn(
          "inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-2.5 text-sm font-semibold transition",
          filtersOpen ? "bg-white/12 text-white" : "bg-white/5 text-mist/78 hover:bg-white/8 hover:text-white"
        )}
      >
        {filtersOpen ? <X className="h-4 w-4" /> : <SlidersHorizontal className="h-4 w-4" />}
        <span>Filters</span>
        {activeFiltersCount ? (
          <span className="rounded-full bg-emerald-300 px-1.5 py-0.5 text-[10px] font-bold text-night">{activeFiltersCount}</span>
        ) : null}
      </button>
    </div>
  );
}

function FilterChip({
  active,
  label,
  onClick
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-2 text-sm font-medium transition",
        active ? "bg-emerald-300 text-night" : "bg-white/[0.04] text-mist/72 ring-1 ring-white/6 hover:bg-white/[0.07] hover:text-white"
      )}
    >
      {label}
    </button>
  );
}

function FiltersPanel({
  selectedCategory,
  selectedStrainFilter,
  setSelectedStrainFilter,
  selectedGrades,
  toggleGrade,
  clearFilters,
  sortBy,
  setSortBy,
  availableGrades
}: {
  selectedCategory: CatalogCategory;
  selectedStrainFilter: StrainFilter;
  setSelectedStrainFilter: (value: StrainFilter) => void;
  selectedGrades: string[];
  toggleGrade: (value: string) => void;
  clearFilters: () => void;
  sortBy: SortOption;
  setSortBy: (value: SortOption) => void;
  availableGrades: string[];
}) {
  return (
    <div className="mx-auto mt-3 w-full max-w-5xl rounded-[1.8rem] bg-[#101714]/96 p-4 ring-1 ring-white/5 backdrop-blur-xl sm:p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-emerald-300/65">Refine catalog</p>
          <p className="mt-1 text-sm text-mist/62">Sort products and narrow results without changing the scroll flow.</p>
        </div>
        <button type="button" onClick={clearFilters} className="text-sm font-semibold text-emerald-200 transition hover:text-white">
          Clear all
        </button>
      </div>

      <div className="mt-4 space-y-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-mist/52">Sort by</p>
          <div className="flex flex-wrap gap-2">
            {[
              { id: "featured", label: "Featured" },
              { id: "price-asc", label: "Price low to high" },
              { id: "price-desc", label: "Price high to low" },
              { id: "name-asc", label: "Name A-Z" }
            ].map((option) => (
              <FilterChip key={option.id} active={sortBy === option.id} label={option.label} onClick={() => setSortBy(option.id as SortOption)} />
            ))}
          </div>
        </div>

        {selectedCategory === "strains" ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-mist/52">Strain type</p>
            <div className="flex flex-wrap gap-2">
              {[
                { id: "all", label: "All" },
                { id: "indica", label: "Indica" },
                { id: "sativa", label: "Sativa" },
                { id: "hybrid", label: "Hybrid" }
              ].map((option) => (
                <FilterChip
                  key={option.id}
                  active={selectedStrainFilter === option.id}
                  label={option.label}
                  onClick={() => setSelectedStrainFilter(option.id as StrainFilter)}
                />
              ))}
            </div>
          </div>
        ) : null}

        {availableGrades.length ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-mist/52">Category / grade</p>
            <div className="flex flex-wrap gap-2">
              {availableGrades.map((grade) => (
                <FilterChip key={grade} active={selectedGrades.includes(grade)} label={grade.toUpperCase()} onClick={() => toggleGrade(grade)} />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function getProductGrade(product: Product) {
  const metadataGrade = String(product.metadata?.grade || "").trim().toLowerCase();
  if (metadataGrade) return metadataGrade;
  const tagGrade = product.tags.find((tag) => /^\d+a\+?$/i.test(tag.trim()));
  return tagGrade ? tagGrade.trim().toLowerCase() : "";
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
  const cartCount = useAppStore((state) => state.cart.reduce((sum, item) => sum + item.quantity, 0));
  const [selectedCategory, setSelectedCategory] = useState<CatalogCategory>(initialSnapshot?.selectedCategory || "strains");
  const [selectedStrainFilter, setSelectedStrainFilter] = useState<StrainFilter>(initialSnapshot?.selectedStrainFilter || "all");
  const [selectedGrades, setSelectedGrades] = useState<string[]>(initialSnapshot?.selectedGrades || []);
  const [sortBy, setSortBy] = useState<SortOption>(initialSnapshot?.sortBy || "featured");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [showCatalogNav, setShowCatalogNav] = useState(false);
  const restoringCatalogRef = useRef(shouldRestoreCatalog);
  const pendingRestoreScrollRef = useRef<number | null>(null);
  const shouldReplaceRestoreStateRef = useRef(false);
  const productsSectionRef = useRef<HTMLDivElement | null>(null);
  const catalogNavRef = useRef<HTMLDivElement | null>(null);

  const { data } = useQuery({
    queryKey: ["products"],
    queryFn: async () => (await api.products()) as { products: Product[] }
  });

  const products = data?.products || [];

  const availableGrades = useMemo(() => {
    const grades = new Set(
      products
        .filter((product) => product.category === selectedCategory)
        .map(getProductGrade)
        .filter(Boolean)
    );
    return Array.from(grades).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
  }, [products, selectedCategory]);

  const filteredProducts = useMemo(() => {
    let next = products.filter((product) => product.category === selectedCategory);

    if (selectedCategory === "strains" && selectedStrainFilter !== "all") {
      next = next.filter((product) => (product.strainType || "unknown").toLowerCase() === selectedStrainFilter);
    }

    if (selectedGrades.length) {
      next = next.filter((product) => selectedGrades.includes(getProductGrade(product)));
    }

    if (sortBy === "price-asc") {
      next = [...next].sort((a, b) => getStartPrice(a).value - getStartPrice(b).value);
    } else if (sortBy === "price-desc") {
      next = [...next].sort((a, b) => getStartPrice(b).value - getStartPrice(a).value);
    } else if (sortBy === "name-asc") {
      next = [...next].sort((a, b) => a.name.localeCompare(b.name));
    }

    return next;
  }, [products, selectedCategory, selectedStrainFilter, selectedGrades, sortBy]);

  const activeFiltersCount = (selectedStrainFilter !== "all" ? 1 : 0) + selectedGrades.length + (sortBy !== "featured" ? 1 : 0);

  function persistCatalogState() {
    const snapshot: HomeSnapshot = {
      scrollY: window.scrollY,
      selectedCategory,
      selectedStrainFilter,
      selectedGrades,
      sortBy
    };
    sessionStorage.setItem(HOME_SNAPSHOT_KEY, JSON.stringify(snapshot));
  }

  function toggleGrade(grade: string) {
    setSelectedGrades((current) => (current.includes(grade) ? current.filter((value) => value !== grade) : [...current, grade]));
  }

  function clearFilters() {
    setSelectedStrainFilter("all");
    setSelectedGrades([]);
    setSortBy("featured");
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
  }, [selectedCategory, selectedStrainFilter, selectedGrades, sortBy]);

  useLayoutEffect(() => {
    if (!shouldRestoreCatalog || !initialSnapshot) return;

    restoringCatalogRef.current = true;
    pendingRestoreScrollRef.current = Number.isFinite(initialSnapshot.scrollY) ? initialSnapshot.scrollY : 0;
    shouldReplaceRestoreStateRef.current = true;

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
      return;
    }
    setSelectedStrainFilter("all");
    setSelectedGrades([]);
    setSortBy("featured");
    setFiltersOpen(false);
  }, [selectedCategory]);

  useEffect(() => {
    const section = productsSectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowCatalogNav(entry.isIntersecting);
      },
      {
        threshold: 0,
        rootMargin: "-210px 0px 0px 0px"
      }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!filtersOpen) return;

    function handlePointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (catalogNavRef.current?.contains(target)) return;
      setFiltersOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown, { passive: true });

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [filtersOpen]);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-4 sm:px-6 lg:px-10">
      <div className="sticky top-0 z-30 space-y-2 pb-2 pt-1">
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
        <motion.div
          ref={catalogNavRef}
          initial={false}
          animate={{
            opacity: showCatalogNav ? 1 : 0,
            y: showCatalogNav ? 0 : -16,
            maxHeight: showCatalogNav ? (filtersOpen ? 720 : 120) : 0
          }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className={cn("overflow-hidden", showCatalogNav ? "pointer-events-auto" : "pointer-events-none")}
        >
          <div className="space-y-2">
            <CategoryTabs
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              filtersOpen={filtersOpen}
              setFiltersOpen={setFiltersOpen}
              activeFiltersCount={activeFiltersCount}
            />
            {filtersOpen ? (
              <FiltersPanel
                selectedCategory={selectedCategory}
                selectedStrainFilter={selectedStrainFilter}
                setSelectedStrainFilter={setSelectedStrainFilter}
                selectedGrades={selectedGrades}
                toggleGrade={toggleGrade}
                clearFilters={clearFilters}
                sortBy={sortBy}
                setSortBy={setSortBy}
                availableGrades={availableGrades}
              />
            ) : null}
          </div>
        </motion.div>
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

      <section id="catalog" className="pt-14 sm:pt-20">
        <div ref={productsSectionRef} className="mx-auto grid w-full justify-center gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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
