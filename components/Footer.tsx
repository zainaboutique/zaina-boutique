"use client";

import Image from "@/components/OptimizedImage";
import Link from "next/link";
import { Instagram, Facebook, MessageCircle } from "lucide-react";
import { getLogoFontClassName } from "@/lib/logo-fonts";
import type { Settings } from "@/lib/types";

export default function Footer({ settings }: { settings: Settings }) {
  const year = new Date().getFullYear();
  const logoFontClass = settings.logoFontFamily !== "custom" ? getLogoFontClassName(settings.logoFontFamily) : "";
  const logoFontStyle =
    settings.logoFontFamily === "custom" && settings.customFontName
      ? { fontFamily: `'${settings.customFontName}', sans-serif` }
      : undefined;

  return (
    <footer className="bg-ink text-white mt-8 pb-32 md:pb-12 pt-10">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid md:grid-cols-[1.3fr_1fr_1fr_1fr_1fr] gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              {settings.logoMarkUrl && (
                <Image src={settings.logoMarkUrl} alt={`${settings.siteName || "Zaina Boutique"} logo`} width={28} height={28} className="h-7 w-7 object-contain" />
              )}
              <span className={`font-medium tracking-[0.3em] uppercase text-sm ${logoFontClass}`} style={logoFontStyle}>{settings.siteName || "Zaina Boutique"}</span>
            </div>
            <p className="text-sm text-white/60 leading-relaxed max-w-xs">{settings.tagline}</p>
            {(settings.address || settings.whatsappNumber) && (
              <div className="text-xs text-white/50 mt-3 space-y-0.5">
                {settings.address && <p>{settings.address}</p>}
                {settings.whatsappNumber && <p>+{settings.whatsappNumber}</p>}
              </div>
            )}
            <div className="flex gap-2 mt-4">
              {settings.socialLinks?.instagram && (
                <a href={settings.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg border border-white/15 flex items-center justify-center hover:bg-white/10">
                  <Instagram size={14} />
                </a>
              )}
              {settings.socialLinks?.facebook && (
                <a href={settings.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg border border-white/15 flex items-center justify-center hover:bg-white/10">
                  <Facebook size={14} />
                </a>
              )}
              {settings.whatsappNumber && (
                <a href={`https://wa.me/${settings.whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg border border-white/15 flex items-center justify-center hover:bg-white/10">
                  <MessageCircle size={14} />
                </a>
              )}
            </div>
          </div>

          {settings.footerColumns.map((col) => (
            <div key={col.title}>
              <p className="text-xs uppercase tracking-wider text-white/40 mb-3">{col.title}</p>
              <ul className="space-y-2 text-sm text-white/70">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="hover:text-white">{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 max-w-sm">
          <p className="text-sm font-semibold mb-2">Join our newsletter</p>
          <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              placeholder="Your email"
              className="flex-1 bg-white/10 rounded-full px-4 py-2.5 text-sm outline-none placeholder:text-white/40"
            />
            <button className="bg-white text-ink text-sm font-semibold px-5 py-2.5 rounded-full">Join</button>
          </form>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-8 pt-6 border-t border-white/10 text-xs text-white/50">
          <span>© {year} {settings.siteName || "Zaina Boutique"}. All rights reserved.</span>
          <div className="flex items-center gap-2">
            <span className="uppercase tracking-wide mr-1">We Accept</span>
            {["Razorpay", "UPI", "WhatsApp Pay", "VISA", "MC"].map((p) => (
              <span key={p} className="border border-white/15 rounded px-2 py-1">{p}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
