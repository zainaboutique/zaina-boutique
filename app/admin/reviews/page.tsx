"use client";

import { useEffect, useState } from "react";
import { Check, X, Trash2, Star } from "lucide-react";
import { getAllReviewsForAdmin, setReviewApproval, deleteReview, getProducts } from "@/lib/data";
import type { Review, Product } from "@/lib/types";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "approved" | "all">("pending");

  async function refresh() {
    setLoading(true);
    const [r, p] = await Promise.all([getAllReviewsForAdmin(), getProducts()]);
    setReviews(r);
    setProducts(p);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function approve(id: string) {
    await setReviewApproval(id, true);
    await refresh();
  }
  async function reject(id: string) {
    await setReviewApproval(id, false);
    await refresh();
  }
  async function remove(id: string) {
    await deleteReview(id);
    await refresh();
  }

  const filtered = reviews.filter((r) => (filter === "pending" ? !r.approved : filter === "approved" ? r.approved : true));
  const pendingCount = reviews.filter((r) => !r.approved).length;

  return (
    <div>
      <h1 className="text-2xl font-bold">Reviews</h1>
      <p className="text-sm text-gray-400 mt-1">Approve customer reviews before they appear publicly on product pages and the homepage.</p>

      <div className="flex gap-2 mt-6">
        {(["pending", "approved", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-medium capitalize ${filter === f ? "bg-ink text-white" : "bg-white shadow-card"}`}
          >
            {f} {f === "pending" && pendingCount > 0 ? `(${pendingCount})` : ""}
          </button>
        ))}
      </div>

      <div className="space-y-3 mt-4">
        {loading ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-400">No reviews here.</p>
        ) : (
          filtered.map((r) => {
            const product = products.find((p) => p.id === r.productId);
            return (
              <div key={r.id} className="bg-white rounded-2xl shadow-card p-4">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <p className="font-semibold text-sm">{r.name}</p>
                    <p className="text-xs text-gray-400">{product ? `on ${product.title}` : "Product removed"}</p>
                  </div>
                  <div className="flex text-yellow-400">
                    {[1, 2, 3, 4, 5].map((n) => <Star key={n} size={14} fill={n <= r.rating ? "currentColor" : "none"} />)}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-2">{r.text}</p>
                <div className="flex items-center gap-2 mt-3">
                  {!r.approved ? (
                    <button onClick={() => approve(r.id)} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-green-50 text-green-700">
                      <Check size={13} /> Approve
                    </button>
                  ) : (
                    <button onClick={() => reject(r.id)} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-100 text-gray-600">
                      <X size={13} /> Unapprove
                    </button>
                  )}
                  <button onClick={() => remove(r.id)} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-red-50 text-accent">
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
