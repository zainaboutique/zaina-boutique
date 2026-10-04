"use client";

import Link from "next/link";
import Image from "@/components/OptimizedImage";
import ProductGrid from "@/components/ProductGrid";
import type { Category, Product, ShopGroup } from "@/lib/types";

interface Props {
  shopGroup: ShopGroup;
  // All loaded on the server, so the page arrives complete.
  categories: Category[];
  products: Product[]; // the first page of this group's products
  total: number; // how many products this group has in all
}

export default function GroupClient({ shopGroup, categories, products, total }: Props) {
  // "Women's", "Men's" — but "Kids'" (not "Kids's").
  const possessive = shopGroup.endsWith("s") ? `${shopGroup}'` : `${shopGroup}'s`;

  return (
    <div className="min-h-screen bg-bg pb-8">
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <nav aria-label="Breadcrumb" className="text-xs text-gray-400 mb-3">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li><Link href="/" className="hover:text-ink">Home</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link href="/shop" className="hover:text-ink">Shop</Link></li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-ink">{shopGroup}</li>
          </ol>
        </nav>

        <h1 className="text-2xl font-bold">{possessive} Collection</h1>

        {categories.length > 0 && (
          <>
            <h2 className="text-xs uppercase tracking-widest text-gray-400 font-normal mt-6 mb-3">Shop By Category</h2>
            <div className="flex gap-4 overflow-x-auto no-scrollbar">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/shop?category=${encodeURIComponent(shopGroup)}&type=${encodeURIComponent(cat.name)}`}
                  className="flex flex-col items-center gap-1.5 shrink-0"
                >
                  <div className="w-16 h-16 rounded-full overflow-hidden shadow-card relative bg-card">
                    <Image
                      src={cat.imageUrl}
                      alt={cat.name}
                      fill
                      className="object-cover"
                      style={{ objectPosition: `${cat.position?.x ?? 50}% ${cat.position?.y ?? 50}%` }}
                      sizes="64px"
                    />
                  </div>
                  <span className="text-xs font-medium whitespace-nowrap">{cat.name}</span>
                </Link>
              ))}
            </div>
          </>
        )}

        <div className="flex items-center justify-between mt-8 mb-3">
          <h2 className="text-xs uppercase tracking-widest text-gray-400 font-normal">All {possessive} Products</h2>
          <Link href={`/shop?category=${encodeURIComponent(shopGroup)}`} className="text-xs underline">View All</Link>
        </div>
        <ProductGrid products={products} />

        {total > products.length && (
          <div className="text-center mt-8">
            <Link
              href={`/shop?category=${encodeURIComponent(shopGroup)}`}
              className="inline-block px-6 py-3 rounded-full bg-card shadow-card text-sm font-semibold"
            >
              View all {total} products →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
