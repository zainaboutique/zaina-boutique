"use client";

import Image from "@/components/OptimizedImage";
import Link from "next/link";
import { Instagram, Facebook, MessageCircle } from "lucide-react";
import { getLogoFontClassName } from "@/lib/logo-fonts";
import type { Settings } from "@/lib/types";

// A social link only counts once it points at a real profile — a bare
// "https://instagram.com" is just a placeholder and would send visitors to
// the wrong place.
function isRealProfileLink(url: string | undefined): url is string {
  if (!url) return false;
  return !/^https?:\/\/(www\.)?(instagram|facebook)\.com\/?$/i.test(url.trim());
}

export default function Footer({ settings }: { settings: Settings }) {
  const year = new Date().getFullYear();
  const logoFontClass = settings.logoFontFamily !== "custom" ? getLogoFontClassName(settings.logoFontFamily) : "";
  const logoFontStyle =
    settings.logoFontFamily === "custom" && settings.customFontName
      ? { fontFamily: `'${settings.customFontName}', sans-serif` }
      : undefined;

  // Only list payment methods the store has actually switched on in
  // Admin → Settings, so the footer never claims something that isn't true.
  const payments = settings.payments;
  const acceptedPayments = Array.from(
    new Set([
      ...(payments?.codEnabled ? ["Cash on Delivery"] : []),
      ...(payments?.whatsappOrderEnabled || payments?.razorpayEnabled ? ["UPI"] : []),
      ...(payments?.razorpayEnabled ? ["Cards", "Razorpay"] : []),
    ])
  );

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
              {isRealProfileLink(settings.socialLinks?.instagram) && (
                <a href={settings.socialLinks!.instagram} target="_blank" rel="noopener noreferrer" aria-label="Zaina Boutique on Instagram" className="w-8 h-8 rounded-lg border border-white/15 flex items-center justify-center hover:bg-white/10">
                  <Instagram size={14} />
                </a>
              )}
              {isRealProfileLink(settings.socialLinks?.facebook) && (
                <a href={settings.socialLinks!.facebook} target="_blank" rel="noopener noreferrer" aria-label="Zaina Boutique on Facebook" className="w-8 h-8 rounded-lg border border-white/15 flex items-center justify-center hover:bg-white/10">
                  <Facebook size={14} />
                </a>
              )}
              {settings.whatsappNumber && (
                <a href={`https://wa.me/${settings.whatsappNumber}`} target="_blank" rel="noopener noreferrer" aria-label="Chat with Zaina Boutique on WhatsApp" className="w-8 h-8 rounded-lg border border-white/15 flex items-center justify-center hover:bg-white/10">
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

        {/* The newsletter sign-up form is hidden for now: its button didn't
            save anything, so visitors would have believed they'd subscribed
            when they hadn't. Bring it back once it stores the emails. */}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-8 pt-6 border-t border-white/10 text-xs text-white/50">
          <span>© {year} {settings.siteName || "Zaina Boutique"}. All rights reserved.</span>
          {acceptedPayments.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="uppercase tracking-wide mr-1">We Accept</span>
              {acceptedPayments.map((p) => (
                <span key={p} className="border border-white/15 rounded px-2 py-1">{p}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
