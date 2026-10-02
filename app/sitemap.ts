import type { MetadataRoute } from "next";
import { getProducts, getBlogPosts } from "@/lib/data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const [products, blogPosts] = await Promise.all([getProducts(), getBlogPosts()]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/shop`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/shop/women`, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/shop/men`, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/shop/kids`, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/blog`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/contact`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/faq`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/shipping`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/returns`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/size-guide`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/payment-options`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/store-locator`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/track`, changeFrequency: "monthly", priority: 0.3 },
    // /account is intentionally excluded — it's marked noindex (see its metadata)
  ];

  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${base}/product/${p.slug}`,
    lastModified: p.createdAt ? new Date(p.createdAt) : undefined,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const blogRoutes: MetadataRoute.Sitemap = blogPosts.map((p) => ({
    url: `${base}/blog/${p.slug}`,
    lastModified: new Date(p.updatedAt),
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [...staticRoutes, ...productRoutes, ...blogRoutes];
}
