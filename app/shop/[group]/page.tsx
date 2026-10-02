import type { Metadata } from "next";
import Link from "next/link";
import GroupClient from "./GroupClient";
// This page only ever handles Women/Men/Kids (see GROUP_BY_SLUG below) — a
// bare `ShopGroup` import isn't used here since that broader type also
// includes "New Arrival", which has no page of its own in this folder.

type HandledGroup = "Women" | "Men" | "Kids";

const GROUP_BY_SLUG: Record<string, HandledGroup> = {
  women: "Women",
  men: "Men",
  kids: "Kids",
};

type ParamsPromise = Promise<{ group: string }>;

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
  const shopGroup = GROUP_BY_SLUG[group.toLowerCase()];

  if (!shopGroup) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="font-semibold">Section not found.</p>
        <Link href="/shop" className="text-sm underline">Back to Shop</Link>
      </div>
    );
  }

  // Category/product data is fetched client-side (see GroupClient) rather
  // than here on the server — this page can run in "demo mode" (data saved
  // only in the browser's local storage, before Firebase is connected),
  // which a server has no way to read. Fetching client-side is what lets
  // this page show the exact same admin-managed categories the homepage
  // bubbles already correctly show, in both demo mode and once Firebase is live.
  return <GroupClient shopGroup={shopGroup} />;
}
