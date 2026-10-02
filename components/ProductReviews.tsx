"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { getReviews, addReview } from "@/lib/data";
import type { Review } from "@/lib/types";

function StarRow({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5 text-yellow-400">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={size} fill={n <= Math.round(rating) ? "currentColor" : "none"} strokeWidth={1.5} />
      ))}
    </div>
  );
}

export default function ProductReviews({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);

  async function refresh() {
    setLoading(true);
    setReviews(await getReviews(productId));
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, [productId]);

  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addReview({ productId, name, rating, text, createdAt: Date.now() });
      setName("");
      setRating(5);
      setText("");
      setFormOpen(false);
      setJustSubmitted(true);
      await refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="border-t border-black/5 pt-6 pb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold">Customer Reviews</h3>
        {reviews.length > 0 && (
          <div className="flex items-center gap-1.5 text-sm font-semibold">
            <StarRow rating={avg} size={15} />
            <span>{avg.toFixed(1)} ({reviews.length})</span>
          </div>
        )}
      </div>

      {justSubmitted && (
        <p className="text-xs text-green-600 bg-green-50 rounded-xl px-3 py-2 mb-3">
          Thanks! Your review has been submitted and will appear here once approved by our team.
        </p>
      )}

      {loading ? (
        <p className="text-sm text-gray-400">Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-gray-400">No reviews yet. Be the first to review this product.</p>
      ) : (
        <div className="divide-y divide-black/5">
          {reviews.map((r) => (
            <div key={r.id} className="py-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold">{r.name}</span>
                <StarRow rating={r.rating} />
              </div>
              <p className="text-xs text-gray-500">{r.text}</p>
            </div>
          ))}
        </div>
      )}

      {formOpen ? (
        <form onSubmit={handleSubmit} className="mt-4 space-y-2 max-w-md">
          <input
            required
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-bg rounded-2xl px-4 py-2.5 text-sm outline-none"
          />
          <select
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            className="w-full bg-bg rounded-2xl px-4 py-2.5 text-sm outline-none"
          >
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>{n} Star{n > 1 ? "s" : ""}</option>
            ))}
          </select>
          <textarea
            required
            placeholder="Share your experience..."
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full bg-bg rounded-2xl px-4 py-2.5 text-sm outline-none resize-none"
          />
          <div className="flex gap-2">
            <button type="button" onClick={() => setFormOpen(false)} className="flex-1 bg-bg font-semibold py-2.5 rounded-full text-sm">Cancel</button>
            <button type="submit" disabled={submitting} className="flex-1 bg-ink text-white font-semibold py-2.5 rounded-full text-sm disabled:opacity-50">
              {submitting ? "Submitting..." : "Submit Review"}
            </button>
          </div>
        </form>
      ) : (
        <button onClick={() => setFormOpen(true)} className="mt-3 text-sm font-semibold underline">
          Write a Review
        </button>
      )}
    </div>
  );
}
