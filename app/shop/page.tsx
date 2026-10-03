import type { Metadata } from "next";
import ShopClient from "./ShopClient";

type SearchParamsPromise = Promise<{ [key: string]: string | string[] | undefined }>;

export async function generateMetadata({ searchParams }: { searchParams: SearchParamsPromise }): Promise<Metadata> {
  const params = await searchParams;
  // A free-text search (?q=...) can produce an unlimited number of URLs for
  // the same underlying page, most showing thin or empty results — Google
  // flags these as low-quality/soft-404-ish, and indexing them individually
  // adds no real value over the plain /shop page. Browsing by category or
  // occasion (?category=, ?type=, ?occasion=) is left indexable; those are
  // closer to real landing pages, not an unbounded set of search queries.
  const isSearch = typeof params.q === "string" && params.q.length > 0;

  return {
    title: "Shop Sarees, Lehengas, Kurtis & More",
    description: "Browse the full Zaina Boutique collection — sarees, lehengas, kurtis, and everyday essentials. Filter by category, occasion, or search to find exactly what you're looking for.",
    alternates: { canonical: "/shop" },
    robots: isSearch ? { index: false, follow: true } : undefined,
  };
}

export default function ShopPage() {
  return <ShopClient />;
}
