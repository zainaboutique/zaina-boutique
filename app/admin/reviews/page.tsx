"use client";

import { useEffect, useState } from "react";
import Image from "@/components/OptimizedImage";
import { Check, X, Trash2, Star, Plus, Upload } from "lucide-react";
import { addDoc, collection } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage, isFirebaseConfigured } from "@/lib/firebase";
import { getAllReviewsForAdmin, setReviewApproval, deleteReview, getProducts } from "@/lib/data";
import type { Review, Product } from "@/lib/types";

function reviewPhoto(r: Review): string | undefined {
  return (r as unknown as { photoUrl?: string }).photoUrl;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "approved" | "all">("pending");

  // "Add happy customer" form
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [pickedProduct, setPickedProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

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

  // Each action updates just that review in the list — no full reload.
  async function approve(id: string) {
    await setReviewApproval(id, true);
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, approved: true } : r)));
  }
  async function reject(id: string) {
    await setReviewApproval(id, false);
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, approved: false } : r)));
  }
  async function remove(id: string) {
    if (!window.confirm("Delete this review? This can't be undone.")) return;
    await deleteReview(id);
    setReviews((prev) => prev.filter((r) => r.id !== id));
  }

  function choosePhoto(file: File | undefined) {
    setFormError("");
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setFormError("Please choose an image file (JPG, PNG or WebP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFormError("That photo is over 5 MB. Please choose a smaller one.");
      return;
    }
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function resetForm() {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setName("");
    setRating(5);
    setText("");
    setPhotoFile(null);
    setPhotoPreview("");
    setProductSearch("");
    setPickedProduct(null);
    setFormError("");
  }

  async function handleAddReview(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!isFirebaseConfigured || !db) {
      setFormError("Firebase isn't connected, so reviews can't be saved.");
      return;
    }
    if (!name.trim() || !text.trim()) {
      setFormError("Please enter the customer's name and their message.");
      return;
    }
    setSaving(true);
    try {
      let photoUrl: string | undefined;
      if (photoFile) {
        if (!storage) throw new Error("Photo storage isn't available.");
        const safeName = photoFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const fileRef = ref(storage, `reviews/${Date.now()}-${safeName}`);
        await uploadBytes(fileRef, photoFile);
        photoUrl = await getDownloadURL(fileRef);
      }
      const data = {
        productId: pickedProduct?.id ?? "", // empty = a general customer story for the homepage
        name: name.trim(),
        rating,
        text: text.trim(),
        approved: true, // posted by you, so it's live straight away
        createdAt: Date.now(),
        addedByAdmin: true,
        ...(photoUrl ? { photoUrl } : {}),
      };
      const docRef = await addDoc(collection(db, "reviews"), data);
      setReviews((prev) => [{ id: docRef.id, ...data } as Review, ...prev]);
      resetForm();
      setShowForm(false);
      setFilter("approved");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Couldn't save the review. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const filtered = reviews.filter((r) => (filter === "pending" ? !r.approved : filter === "approved" ? r.approved : true));
  const pendingCount = reviews.filter((r) => !r.approved).length;

  const term = productSearch.trim().toLowerCase();
  const productMatches = term && !pickedProduct ? products.filter((p) => p.title.toLowerCase().includes(term)).slice(0, 6) : [];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Reviews</h1>
          <p className="text-sm text-gray-400 mt-1">Approve customer reviews before they appear publicly, or post a happy customer yourself.</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 bg-ink text-white text-sm font-semibold px-4 py-2.5 rounded-full"
        >
          <Plus size={16} /> Add happy customer
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAddReview} className="bg-white rounded-2xl shadow-card p-5 mt-4 space-y-3 max-w-xl">
          <p className="text-xs text-gray-400">
            Only post real customers, with their permission. These reviews go live straight away and count toward your star rating.
          </p>
          <input
            required
            placeholder="Customer name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-bg rounded-2xl px-4 py-3 text-sm outline-none"
          />
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium mr-1">Rating</span>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                type="button"
                key={n}
                onClick={() => setRating(n)}
                aria-label={`${n} star${n === 1 ? "" : "s"}`}
                className="text-yellow-400"
              >
                <Star size={22} fill={n <= rating ? "currentColor" : "none"} />
              </button>
            ))}
          </div>
          <textarea
            required
            placeholder="What the customer said"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            className="w-full bg-bg rounded-2xl px-4 py-3 text-sm outline-none resize-none"
          />

          <div>
            <p className="text-xs text-gray-400 mb-2">Customer photo (optional)</p>
            {photoPreview ? (
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoPreview} alt="Selected customer photo" className="w-20 h-20 rounded-xl object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    URL.revokeObjectURL(photoPreview);
                    setPhotoFile(null);
                    setPhotoPreview("");
                  }}
                  className="text-xs font-semibold text-accent"
                >
                  Remove photo
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 border border-dashed rounded-2xl py-4 text-sm cursor-pointer border-black/15 text-gray-400">
                <Upload size={16} /> Choose a photo
                <input type="file" accept="image/*" onChange={(e) => choosePhoto(e.target.files?.[0])} className="hidden" />
              </label>
            )}
          </div>

          <div>
            <p className="text-xs text-gray-400 mb-2">Show on a product (optional — leave empty for the homepage only)</p>
            {pickedProduct ? (
              <div className="flex items-center justify-between bg-bg rounded-2xl px-4 py-3 text-sm">
                <span className="font-medium">{pickedProduct.title}</span>
                <button type="button" onClick={() => setPickedProduct(null)} className="text-xs font-semibold text-accent ml-3 shrink-0">
                  Remove
                </button>
              </div>
            ) : (
              <>
                <input
                  placeholder="Type a product name to search..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full bg-bg rounded-2xl px-4 py-3 text-sm outline-none"
                />
                {productMatches.length > 0 && (
                  <div className="mt-2 bg-white border border-black/10 rounded-2xl overflow-hidden">
                    {productMatches.map((p) => (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => {
                          setPickedProduct(p);
                          setProductSearch("");
                        }}
                        className="block w-full text-left px-4 py-2.5 text-sm hover:bg-bg border-b border-black/5 last:border-0"
                      >
                        {p.title}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {formError && <p className="text-xs text-accent">{formError}</p>}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                resetForm();
                setShowForm(false);
              }}
              className="flex-1 bg-bg font-semibold py-3 rounded-full text-sm"
            >
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 bg-ink text-white font-semibold py-3 rounded-full text-sm disabled:opacity-50">
              {saving ? "Posting..." : "Post review"}
            </button>
          </div>
        </form>
      )}

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
            const photo = reviewPhoto(r);
            const addedByAdmin = (r as unknown as { addedByAdmin?: boolean }).addedByAdmin;
            return (
              <div key={r.id} className="bg-white rounded-2xl shadow-card p-4">
                <div className="flex gap-3">
                  {photo && (
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-bg">
                      <Image src={photo} alt={`Photo from ${r.name}`} fill className="object-cover" sizes="64px" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1 gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm">
                          {r.name}
                          {addedByAdmin && <span className="ml-2 text-[10px] font-semibold bg-bg px-2 py-0.5 rounded-full">Posted by you</span>}
                        </p>
                        <p className="text-xs text-gray-400">
                          {product ? `on ${product.title}` : r.productId ? "Product removed" : "Homepage (general)"}
                        </p>
                      </div>
                      <div className="flex text-yellow-400 shrink-0">
                        {[1, 2, 3, 4, 5].map((n) => <Star key={n} size={14} fill={n <= r.rating ? "currentColor" : "none"} />)}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{r.text}</p>
                  </div>
                </div>
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
