"use client";

import { create } from "zustand";
import type { CartItem, Product } from "@/lib/types";

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  open: () => void;
  close: () => void;
  addItem: (product: Product, size?: string, quantity?: number, color?: string) => void;
  removeItem: (productId: string, size: string, color?: string) => void;
  incrementItem: (productId: string, size: string, color?: string) => void;
  decrementItem: (productId: string, size: string, color?: string) => void;
  clear: () => void;
  totalItems: () => number;
  totalPrice: () => number;
}

function sameLine(i: CartItem, productId: string, size: string, color?: string) {
  return i.productId === productId && i.size === size && (i.color || undefined) === (color || undefined);
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  addItem: (product, size, quantity = 1, color) =>
    set((state) => {
      const chosenSize = size || product.sizes?.[0] || "M";
      const chosenColor = color || product.colors?.[0]?.name;
      const existing = state.items.find((i) => sameLine(i, product.id, chosenSize, chosenColor));
      if (existing) {
        return {
          items: state.items.map((i) =>
            sameLine(i, product.id, chosenSize, chosenColor) ? { ...i, quantity: i.quantity + quantity } : i
          ),
          isOpen: true,
        };
      }
      return {
        items: [
          ...state.items,
          {
            productId: product.id,
            slug: product.slug,
            freeShipping: product.freeShipping,
            shippingCost: product.shippingCost,
            title: product.title,
            price: product.price,
            imageUrl: product.images?.[0] || product.imageUrl,
            size: chosenSize,
            color: chosenColor,
            quantity,
          },
        ],
        isOpen: true,
      };
    }),
  removeItem: (productId, size, color) =>
    set((state) => ({ items: state.items.filter((i) => !sameLine(i, productId, size, color)) })),
  incrementItem: (productId, size, color) =>
    set((state) => ({
      items: state.items.map((i) => (sameLine(i, productId, size, color) ? { ...i, quantity: i.quantity + 1 } : i)),
    })),
  decrementItem: (productId, size, color) =>
    set((state) => ({
      items: state.items
        .map((i) => (sameLine(i, productId, size, color) ? { ...i, quantity: i.quantity - 1 } : i))
        .filter((i) => i.quantity > 0),
    })),
  clear: () => set({ items: [] }),
  totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
  totalPrice: () => get().items.reduce((sum, i) => sum + i.quantity * i.price, 0),
}));
