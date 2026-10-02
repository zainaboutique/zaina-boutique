"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";
import BottomNav from "./BottomNav";
import CartDrawer from "./CartDrawer";
import WhatsAppButton from "./WhatsAppButton";
import { getSettings } from "@/lib/data";
import { demoSettings } from "@/lib/demo-data";
import { getFontOption } from "@/lib/fonts";
import type { Settings } from "@/lib/types";

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");

  // Seeded with the shipped defaults so there's no flash of missing chrome;
  // replaced as soon as the real (possibly admin-edited) settings load.
  // This runs client-side deliberately — it's what lets Settings changes
  // saved in demo mode (localStorage) or Firestore actually show up here.
  const [settings, setSettings] = useState<Settings>(demoSettings);

  useEffect(() => {
    let cancelled = false;
    getSettings().then((s) => {
      if (!cancelled) setSettings(s);
    });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  useEffect(() => {
    document.documentElement.style.setProperty("--brand-ink", settings.primaryColor);
    document.documentElement.style.setProperty("--brand-accent", settings.accentColor);

    // Website-wide font: still applied via a CSS variable, since <body>'s
    // class is fixed at server-render time and this is the mechanism that
    // lets a client-side admin setting retarget it afterward.
    const siteFont = getFontOption(settings.fontFamily);
    document.documentElement.style.setProperty("--brand-font", `var(${siteFont.cssVar})`);

    // Logo text font: the six built-in options are now applied directly via
    // class name in Header/Footer (more reliable than a CSS variable
    // referencing another CSS variable). This effect only needs to handle
    // loading an uploaded custom font file into the browser, if either
    // font setting uses it — Header/Footer apply the resulting font-family
    // themselves once it's loaded.
    const needsCustomFont =
      (settings.fontFamily === "custom" || settings.logoFontFamily === "custom") && settings.customFontUrl;
    if (needsCustomFont) {
      const family = settings.customFontName || "ZainaCustomFont";
      const face = new FontFace(family, `url(${settings.customFontUrl})`);
      face
        .load()
        .then((loaded) => {
          document.fonts.add(loaded);
          if (settings.fontFamily === "custom") {
            document.documentElement.style.setProperty("--brand-font", `'${family}', sans-serif`);
          }
        })
        .catch(() => {
          // Bad/unsupported font file — silently keep whatever was already applied.
        });
    }
  }, [
    settings.primaryColor,
    settings.accentColor,
    settings.fontFamily,
    settings.logoFontFamily,
    settings.customFontUrl,
    settings.customFontName,
  ]);

  if (isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <>
      <Header settings={settings} />
      {children}
      <Footer settings={settings} />
      <BottomNav />
      <CartDrawer />
      <WhatsAppButton settings={settings} />
    </>
  );
}
