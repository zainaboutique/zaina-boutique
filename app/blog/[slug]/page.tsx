import type { Metadata } from "next";
import { getBlogPostBySlug } from "@/lib/data";
import BlogPostClient from "./BlogPostClient";

type ParamsPromise = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: ParamsPromise }): Promise<Metadata> {
  const { slug } = await params;
  // Works fully once Firebase is connected. In demo mode (browser local
  // storage only), this server-side lookup can't see posts written locally
  // — the post still renders fine on the page itself (BlogPostClient fetches
  // client-side), just with generic fallback metadata until Firebase is connected.
  const post = await getBlogPostBySlug(slug);
  if (!post) return { title: "Journal" };

  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      images: [{ url: post.coverImage, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: [post.coverImage],
    },
  };
}

export default async function BlogPostPage({ params }: { params: ParamsPromise }) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const jsonLd = post
    ? {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: post.title,
        description: post.excerpt,
        image: post.coverImage,
        author: { "@type": "Organization", name: post.author },
        datePublished: new Date(post.createdAt).toISOString(),
        dateModified: new Date(post.updatedAt).toISOString(),
        mainEntityOfPage: `${base}/blog/${slug}`,
      }
    : null;

  return (
    <>
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}
      <BlogPostClient slug={slug} />
    </>
  );
}
