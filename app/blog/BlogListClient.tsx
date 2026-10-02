"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "@/components/OptimizedImage";
import { getBlogPosts } from "@/lib/data";
import type { BlogPost } from "@/lib/types";

export default function BlogListClient() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBlogPosts().then((p) => {
      setPosts(p);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-gray-400">Loading...</div>;
  }

  if (posts.length === 0) {
    return (
      <div className="min-h-screen bg-bg pb-8">
        <div className="max-w-6xl mx-auto px-4 pt-10 text-center">
          <h1 className="text-2xl font-bold mb-2">Journal</h1>
          <p className="text-sm text-gray-400">No posts yet — check back soon.</p>
        </div>
      </div>
    );
  }

  const [hero, ...rest] = posts;

  return (
    <div className="min-h-screen bg-bg pb-8">
      <div className="max-w-6xl mx-auto px-4 pt-10">
        <h1 className="text-2xl font-bold mb-6">Journal</h1>

        <Link href={`/blog/${hero.slug}`} className="block bg-card rounded-3xl shadow-card overflow-hidden mb-8 group">
          <div className="relative aspect-[16/9] md:aspect-[21/9] w-full">
            <Image src={hero.coverImage} alt={hero.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="100vw" priority />
          </div>
          <div className="p-5">
            <p className="text-xs text-gray-400 mb-1">{hero.author} · {new Date(hero.createdAt).toLocaleDateString()}</p>
            <h2 className="text-xl font-bold mb-1">{hero.title}</h2>
            <p className="text-sm text-gray-500">{hero.excerpt}</p>
          </div>
        </Link>

        {rest.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {rest.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="bg-card rounded-2xl shadow-card overflow-hidden group">
                <div className="relative aspect-[4/3] w-full">
                  <Image src={post.coverImage} alt={post.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width: 768px) 100vw, 33vw" />
                </div>
                <div className="p-4">
                  <p className="text-xs text-gray-400 mb-1">{post.author} · {new Date(post.createdAt).toLocaleDateString()}</p>
                  <h3 className="font-semibold leading-snug mb-1">{post.title}</h3>
                  <p className="text-xs text-gray-500 line-clamp-2">{post.excerpt}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
