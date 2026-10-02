import type { Metadata } from "next";
import { getProductBySlug, getReviews } from "@/lib/data";
import ProductDetailClient from "./ProductDetailClient";

// Next.js 16 (like 15 before it) passes `params` as a Promise — it must be
// awaited before its fields can be read, in both generateMetadata and the
// page component below.
type ParamsPromise = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: ParamsPromise }): Promise<Metadata> {
  const { slug } = await params;
  // Works fully once Firebase is connected. In demo mode (browser localStorage
  // only), this server-side lookup can't see products you've added locally —
  // that product still renders fine on the page itself, just with generic
  // fallback metadata until Firebase is connected.
  const product = await getProductBySlug(slug);
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
  const product = await getProductBySlug(slug);
  if (!product) return <ProductDetailClient slug={slug} />;

  const reviews = await getReviews(product.id);
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
      <ProductDetailClient slug={slug} />
    </>
  );
}
