"use client";

import { useEffect, useState } from "react";
import Image from "@/components/OptimizedImage";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getCategories, getSettings } from "@/lib/data";
import type { Category, Settings, ShopGroup } from "@/lib/types";

const GROUPS: ShopGroup[] = ["New Arrival", "Women", "Men", "Kids"];

function shopGroupHref(group: ShopGroup): string {
  if (group === "New Arrival") return `/shop?category=${encodeURIComponent(group)}`;
  return `/shop/${group.toLowerCase()}`;
}

// The homepage's main-category row: New Arrival / Women / Men / Kids. Tapping
// one expands a panel right below the row showing that group's specific
// sub-categories (e.g. Sarees, Lehengas under Women) — tapping the group's
// name within that panel, or "Shop all", goes to the full page.
export default function CategoryBubbles() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [expandedGroup, setExpandedGroup] = useState<ShopGroup | null>(null);

  useEffect(() => {
    getCategories().then(setCategories);
    getSettings().then(setSettings);
  }, []);

  const subCategoriesFor = (group: ShopGroup) => categories.filter((c) => c.parent === group);

  return (
    <div className="max-w-6xl mx-auto px-4 py-4">
      <div className="flex gap-4 overflow-x-auto no-scrollbar justify-start md:justify-center">
        {GROUPS.map((group) => {
          const customImage = settings?.mainCategoryImages?.[group];
          const fallbackImage = subCategoriesFor(group)[0]?.imageUrl;
          const image = customImage || fallbackImage;
          const isExpanded = expandedGroup === group;
          return (
            <button
              key={group}
              onClick={() => setExpandedGroup(isExpanded ? null : group)}
              className="flex flex-col items-center gap-1.5 shrink-0"
            >
              <div className={`w-16 h-16 rounded-full overflow-hidden shadow-card relative bg-card ${isExpanded ? "ring-2 ring-ink" : ""}`}>
                {image && <Image src={image} alt={group} fill className="object-cover" sizes="64px" />}
              </div>
              <span className="text-xs font-medium">{group}</span>
            </button>
          );
        })}
      </div>

      {expandedGroup && (
        <div className="bg-card rounded-2xl shadow-card mt-3 p-2 max-w-sm mx-auto md:mx-0">
          {subCategoriesFor(expandedGroup).length === 0 ? (
            <Link
              href={shopGroupHref(expandedGroup)}
              onClick={() => setExpandedGroup(null)}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-bg"
            >
              Shop all {expandedGroup} <ChevronRight size={15} />
            </Link>
          ) : (
            <>
              {subCategoriesFor(expandedGroup).map((c) => (
                <Link
                  key={c.id}
                  href={`/shop?category=${encodeURIComponent(expandedGroup)}&type=${encodeURIComponent(c.name)}`}
                  onClick={() => setExpandedGroup(null)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm hover:bg-bg"
                >
                  {c.name} <ChevronRight size={15} className="text-gray-300" />
                </Link>
              ))}
              <Link
                href={shopGroupHref(expandedGroup)}
                onClick={() => setExpandedGroup(null)}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold border-t border-black/5 mt-1 pt-2.5"
              >
                Shop all {expandedGroup} <ChevronRight size={15} />
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
