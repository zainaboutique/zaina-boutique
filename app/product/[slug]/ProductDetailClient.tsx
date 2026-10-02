"use client";

import { useEffect, useState } from "react";
import Image from "@/components/OptimizedImage";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShoppingBag, Truck } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/lib/types";
import { useCartStore } from "@/store/cart";
import { getProductBySlug, getProducts, getRelatedProducts } from "@/lib/data";
import ProductCard from "@/components/ProductCard";
import ProductGallery from "@/components/ProductGallery";
import ProductReviews from "@/components/ProductReviews";

export default function ProductDetailClient({ slug }: { slug: string }) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.open);
  const totalItems = useCartStore((s) => s.totalItems());

  const [product, setProduct] = useState<Product | null | undefined>(undefined);
  const [activeImage, setActiveImage] = useState(0);
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [qty, setQty] = useState(1);
  const [related, setRelated] = useState<Product[]>([]);

  useEffect(() => {
    (async () => {
      const p = await getProductBySlug(slug);
      setProduct(p);
      if (p) {
        setSize((p.sizes?.length ? p.sizes[0] : "M"));
        setColor(p.colors?.length ? p.colors[0].name : "");
        const all = await getProducts();
        setRelated(getRelatedProducts(all, p));
      }
    })();
  }, [slug]);

  if (product === undefined) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-gray-400">Loading...</div>;
  }

  if (product === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="font-semibold">Product not found.</p>
        <Link href="/shop" className="text-sm underline">Back to Shop</Link>
      </div>
    );
  }

  const isAvailable = product.inStock !== undefined ? product.inStock : product.stock > 0;
  const sizes = product.sizes?.length ? product.sizes : ["S", "M", "L", "XL"];
  const images = product.images?.length ? product.images : [product.imageUrl];

  function handleAdd(buyNow: boolean) {
    addItem(product!, size, qty, color || undefined);
    if (buyNow) openCart();
  }

  return (
    <div className="min-h-screen bg-bg pb-28 md:pb-12">
      <div className="sticky top-0 z-30 bg-bg/95 backdrop-blur flex items-center justify-between px-4 py-3 border-b border-black/5 md:hidden">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-full bg-card shadow-card flex items-center justify-center">
          <ArrowLeft size={16} />
        </button>
        <span className="text-sm font-semibold">Product</span>
        <button onClick={openCart} className="relative w-9 h-9 rounded-full bg-card shadow-card flex items-center justify-center">
          <ShoppingBag size={16} />
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 bg-accent text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {totalItems}
            </span>
          )}
        </button>
      </div>

      <div className="max-w-6xl mx-auto md:px-6 md:py-8 md:grid md:grid-cols-2 md:gap-10">
        <div className="md:max-w-[480px]">
          <ProductGallery
            images={images}
            alt={product.title}
            activeIndex={activeImage}
            onActiveIndexChange={setActiveImage}
          />
        </div>

        <div className="px-4 md:px-0 py-5 md:py-0">
          {product.designer && <p className="text-xs text-gray-400 uppercase tracking-wide">{product.designer}</p>}
          <h1 className="text-xl md:text-2xl font-bold">{product.title}</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-lg font-bold">{formatPrice(product.price)}</p>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <p className="text-sm text-gray-400 line-through">{formatPrice(product.compareAtPrice)}</p>
            )}
          </div>
          {product.freeShipping && (
            <p className="flex items-center gap-1.5 text-sm text-green-600 font-medium mt-2">
              <Truck size={14} /> Free Shipping on this item
            </p>
          )}
          <p className="text-sm text-gray-500 mt-3 max-w-md">{product.description}</p>

          {(product.fabric || product.subCategory || (product.categories && product.categories.length > 0)) && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {product.fabric && <span className="text-[11px] bg-card px-2.5 py-1 rounded-full">{product.fabric}</span>}
              {product.subCategory && <span className="text-[11px] bg-card px-2.5 py-1 rounded-full">{product.subCategory}</span>}
              {(product.categories ?? []).map((c) => (
                <span key={c} className="text-[11px] bg-card px-2.5 py-1 rounded-full">{c}</span>
              ))}
            </div>
          )}

          {product.details && (product.details.material || product.details.fit || product.details.care) && (
            <div className="mt-5 rounded-2xl bg-card p-4 text-sm space-y-1.5 max-w-md">
              {product.details.material && <div className="flex justify-between"><span className="text-gray-400">Material</span><span className="font-medium text-right">{product.details.material}</span></div>}
              {product.details.fit && <div className="flex justify-between"><span className="text-gray-400">Fit</span><span className="font-medium text-right">{product.details.fit}</span></div>}
              {product.details.care && <div className="flex justify-between"><span className="text-gray-400">Care</span><span className="font-medium text-right">{product.details.care}</span></div>}
            </div>
          )}

          {product.colors && product.colors.length > 0 && (
            <div className="mt-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold">Color</p>
                {color && <span className="text-xs text-gray-400">{color}</span>}
              </div>
              <div className="flex gap-2 flex-wrap">
                {product.colors.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => {
                      setColor(c.name);
                      if (c.photoUrl) {
                        const idx = images.indexOf(c.photoUrl);
                        if (idx >= 0) setActiveImage(idx);
                      }
                    }}
                    title={c.name}
                    className={`relative w-12 h-12 rounded-full overflow-hidden border-2 ${color === c.name ? "border-ink" : "border-black/10"}`}
                    style={!c.photoUrl ? { background: c.hex || "#ccc" } : undefined}
                  >
                    {c.photoUrl && <Image src={c.photoUrl} alt={c.name} fill className="object-cover" sizes="48px" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold">Select Size</p>
              <span className="text-xs text-gray-400">{product.stock > 0 ? `In stock: ${product.stock}` : isAvailable ? "In Stock" : "Out of Stock"}</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {sizes.map((s) => (
                <button key={s} onClick={() => setSize(s)} className={`px-4 h-11 rounded-full text-sm font-semibold border ${size === s ? "bg-ink text-white border-ink" : "border-ink/10"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 mt-6">
            <span className="text-sm font-semibold">Qty</span>
            <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-8 h-8 rounded-full bg-card">−</button>
            <span className="text-sm font-medium w-4 text-center">{qty}</span>
            <button onClick={() => setQty((q) => q + 1)} className="w-8 h-8 rounded-full bg-card">+</button>
          </div>

          <div className="hidden md:grid grid-cols-2 gap-3 mt-8 max-w-md">
            <button onClick={() => handleAdd(false)} disabled={!isAvailable} className="border border-ink font-semibold py-3.5 rounded-full text-sm disabled:opacity-40 disabled:cursor-not-allowed">Add to Bag</button>
            <button onClick={() => handleAdd(true)} disabled={!isAvailable} className="bg-ink text-white font-semibold py-3.5 rounded-full text-sm disabled:opacity-40 disabled:cursor-not-allowed">{isAvailable ? "Buy Now" : "Out of Stock"}</button>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 md:px-6 mt-10">
          <h3 className="text-lg font-bold mb-3">You Might Also Like</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 md:px-6 mt-10">
        <ProductReviews productId={product.id} />
      </div>

      <div className="md:hidden fixed bottom-4 left-4 right-4 z-30 bg-card border border-black/5 rounded-2xl shadow-dock px-4 py-3 flex gap-3">
        <button onClick={() => handleAdd(false)} disabled={!isAvailable} className="flex-1 border border-ink font-semibold py-3 rounded-full text-sm disabled:opacity-40">Add to Bag</button>
        <button onClick={() => handleAdd(true)} disabled={!isAvailable} className="flex-1 bg-ink text-white font-semibold py-3 rounded-full text-sm disabled:opacity-40">{isAvailable ? "Buy Now" : "Out of Stock"}</button>
      </div>
    </div>
  );
}
