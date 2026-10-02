"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "@/components/OptimizedImage";
import { Search, ShoppingBag, ChevronDown, Menu, X, User } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { getLogoFontClassName } from "@/lib/logo-fonts";
import { useScrollLock } from "@/lib/use-scroll-lock";
import type { Settings } from "@/lib/types";

const SHOP_GROUPS = ["New Arrival", "Women", "Men", "Kids"] as const;

// Women/Men/Kids get their own category-tile landing page; New Arrival stays
// a flat, smart-filtered product list since it isn't a real taxonomy with
// sub-categories the way the others are.
function shopGroupHref(group: string): string {
  if (group === "New Arrival") return `/shop?category=${encodeURIComponent(group)}`;
  return `/shop/${group.toLowerCase()}`;
}

export default function Header({ settings }: { settings: Settings }) {
  const router = useRouter();
  const totalItems = useCartStore((s) => s.totalItems());
  const logoFontClass = settings.logoFontFamily !== "custom" ? getLogoFontClassName(settings.logoFontFamily) : "";
  const logoFontStyle =
    settings.logoFontFamily === "custom" && settings.customFontName
      ? { fontFamily: `'${settings.customFontName}', sans-serif` }
      : undefined;
  const openCart = useCartStore((s) => s.open);
  const [q, setQ] = useState("");
  const [shopOpen, setShopOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  useScrollLock(mobileMenuOpen);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(`/shop${q ? `?q=${encodeURIComponent(q)}` : ""}`);
  }

  return (
    <header className="sticky top-0 z-40 bg-bg/95 backdrop-blur">
      {settings.announcementEnabled && (
        <Link
          href={settings.announcementHref || "/shop"}
          className="block bg-ink text-white text-center text-xs py-2 tracking-wide"
        >
          {settings.announcementText}
        </Link>
      )}

      <div className="flex items-center justify-between px-4 py-3 max-w-6xl mx-auto">
        <button className="md:hidden w-9 h-9 flex items-center justify-center" onClick={() => setMobileMenuOpen(true)} aria-label="Open menu">
          <Menu size={20} />
        </button>

        <Link href="/" className="flex items-center gap-2">
          {settings.logoMarkUrl && (
            <Image src={settings.logoMarkUrl} alt={`${settings.siteName || "Zaina Boutique"} logo`} width={28} height={28} className="object-contain h-7 w-7" />
          )}
          <span className={`text-lg font-medium tracking-[0.3em] uppercase ${logoFontClass}`} style={logoFontStyle}>{settings.siteName || "Zaina Boutique"}</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link href="/">Home</Link>
          <div className="relative" onMouseEnter={() => setShopOpen(true)} onMouseLeave={() => setShopOpen(false)}>
            <button className="flex items-center gap-1">
              Shop <ChevronDown size={14} />
            </button>
            {shopOpen && (
              <div className="absolute top-full left-0 bg-card shadow-card rounded-2xl p-2 min-w-[160px]">
                {SHOP_GROUPS.map((g) => (
                  <Link
                    key={g}
                    href={shopGroupHref(g)}
                    className="block px-3 py-2 rounded-xl text-sm hover:bg-bg"
                  >
                    {g}
                  </Link>
                ))}
              </div>
            )}
          </div>
          {settings.headerLinks
            .filter((l) => l.label !== "Home")
            .map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/account"
            aria-label="Account"
            className="flex w-9 h-9 rounded-full bg-card shadow-card items-center justify-center"
          >
            <User size={18} />
          </Link>
          <button
            onClick={openCart}
            aria-label="Open cart"
            className="relative w-9 h-9 rounded-full bg-card shadow-card flex items-center justify-center"
          >
            <ShoppingBag size={18} />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-accent text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>

      <form onSubmit={submitSearch} className="px-4 pb-3 max-w-6xl mx-auto">
        <div className="flex items-center gap-2 bg-card rounded-3xl shadow-card px-4 py-2.5">
          <Search size={16} className="text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search products..."
            className="w-full bg-transparent outline-none text-sm placeholder:text-gray-400"
          />
        </div>
      </form>

      {/* Mobile slide-out menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative w-72 max-w-[80%] h-full bg-card p-5 space-y-1 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <span className={`font-medium tracking-[0.3em] uppercase text-sm ${logoFontClass}`} style={logoFontStyle}>{settings.siteName || "Zaina Boutique"}</span>
              <button onClick={() => setMobileMenuOpen(false)}><X size={20} /></button>
            </div>
            <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Shop</p>
            {SHOP_GROUPS.map((g) => (
              <Link
                key={g}
                href={shopGroupHref(g)}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-3 rounded-xl text-sm font-medium bg-bg mb-1.5"
              >
                {g}
              </Link>
            ))}
            <div className="border-t border-black/5 mt-3 pt-3 space-y-1.5">
              <Link
                href="/account"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium bg-bg"
              >
                <User size={15} /> My Account
              </Link>
              {settings.headerLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 rounded-xl text-sm font-medium bg-bg"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
