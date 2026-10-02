"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Home, Menu, User, ShoppingBag, X, ChevronDown } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { useScrollLock } from "@/lib/use-scroll-lock";
import { getCategories } from "@/lib/data";
import type { Category } from "@/lib/types";

const SHOP_GROUPS = ["New Arrival", "Women", "Men", "Kids"] as const;

function shopGroupHref(group: string): string {
  if (group === "New Arrival") return `/shop?category=${encodeURIComponent(group)}`;
  return `/shop/${group.toLowerCase()}`;
}

export default function BottomNav() {
  const router = useRouter();
  const totalItems = useCartStore((s) => s.totalItems());
  const openCart = useCartStore((s) => s.open);
  const [menuOpen, setMenuOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  useScrollLock(menuOpen);

  useEffect(() => {
    getCategories().then(setCategories);
  }, []);

  return (
    <>
      <nav className="fixed bottom-4 left-0 right-0 z-40 flex justify-center px-4 md:hidden">
        <div className="flex items-center gap-1 bg-ink text-white rounded-full shadow-dock px-2 py-2">
          <button onClick={() => router.push("/shop")} aria-label="Search" className="w-11 h-11 rounded-full flex items-center justify-center hover:bg-white/10">
            <Search size={18} />
          </button>
          <button onClick={() => router.push("/")} aria-label="Home" className="w-11 h-11 rounded-full flex items-center justify-center hover:bg-white/10">
            <Home size={18} />
          </button>
          <button onClick={() => setMenuOpen(true)} aria-label="Menu" className="w-11 h-11 rounded-full flex items-center justify-center hover:bg-white/10">
            <Menu size={18} />
          </button>
          <button onClick={() => router.push("/account")} aria-label="Account" className="w-11 h-11 rounded-full flex items-center justify-center hover:bg-white/10">
            <User size={18} />
          </button>
          <button onClick={openCart} aria-label="Cart" className="relative w-11 h-11 rounded-full bg-accent flex items-center justify-center">
            <ShoppingBag size={18} />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-white text-ink text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setMenuOpen(false)} />
          <div className="relative w-72 max-w-[80%] h-screen bg-card p-5 space-y-1.5 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <span className="font-black tracking-[0.15em] uppercase text-sm">Zaina Boutique</span>
              <button onClick={() => setMenuOpen(false)}><X size={20} /></button>
            </div>
            <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Shop by Category</p>
            {SHOP_GROUPS.map((g) => {
              const subCategories = categories.filter((c) => c.parent === g);
              const isExpanded = expandedGroup === g;
              return (
                <div key={g} className="mb-1.5">
                  <div className="flex items-stretch gap-1 bg-bg rounded-xl overflow-hidden">
                    <Link href={shopGroupHref(g)} onClick={() => setMenuOpen(false)} className="flex-1 px-4 py-3 text-sm font-medium">
                      {g}
                    </Link>
                    {subCategories.length > 0 && (
                      <button onClick={() => setExpandedGroup(isExpanded ? null : g)} aria-label={`Show ${g} categories`} className="px-3">
                        <ChevronDown size={16} className={`transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                      </button>
                    )}
                  </div>
                  {isExpanded && (
                    <div className="pl-3 mt-1 space-y-1">
                      {subCategories.map((c) => (
                        <Link
                          key={c.id}
                          href={`/shop?category=${encodeURIComponent(g)}&type=${encodeURIComponent(c.name)}`}
                          onClick={() => setMenuOpen(false)}
                          className="block px-4 py-2.5 rounded-xl text-sm text-gray-600 bg-bg/60"
                        >
                          {c.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            <div className="border-t border-black/5 mt-3 pt-3 space-y-1.5">
              <Link href="/account" onClick={() => setMenuOpen(false)} className="block px-4 py-3 rounded-xl text-sm font-medium bg-bg">
                My Account
              </Link>
              <Link href="/track" onClick={() => setMenuOpen(false)} className="block px-4 py-3 rounded-xl text-sm font-medium bg-bg">
                Track Your Order
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
