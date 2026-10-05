/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true, // Vercel's image processing is off; wsrv.nl serves the photos
    remotePatterns: [
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "wsrv.nl" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },

  // Redirects from the old site's URLs, built from actual Google Search
  // Console export data (not guessed) — see REDIRECTS.md for exactly which
  // export rows justify each rule below, and how to extend this list if
  // more old URLs turn up after launch. All are permanent (301) redirects,
  // which is what tells Google "this content moved here for good" rather
  // than creating a duplicate-content situation between old and new URLs.
  async redirects() {
    return [
      // ---------- Exact static-page renames (old path differs from new) ----------
      { source: "/faqs", destination: "/faq", permanent: true },
      { source: "/stores", destination: "/store-locator", permanent: true },
      { source: "/index", destination: "/", permanent: true },
      { source: "/cookies", destination: "/privacy", permanent: true }, // no separate cookie policy on the new site — folded into Privacy Policy
      { source: "/gift-cards", destination: "/shop", permanent: true }, // gift cards aren't a feature on the new site
      { source: "/press", destination: "/about", permanent: true },

      // ---------- Legacy WordPress/WooCommerce structure (/index.php/...) ----------
      // WordPress's own links to individual products always had a trailing
      // slash (e.g. /index.php/product/some-saree/) — matched explicitly
      // here rather than relying on Next.js to normalize it away, so there's
      // no ambiguity either way.
      { source: "/index.php/product/:slug", destination: "/product/:slug", permanent: true },
      { source: "/index.php/product/:slug/", destination: "/product/:slug", permanent: true },
      { source: "/index.php/product-category/:path*", destination: "/shop", permanent: true },
      { source: "/index.php/product-tag/:path*", destination: "/shop", permanent: true },
      { source: "/index.php/products", destination: "/shop", permanent: true },
      { source: "/index.php/products/:path*", destination: "/shop", permanent: true },
      { source: "/index.php/refund_returns", destination: "/returns", permanent: true },
      { source: "/index.php/2023/:path*", destination: "/", permanent: true },
      { source: "/index.php", destination: "/", permanent: true },

      // ---------- Category browsing (old /collection/group/sub -> new /shop?category=) ----------
      // The shop filter matches the exact capitalised names (Women / Men /
      // Kids), so these three explicit rules come FIRST and send the
      // correctly-capitalised value. Next.js uses the first rule that
      // matches, so the generic rule below only catches any other group.
      // :sub* is an OPTIONAL catch-all, so each rule covers both
      // /collection/women and /collection/women/sarees — subcategory
      // specificity is dropped (the new site filters by top-level category
      // only); the visitor still lands on a real, relevant page rather than
      // a dead end.
      { source: "/collection/women/:sub*", destination: "/shop?category=Women", permanent: true },
      { source: "/collection/men/:sub*", destination: "/shop?category=Men", permanent: true },
      { source: "/collection/kids/:sub*", destination: "/shop?category=Kids", permanent: true },
      { source: "/collection/:group/:sub*", destination: "/shop?category=:group", permanent: true },

      // ---------- Other old sections with no direct equivalent ----------
      { source: "/designers/:path*", destination: "/shop", permanent: true },
      { source: "/auth/:path*", destination: "/account", permanent: true },
      // :path+ (one-or-more) here, not :path* — a zero-or-more catch-all
      // would also match the bare "/account" itself and redirect it to
      // itself in an infinite loop, since the new site already serves that
      // path directly.
      { source: "/account/:path+", destination: "/account", permanent: true },

      // Old site's site-search page -> new site's shop page, which has its
      // own search box; the "?q=..." query string is preserved automatically.
      { source: "/search", destination: "/shop", permanent: true },
    ];
  },
};

module.exports = nextConfig;
