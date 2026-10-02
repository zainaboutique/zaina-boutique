"use client";

import Image from "@/components/OptimizedImage";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import { Plus, Truck } from "lucide-react";
import type { Product } from "@/lib/types";
import { useCartStore } from "@/store/cart";
import { getCoverImage } from "@/lib/data";

const BADGE_STYLES: Record<string, string> = {
  Premium: "bg-ink text-white",
  Exclusive: "bg-accent text-white",
  "On Sale": "bg-accent text-white",
  Trending: "bg-white text-ink border border-ink/10",
  New: "bg-white text-ink border border-ink/10",
};

export default function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem);
  const cover = getCoverImage(product);
  const isAvailable = product.inStock !== undefined ? product.inStock : product.stock > 0;

  return (
    <Link
      href={`/product/${product.slug}`}
      className="bg-card rounded-2xl shadow-card overflow-hidden flex flex-col group"
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden">
        <Image
          src={cover}
          alt={product.title}
          fill
          className={`object-cover group-hover:scale-105 transition-transform duration-300 ${!isAvailable ? "grayscale opacity-60" : ""}`}
          sizes="(max-width: 768px) 50vw, 25vw"
        />
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.badges.map((badge) => (
            <span
              key={badge}
              className={`text-[10px] font-semibold px-2 py-1 rounded-full ${BADGE_STYLES[badge] ?? "bg-white text-ink"}`}
            >
              {badge}
            </span>
          ))}
        </div>
        {!isAvailable && (
          <span className="absolute top-2 right-2 text-[10px] font-semibold px-2 py-1 rounded-full bg-ink/80 text-white">
            Out of Stock
          </span>
        )}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (isAvailable) addItem(product);
          }}
          disabled={!isAvailable}
          aria-label={`Add ${product.title} to cart`}
          className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-ink text-white flex items-center justify-center shadow-dock active:scale-95 transition disabled:opacity-40"
        >
          <Plus size={16} />
        </button>
      </div>
      <div className="p-3">
        {product.designer && <p className="text-[10px] text-gray-400 uppercase tracking-wide truncate">{product.designer}</p>}
        <p className="text-sm font-medium leading-snug line-clamp-2">{product.title}</p>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-sm font-bold">{formatPrice(product.price)}</p>
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <p className="text-xs text-gray-400 line-through">{formatPrice(product.compareAtPrice)}</p>
          )}
        </div>
        {product.freeShipping && (
          <p className="flex items-center gap-1 text-[11px] text-green-600 font-medium mt-1">
            <Truck size={11} /> Free Shipping
          </p>
        )}
      </div>
    </Link>
  );
}
