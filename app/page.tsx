import Link from "next/link";
import { Star } from "lucide-react";
import Image from "@/components/OptimizedImage";
import HeroBanner from "@/components/HeroBanner";
import CategoryBubbles from "@/components/CategoryBubbles";
import ProductGrid from "@/components/ProductGrid";
import ProductCard from "@/components/ProductCard";
import { getProducts, getBanners, getNewArrivals, getApprovedReviewsSample, getCoverImage, getSettings } from "@/lib/data";
import { OCCASIONS } from "@/lib/demo-data";

// A Server Component rather than client-fetched: the homepage's real content
// (products, banners, reviews) is now present in the initial HTML, not
// something that pops in after the browser runs JavaScript. This matters for
// three concrete things an SEO/GEO audit checks: search engines and AI
// crawlers that don't fully execute JavaScript can actually see this content;
// there's no layout shift as sections pop in after a fetch completes; and the
// page has a real, crawlable amount of text content from the first response.
export default async function HomePage() {
  const [products, banners, reviews, settings] = await Promise.all([
    getProducts(),
    getBanners(),
    getApprovedReviewsSample(8),
    getSettings(),
  ]);

  const newArrivals = getNewArrivals(products, 8);
  const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  const occasionTiles = OCCASIONS.map((occasion) => {
    const match = products.find((p) => (p.occasions ?? []).includes(occasion));
    return { occasion, product: match };
  }).filter((t) => t.product);

  return (
    <div className="min-h-screen bg-bg pb-24 md:pb-0">
      <div className="pt-2">
        <HeroBanner banners={banners} />
      </div>

      <CategoryBubbles />

      <div className="max-w-6xl mx-auto px-4 pt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">New Arrivals</h2>
          <Link href="/shop?category=New%20Arrival" className="text-xs font-semibold px-2.5 py-1 rounded-full bg-accent text-white">
            View All
          </Link>
        </div>
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
          {newArrivals.map((p) => (
            <div key={p.id} className="w-44 shrink-0">
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </div>

      {occasionTiles.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 pt-10">
          <div className="text-center mb-5">
            <p className="text-xs uppercase tracking-widest text-gray-400">Dress For Every Moment</p>
            <h2 className="text-2xl font-serif mt-1">Shop By Occasion</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar justify-start md:justify-center pb-2">
            {occasionTiles.map(({ occasion, product }) => (
              <Link
                key={occasion}
                href={`/shop?occasion=${encodeURIComponent(occasion)}`}
                className="relative w-40 md:w-52 h-56 md:h-72 shrink-0 rounded-2xl overflow-hidden group"
              >
                <Image src={getCoverImage(product!)} alt={occasion} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="200px" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 p-4 text-white">
                  <p className="font-semibold">{occasion}</p>
                  <span className="text-xs">Shop Now →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 pt-10 flex items-center justify-between">
        <h2 className="text-lg font-bold">Shop the Full Collection</h2>
        <Link href="/shop" className="text-sm font-semibold underline">Shop All</Link>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-4">
        <ProductGrid products={products.slice(0, 8)} />
      </div>

      {/* Reviews */}
      <div className="max-w-6xl mx-auto px-4 pt-8">
        <div className="text-center mb-5">
          <p className="text-xs uppercase tracking-widest text-gray-400">What Our Customers Say</p>
          <h2 className="text-2xl font-serif mt-1">Loved By Thousands</h2>
          {reviews.length > 0 && (
            <div className="flex items-center justify-center gap-1.5 text-sm font-medium text-gray-500 mt-1">
              <span className="flex text-yellow-400">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} size={14} fill={n <= Math.round(avgRating) ? "currentColor" : "none"} strokeWidth={1.5} />
                ))}
              </span>
              <span>{avgRating.toFixed(1)}★ average across {reviews.length} review{reviews.length === 1 ? "" : "s"}</span>
            </div>
          )}
        </div>

        {reviews.length === 0 ? (
          <p className="text-sm text-gray-400 text-center pb-4">
            No approved reviews yet — once customers leave reviews and an admin approves them, they'll appear here.
          </p>
        ) : (
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
            {reviews.map((r) => (
              <div key={r.id} className="bg-card rounded-2xl shadow-card p-4 w-64 shrink-0">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-9 h-9 rounded-full bg-ink text-white flex items-center justify-center text-xs font-bold">
                    {r.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{r.name}</p>
                    <div className="flex gap-0.5 text-yellow-400">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star key={n} size={13} fill={n <= r.rating ? "currentColor" : "none"} strokeWidth={1.5} />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500">{r.text}</p>
                {r.productTitle && <p className="text-[11px] text-gray-400 mt-2">on {r.productTitle}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-10 pb-2">
        <p className="text-sm text-gray-500 leading-relaxed">
          {settings.siteName || "Zaina Boutique"} is a multi-designer boutique for Indian and
          contemporary fashion — sarees, lehengas, kurtis, and everyday essentials, curated for
          festive occasions and daily wear alike. Every order ships with real-time tracking, and
          new arrivals are added regularly across Women's, Men's, and Kids' collections.
        </p>
      </div>
    </div>
  );
}
