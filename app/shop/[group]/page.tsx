import type { Metadata } from "next";
import { notFound } from "next/navigation";
import GroupClient from "./GroupClient";
import { getCategories, getProducts, filterProductsForShop } from "@/lib/data";
import type { Category } from "@/lib/types";

// This page only ever handles Women/Men/Kids (see GROUP_BY_SLUG below) — a
// bare `ShopGroup` import isn't used here since that broader type also
// includes "New Arrival", which has no page of its own in this folder.

type HandledGroup = "Women" | "Men" | "Kids";

const GROUP_BY_SLUG: Record<string, HandledGroup> = {
  women: "Women",
  men: "Men",
  kids: "Kids",
};

// How many products the page shows itself; the rest are on the full
// (paginated) shop list, linked from the "View all" button.
const FIRST_PAGE = 24;

// Rebuild this page in the background at most every 5 minutes, so admin
// changes show up without a redeploy while the database isn't read on
// every visit.
export const revalidate = 300;

type ParamsPromise = Promise<{ group: string }>;

// Plain JSON copy, so nothing database-specific is passed to the browser part.
function toPlain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

// Hardcoded per group rather than built from a template — this keeps each
// title landing in the 50-60 character range (what shows in a Google result
// before truncating) and uses correct grammar ("Kids'" rather than a
// template-generated "Kids's").
const GROUP_META: Record<HandledGroup, { title: string; description: string }> = {
  Women: {
    title: "Women's Fashion Collection — Shop Online",
    description: "Shop the full Women's collection at Zaina Boutique — sarees, lehengas, kurtis and more, from everyday essentials to festive wear.",
  },
  Men: {
    title: "Men's Fashion Collection — Shop Online",
    description: "Shop the full Men's collection at Zaina Boutique — shirts, kurtas, and everyday essentials, from casual wear to festive occasions.",
  },
  Kids: {
    title: "Kids' Fashion Collection — Shop Online",
    description: "Shop the full Kids' collection at Zaina Boutique — everyday essentials and festive wear for boys and girls, all in one place.",
  },
};

export async function generateMetadata({ params }: { params: ParamsPromise }): Promise<Metadata> {
  const { group } = await params;
  const shopGroup = GROUP_BY_SLUG[group.toLowerCase()];
  if (!shopGroup) return { title: "Shop" };
  return {
    ...GROUP_META[shopGroup],
    alternates: { canonical: `/shop/${group.toLowerCase()}` },
  };
}

export async function generateStaticParams() {
  return Object.keys(GROUP_BY_SLUG).map((group) => ({ group }));
}

export default async function ShopGroupPage({ params }: { params: ParamsPromise }) {
  const { group } = await params;
  const slug = group.toLowerCase();
  const shopGroup = GROUP_BY_SLUG[slug];

  // Anything other than women / men / kids is a real 404.
  if (!shopGroup) notFound();

  // Categories and products are loaded here on the server, so the page
  // arrives complete (no "Loading..." step) and search engines can read it.
  let categories: Category[] = [];
  try {
    categories = (await getCategories())
      .filter((c) => c.parent === shopGroup)
      .sort((a, b) => a.order - b.order);
  } catch {
    categories = [];
  }

  const all = await getProducts();
  const matching = filterProductsForShop(all, { category: shopGroup });
  const firstProducts = matching.slice(0, FIRST_PAGE);

  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: base },
      { "@type": "ListItem", position: 2, name: "Shop", item: `${base}/shop` },
      { "@type": "ListItem", position: 3, name: shopGroup, item: `${base}/shop/${slug}` },
    ],
  };
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: firstProducts.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${base}/product/${p.slug}`,
      name: p.title,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      <GroupClient
        shopGroup={shopGroup}
        categories={toPlain(categories)}
        products={toPlain(firstProducts)}
        total={matching.length}
      />
    </>
  );
}
