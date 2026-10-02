"use client";

import { useEffect, useState } from "react";
import Image from "@/components/OptimizedImage";
import Link from "next/link";
import { getCategories } from "@/lib/data";
import type { Category } from "@/lib/types";

export default function CategoryBubbles() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    getCategories().then(setCategories);
  }, []);

  if (categories.length === 0) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-4">
      <div className="flex gap-4 overflow-x-auto no-scrollbar justify-start md:justify-center">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/shop?category=${encodeURIComponent(cat.parent)}&type=${encodeURIComponent(cat.name)}`}
            className="flex flex-col items-center gap-1.5 shrink-0"
          >
            <div className="w-16 h-16 rounded-full overflow-hidden shadow-card relative bg-card">
              <Image
                src={cat.imageUrl}
                alt={cat.name}
                fill
                className="object-cover"
                style={{ objectPosition: `${cat.position?.x ?? 50}% ${cat.position?.y ?? 50}%` }}
                sizes="64px"
              />
            </div>
            <span className="text-xs font-medium">{cat.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
