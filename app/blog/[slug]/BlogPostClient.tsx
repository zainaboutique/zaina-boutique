"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "@/components/OptimizedImage";
import { ArrowLeft } from "lucide-react";
import { getBlogPostBySlug } from "@/lib/data";
import type { BlogPost } from "@/lib/types";

export default function BlogPostClient({ slug }: { slug: string }) {
  const [post, setPost] = useState<BlogPost | null | undefined>(undefined);

  useEffect(() => {
    getBlogPostBySlug(slug).then(setPost);
  }, [slug]);

  if (post === undefined) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-gray-400">Loading...</div>;
  }

  if (post === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="font-semibold">Post not found.</p>
        <Link href="/blog" className="text-sm underline">Back to Journal</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg pb-8">
      <div className="max-w-2xl mx-auto px-4 pt-6">
        <Link href="/blog" className="flex items-center gap-1.5 text-sm text-gray-500 mb-4">
          <ArrowLeft size={15} /> Journal
        </Link>
        <div className="relative aspect-[16/9] w-full rounded-3xl overflow-hidden mb-5">
          <Image src={post.coverImage} alt={post.title} fill className="object-cover" sizes="100vw" priority />
        </div>
        <p className="text-xs text-gray-400 mb-1">{post.author} · {new Date(post.createdAt).toLocaleDateString()}</p>
        <h1 className="text-2xl font-bold mb-4">{post.title}</h1>
        <div className="prose-content text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: post.content }} />
      </div>

      <style jsx global>{`
        .prose-content h2 { font-size: 1.4rem; font-weight: 700; margin: 1.25rem 0 0.6rem; }
        .prose-content h3 { font-size: 1.15rem; font-weight: 700; margin: 1rem 0 0.5rem; }
        .prose-content p { margin: 0.6rem 0; }
        .prose-content ul { list-style: disc; padding-left: 1.5rem; margin: 0.6rem 0; }
        .prose-content ol { list-style: decimal; padding-left: 1.5rem; margin: 0.6rem 0; }
        .prose-content a { color: var(--brand-accent, #EF4444); text-decoration: underline; }
        .prose-content img { border-radius: 0.75rem; max-width: 100%; height: auto; }
      `}</style>
    </div>
  );
}
