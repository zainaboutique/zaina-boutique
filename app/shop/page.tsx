import type { Metadata } from "next";
import { getProducts, filterProductsForShop } from "@/lib/data";
import type { Product } from "@/lib/types";
import ShopClient from "./ShopClient";

const PAGE_SIZE = 24;

type SearchParamsPromise = Promise<{ [key: string]: string | string[] | undefined }>;

function first(v: string | string[] | undefined): string {
  return Array.isArray(v) ? v[0] ?? "" : v ?? "";
}

function num(v: string | undefined): number | undefined {
  if (!v) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

// Plain JSON copy, so nothing database-specific is passed to the browser part.
function toPlain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

// Keeps the full catalogue in server memory for 2 minutes, so the database
// isn't read again for every visitor. Admin changes show up within ~2 minutes.
const CACHE_MS = 120_000;
let productCache: { at: number; data: Product[] } | null = null;
async function getCachedProducts(): Promise<Product[]> {
  if (productCache && Date.now() - productCache.at < CACHE_MS) return productCache.data;
  const data = await getProducts();
  productCache = { at: Date.now(), data };
  return data;
}

export async function generateMetadata({ searchParams }: { searchParams: SearchParamsPromise }): Promise<Metadata> {
  const params = await searchParams;
  // A free-text search (?q=...) can produce an unlimited number of URLs for
  // the same underlying page, most showing thin or empty results — Google
  // flags these as low-quality/soft-404-ish, and indexing them individually
  // adds no real value over the plain /shop page. Browsing by category or
  // occasion (?category=, ?type=, ?occasion=) is left indexable; those are
  // closer to real landing pages, not an unbounded set of search queries.
  // Pages 2, 3... of a list are also kept out of the index.
  const isSearch = first(params.q).length > 0;
  const page = Number(first(params.page)) || 1;

  return {
    title: "Shop Sarees, Lehengas, Kurtis & More",
    description: "Browse the full Zaina Boutique collection — sarees, lehengas, kurtis, and everyday essentials. Filter by category, occasion, or search to find exactly what you're looking for.",
    alternates: { canonical: "/shop" },
    robots: isSearch || page > 1 ? { index: false, follow: true } : undefined,
  };
}

export default async function ShopPage({ searchParams }: { searchParams: SearchParamsPromise }) {
  const sp = await searchParams;

  // The address's filters as plain text, e.g. { category: "Women", sort: "newest" }.
  const params: Record<string, string> = {};
  for (const [key, value] of Object.entries(sp)) {
    const v = first(value);
    if (v) params[key] = v;
  }

  const all = await getCachedProducts();

  const category = params.category || "All";
  const sizes = params.sizes ? params.sizes.split(",").filter(Boolean) : [];
  const filtered = filterProductsForShop(all, {
    category: category === "All" ? undefined : category,
    type: params.type || undefined,
    q: params.q || undefined,
    occasion: params.occasion || undefined,
    sort: (params.sort as "newest" | "price-asc" | "price-desc") || undefined,
    minPrice: num(params.minPrice),
    maxPrice: num(params.maxPrice),
    sizes: sizes.length > 0 ? sizes : undefined,
  });

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(Math.max(1, Number(params.page) || 1), pageCount);
  const pageProducts = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: pageProducts.map((p, i) => ({
      "@type": "ListItem",
      position: (page - 1) * PAGE_SIZE + i + 1,
      url: `${base}/product/${p.slug}`,
      name: p.title,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      <ShopClient products={toPlain(pageProducts)} total={total} page={page} pageCount={pageCount} params={params} />
    </>
  );
}
