import type { Metadata } from "next";
import { Inter, Poppins, Playfair_Display, Montserrat, Lora, Raleway } from "next/font/google";
import "./globals.css";
import SiteChrome from "@/components/SiteChrome";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import { getSettings, getBanners } from "@/lib/data";

// All curated font options load here so switching in Settings is instant
// (no extra network request) — see lib/fonts.ts for the matching CSS vars.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-poppins", display: "swap" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", display: "swap" });
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat", display: "swap" });
const lora = Lora({ subsets: ["latin"], variable: "--font-lora", display: "swap" });
const raleway = Raleway({ subsets: ["latin"], variable: "--font-raleway", display: "swap" });
const fontVariables = [inter, poppins, playfair, montserrat, lora, raleway].map((f) => f.variable).join(" ");

// Dynamic so the OG/Twitter preview image (what shows up when this site is
// shared on WhatsApp/Instagram, or used as the link preview in a Meta/Google
// ad) always matches the admin's current hero banner and branding — no code
// change needed when they update either.
export async function generateMetadata(): Promise<Metadata> {
  const [settings, banners] = await Promise.all([getSettings(), getBanners()]);
  const siteName = settings.siteName || "Zaina Boutique";
  // Deliberately NOT falling back to settings.tagline here — tagline is a
  // short, punchy line also shown visibly in the footer, and forcing it to
  // double as the SEO meta description means one of the two jobs suffers
  // (a tagline short enough to look good in the footer is usually too short
  // for an effective meta description, which reads best around 120-180
  // characters). metaDescription is a separate, dedicated field for this.
  const description =
    settings.metaDescription ||
    "Shop Zaina Boutique's luxury multi-designer collection of sarees, lehengas, kurtis, and fashion essentials — fast delivery across India, easy returns, simple order tracking.";
  const ogImage = banners[0]?.imageUrl || settings.logoUrl;

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
    title: {
      default: `${siteName} | Luxury Indian & Contemporary Fashion`,
      template: `%s | ${siteName}`,
    },
    description,
    keywords: [siteName, "Indian fashion", "sarees", "lehengas", "kurtis", "ethnic wear", "online boutique"],
    robots: { index: true, follow: true },
    // Safe to set here (rather than only per-page) because every other page
    // in this app already sets its own `alternates.canonical`, which
    // overrides this default — only the homepage (a Server Component with
    // no metadata export of its own) actually inherits "/" from here.
    alternates: { canonical: "/" },
    verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
      ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
      : undefined,
    openGraph: {
      type: "website",
      siteName,
      title: `${siteName} | Luxury Indian & Contemporary Fashion`,
      description,
      locale: "en_IN",
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630, alt: siteName }] : undefined,
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title: siteName,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  const sameAs = [settings.socialLinks?.instagram, settings.socialLinks?.facebook].filter(
    (url): url is string => Boolean(url)
  );

  const organizationJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "ClothingStore",
    name: settings.siteName || "Zaina Boutique",
    description: settings.tagline || "Luxury multi-designer destination for the finest Indian and contemporary fashion.",
    areaServed: "IN",
    priceRange: "₹₹",
    ...(settings.address ? { address: { "@type": "PostalAddress", streetAddress: settings.address, addressCountry: "IN" } } : {}),
    ...(settings.whatsappNumber ? { telephone: `+${settings.whatsappNumber}` } : {}),
    ...(settings.logoUrl ? { image: settings.logoUrl, logo: settings.logoUrl } : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body className={`${fontVariables} bg-bg text-ink antialiased font-sans`}>
        <SiteChrome>{children}</SiteChrome>
        <GoogleAnalytics />
      </body>
    </html>
  );
}
