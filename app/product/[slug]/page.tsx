import type { Metadata } from "next";
import { cache } from "react";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { getProductBySlug, getRelatedProducts, getReviews } from "@/lib/data";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import type { Product } from "@/lib/types";
import ProductDetailClient from "./ProductDetailClient";

// Rebuild each product page in the background at most once a minute, so a
// changed price or stock status shows up quickly without a redeploy, while
// the database isn't read on every single visit.
export const revalidate = 60;

// Next.js 16 (like 15 before it) passes `params` as a Promise — it must be
// awaited before its fields can be read, in both generateMetadata and the
// page component below.
type ParamsPromise = Promise<{ slug: string }>;

// Plain JSON copy, so nothing database-specific is passed to the browser part.
function toPlain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

// The page title and the page itself both need the product — look it up once
// per visit instead of twice.
const getProduct = cache((slug: string) => getProductBySlug(slug));

// Candidates for "You Might Also Like": a few products from the same category
// and the same audience (two small queries, run together) instead of reading
// the entire catalogue.
async function getRelatedCandidates(product: Product): Promise<Product[]> {
  if (!isFirebaseConfigured || !db) return [];
  try {
    const firestore = db;
    const firstCategory = product.categories?.[0];
    const [byCategory, byAudience] = await Promise.all([
      firstCategory
        ? getDocs(query(collection(firestore, "products"), where("categories", "array-contains", firstCategory), limit(9)))
        : Promise.resolve(null),
      getDocs(query(collection(firestore, "products"), where("audience", "==", product.audience), limit(9))),
    ]);
    const found = new Map<string, Product>();
    for (const snap of [byCategory, byAudience]) {
      if (!snap) continue;
      for (const d of snap.docs) {
        if (!found.has(d.id)) found.set(d.id, { id: d.id, ...(d.data() as Omit<Product, "id">) });
      }
    }
    return Array.from(found.values());
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: ParamsPromise }): Promise<Metadata> {
  const { slug } = await params;
  // Works fully once Firebase is connected. In demo mode (browser localStorage
  // only), this server-side lookup can't see products you've added locally —
  // that product still renders fine on the page itself, just with generic
  // fallback metadata until Firebase is connected.
  const product = await getProduct(slug);
  if (!product) return { title: "Product" };

  const image = product.images?.[0] || product.imageUrl;
  const plainDescription = product.description.replace(/\s+/g, " ").trim();
  const shortDescription = plainDescription.length > 155 ? plainDescription.slice(0, 155).trim() + "..." : plainDescription;

  return {
    title: product.title,
    description: shortDescription,
    alternates: { canonical: `/product/${slug}` },
    openGraph: {
      type: "website",
      title: product.title,
      description: shortDescription,
      images: [{ url: image, width: 1200, height: 1200, alt: product.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: product.title,
      description: shortDescription,
      images: [image],
    },
  };
}

export default async function ProductPage({ params }: { params: ParamsPromise }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  // Not found on the server: the browser part tries once more and shows
  // "Product not found" if it really doesn't exist.
  if (!product) return <ProductDetailClient slug={slug} />;

  // Reviews and related products are fetched at the same time, so the page
  // arrives complete without waiting for one after the other.
  const [reviews, relatedCandidates] = await Promise.all([
    getReviews(product.id),
    getRelatedCandidates(product),
  ]);
  const related = getRelatedProducts(relatedCandidates, product);

  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const productJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    image: product.images?.length ? product.images : [product.imageUrl],
    sku: product.id,
    ...(product.designer ? { brand: { "@type": "Brand", name: product.designer } } : {}),
    offers: {
      "@type": "Offer",
      url: `${base}/product/${slug}`,
      priceCurrency: "INR",
      price: product.price,
      availability:
        (product.inStock ?? product.stock > 0) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  // Never fabricate a rating — only include this when there's at least one
  // real, admin-approved review, matching Google's structured data policy.
  if (reviews.length > 0) {
    const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    productJsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: avg.toFixed(1),
      reviewCount: reviews.length,
    };
  }

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: base },
      { "@type": "ListItem", position: 2, name: "Shop", item: `${base}/shop` },
      { "@type": "ListItem", position: 3, name: product.title, item: `${base}/product/${slug}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <ProductDetailClient key={slug} slug={slug} initialProduct={toPlain(product)} initialRelated={toPlain(related)} />
    </>
  );
}
