"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "@/components/OptimizedImage";
import { getCategories, getProducts, filterProductsForShop } from "@/lib/data";
import ProductGrid from "@/components/ProductGrid";
import type { Category, Product, ShopGroup } from "@/lib/types";

export default function GroupClient({ shopGroup }: { shopGroup: ShopGroup }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getCategories(), getProducts()]).then(([allCategories, allProducts]) => {
      setCategories(allCategories.filter((c) => c.parent === shopGroup).sort((a, b) => a.order - b.order));
      setProducts(filterProductsForShop(allProducts, { category: shopGroup }));
      setLoading(false);
    });
  }, [shopGroup]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-gray-400">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-bg pb-8">
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <h1 className="text-2xl font-bold">{shopGroup}'s Collection</h1>

        {categories.length > 0 && (
          <>
            <p className="text-xs uppercase tracking-widest text-gray-400 mt-6 mb-3">Shop By Category</p>
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
          <p className="text-xs uppercase tracking-widest text-gray-400">All {shopGroup}'s Products</p>
          <Link href={`/shop?category=${encodeURIComponent(shopGroup)}`} className="text-xs underline">View All</Link>
        </div>
        <ProductGrid products={products} />
      </div>
    </div>
  );
}
