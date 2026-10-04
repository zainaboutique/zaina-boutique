"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/utils";
import Image from "@/components/OptimizedImage";
import { X, Minus, Plus, Trash2 } from "lucide-react";
import { useCartStore } from "@/store/cart";
import CheckoutModal from "./CheckoutModal";

export default function CartDrawer() {
  const { isOpen, close, items, incrementItem, decrementItem, removeItem, totalPrice } =
    useCartStore();
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex justify-end">
        <div className="absolute inset-0 bg-black/40" onClick={close} />
        <div className="relative w-full max-w-sm h-full bg-white flex flex-col shadow-2xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-black/5">
            <h2 className="font-bold text-lg">Your Bag ({items.length})</h2>
            <button onClick={close} aria-label="Close cart">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {items.length === 0 && (
              <p className="text-sm text-gray-400 text-center mt-10">Your bag is empty.</p>
            )}
            {items.map((item) => (
              <div key={item.productId + item.size + (item.color || "")} className="flex gap-3">
                <div className="relative w-16 h-20 rounded-xl overflow-hidden shrink-0">
                  <Image src={item.imageUrl} alt={item.title} fill className="object-cover" sizes="64px" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium leading-snug">{item.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {[item.size ? `Size: ${item.size}` : "", item.color ? `Color: ${item.color}` : ""].filter(Boolean).join(" · ")}
                  </p>
                  <p className="text-sm font-bold mt-1">{formatPrice(item.price)}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      onClick={() => decrementItem(item.productId, item.size, item.color)}
                      className="w-7 h-7 rounded-full bg-bg flex items-center justify-center"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                    <button
                      onClick={() => incrementItem(item.productId, item.size, item.color)}
                      className="w-7 h-7 rounded-full bg-bg flex items-center justify-center"
                    >
                      <Plus size={12} />
                    </button>
                    <button
                      onClick={() => removeItem(item.productId, item.size, item.color)}
                      className="ml-auto w-8 h-8 rounded-full bg-bg flex items-center justify-center text-accent shrink-0"
                      aria-label="Remove item"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="px-5 py-4 border-t border-black/5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">Total</span>
              <span className="font-bold text-lg">{formatPrice(totalPrice())}</span>
            </div>
            <button
              disabled={items.length === 0}
              onClick={() => setCheckoutOpen(true)}
              className="w-full bg-ink text-white font-semibold py-3.5 rounded-full disabled:opacity-40"
            >
              Checkout
            </button>
          </div>
        </div>
      </div>

      {checkoutOpen && <CheckoutModal onClose={() => setCheckoutOpen(false)} />}
    </>
  );
}
