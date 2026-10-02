"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { getProducts, filterProductsForShop } from "@/lib/data";
import type { Product } from "@/lib/types";
import ProductGrid from "@/components/ProductGrid";

const GROUPS = ["All", "New Arrival", "Women", "Men", "Kids"] as const;
const SIZES = ["S", "M", "L", "XL", "XXL"];
const PRICE_BUCKETS = [
  { label: "Under ₹1,000", min: undefined, max: 1000 },
  { label: "₹1,000 – ₹2,500", min: 1000, max: 2500 },
  { label: "₹2,500 – ₹5,000", min: 2500, max: 5000 },
  { label: "Above ₹5,000", min: 5000, max: undefined },
];
const SORT_OPTIONS = [
  { value: "", label: "Sort: Featured" },
  { value: "newest", label: "Newest First" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
];

function ShopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const category = searchParams.get("category") || "All";
  const type = searchParams.get("type") || "";
  const q = searchParams.get("q") || "";
  const occasion = searchParams.get("occasion") || "";
  const sort = searchParams.get("sort") || "";
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const sizesParam = searchParams.get("sizes") || "";
  const selectedSizes = sizesParam ? sizesParam.split(",") : [];

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    getProducts().then((p) => {
      setProducts(p);
      setLoading(false);
    });
  }, []);

  const filtered = filterProductsForShop(products, {
    category: category === "All" ? undefined : category,
    type: type || undefined,
    q: q || undefined,
    occasion: occasion || undefined,
    sort: (sort as "newest" | "price-asc" | "price-desc") || undefined,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    sizes: selectedSizes.length > 0 ? selectedSizes : undefined,
  });

  function updateParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") params.delete(key);
      else params.set(key, value);
    }
    router.push(`/shop?${params.toString()}`);
  }

  function setCategory(g: string) {
    updateParams({ category: g === "All" ? null : g, type: null });
  }

  function togglePriceBucket(bucket: (typeof PRICE_BUCKETS)[number]) {
    const isActive = minPrice === (bucket.min?.toString() ?? null) && maxPrice === (bucket.max?.toString() ?? null);
    if (isActive) {
      updateParams({ minPrice: null, maxPrice: null });
    } else {
      updateParams({ minPrice: bucket.min?.toString() ?? null, maxPrice: bucket.max?.toString() ?? null });
    }
  }

  function toggleSize(size: string) {
    const next = selectedSizes.includes(size) ? selectedSizes.filter((s) => s !== size) : [...selectedSizes, size];
    updateParams({ sizes: next.length > 0 ? next.join(",") : null });
  }

  function clearFilters() {
    updateParams({ minPrice: null, maxPrice: null, sizes: null });
  }

  const activeFilterCount = (minPrice || maxPrice ? 1 : 0) + (selectedSizes.length > 0 ? 1 : 0);

  return (
    <div className="min-h-screen bg-bg pb-28 md:pb-12">
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <h1 className="text-2xl font-bold">
          {q ? `Results for "${q}"` : type ? type : occasion ? `${occasion} Edit` : "Shop"}
        </h1>
        {type && (
          <button onClick={() => updateParams({ type: null })} className="text-xs text-gray-400 underline mt-1">
            Clear "{type}" filter
          </button>
        )}

        <div className="flex gap-2 overflow-x-auto no-scrollbar mt-4 pb-2">
          {GROUPS.map((g) => (
            <button
              key={g}
              onClick={() => setCategory(g)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium ${
                category === g ? "bg-ink text-white" : "bg-card text-ink shadow-card"
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={() => setFiltersOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-card shadow-card"
          >
            <SlidersHorizontal size={14} /> Filters
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-accent text-white text-[10px] flex items-center justify-center">{activeFilterCount}</span>
            )}
          </button>
          <select
            value={sort}
            onChange={(e) => updateParams({ sort: e.target.value || null })}
            className="px-4 py-2 rounded-full text-sm font-medium bg-card shadow-card outline-none"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-4">
        {loading ? (
          <div className="text-center py-16 text-sm text-gray-400">Loading products...</div>
        ) : (
          <ProductGrid products={filtered} />
        )}
      </div>

      {filtersOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center md:justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setFiltersOpen(false)} />
          <div className="relative bg-white rounded-t-3xl md:rounded-3xl w-full md:max-w-md max-h-[85vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Filters</h2>
              <button onClick={() => setFiltersOpen(false)}><X size={20} /></button>
            </div>

            <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Price</p>
            <div className="grid grid-cols-2 gap-2 mb-6">
              {PRICE_BUCKETS.map((bucket) => {
                const isActive = minPrice === (bucket.min?.toString() ?? null) && maxPrice === (bucket.max?.toString() ?? null);
                return (
                  <button
                    key={bucket.label}
                    onClick={() => togglePriceBucket(bucket)}
                    className={`px-3 py-2.5 rounded-xl text-sm font-medium ${isActive ? "bg-ink text-white" : "bg-bg text-ink"}`}
                  >
                    {bucket.label}
                  </button>
                );
              })}
            </div>

            <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Size</p>
            <div className="flex flex-wrap gap-2 mb-6">
              {SIZES.map((size) => (
                <button
                  key={size}
                  onClick={() => toggleSize(size)}
                  className={`w-12 h-12 rounded-full text-sm font-medium ${selectedSizes.includes(size) ? "bg-ink text-white" : "bg-bg text-ink"}`}
                >
                  {size}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button onClick={clearFilters} className="flex-1 bg-bg font-semibold py-3 rounded-full text-sm">Clear All</button>
              <button onClick={() => setFiltersOpen(false)} className="flex-1 bg-ink text-white font-semibold py-3 rounded-full text-sm">
                Show {filtered.length} Result{filtered.length === 1 ? "" : "s"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <ShopContent />
    </Suspense>
  );
}
