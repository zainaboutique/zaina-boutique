"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "@/components/OptimizedImage";
import { Star } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, isFirebaseConfigured } from "@/lib/firebase";
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

// Optional photo added by the store with a happy-customer review.
function reviewPhoto(r: Review): string | undefined {
  return (r as unknown as { photoUrl?: string }).photoUrl;
}

export default function ProductReviews({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  // Only signed-in customers can post a review.
  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setSignedIn(true);
      setAuthReady(true);
      return;
    }
    const unsub = onAuthStateChanged(auth, (u) => {
      setSignedIn(Boolean(u));
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

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
    setSubmitError("");
    setSubmitting(true);
    try {
      await addReview({ productId, name, rating, text, createdAt: Date.now() });
      setName("");
      setRating(5);
      setText("");
      setFormOpen(false);
      setJustSubmitted(true);
      await refresh();
    } catch (err) {
      console.error("Review failed:", err);
      setSubmitError("Sorry, we couldn't submit your review. Please make sure you're signed in and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="border-t border-black/5 pt-6 pb-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold">Customer Reviews</h2>
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
          {reviews.map((r) => {
            const photo = reviewPhoto(r);
            return (
              <div key={r.id} className="py-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold">{r.name}</span>
                  <StarRow rating={r.rating} />
                </div>
                <p className="text-xs text-gray-500">{r.text}</p>
                {photo && (
                  <div className="relative w-28 h-28 rounded-xl overflow-hidden mt-2 bg-bg">
                    <Image src={photo} alt={`Photo from ${r.name}`} fill className="object-cover" sizes="112px" />
                  </div>
                )}
              </div>
            );
          })}
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
            aria-label="Rating"
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
          {submitError && <p className="text-xs text-accent">{submitError}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={() => setFormOpen(false)} className="flex-1 bg-bg font-semibold py-2.5 rounded-full text-sm">Cancel</button>
            <button type="submit" disabled={submitting} className="flex-1 bg-ink text-white font-semibold py-2.5 rounded-full text-sm disabled:opacity-50">
              {submitting ? "Submitting..." : "Submit Review"}
            </button>
          </div>
        </form>
      ) : authReady && !signedIn ? (
        <p className="mt-3 text-sm">
          <Link href="/account" className="font-semibold underline">Sign in</Link> to write a review.
        </p>
      ) : (
        <button onClick={() => setFormOpen(true)} className="mt-3 text-sm font-semibold underline">
          Write a Review
        </button>
      )}
    </div>
  );
}
