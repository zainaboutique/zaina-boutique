"use client";

import { useEffect, useState } from "react";
import Image from "@/components/OptimizedImage";
import { Plus, Pencil, Trash2, X, GripVertical } from "lucide-react";
import { getBanners, saveBanner, deleteBanner, reorderBanners } from "@/lib/data";
import { storage, isFirebaseConfigured } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { fileToDataUrl } from "@/lib/utils";
import FocalPointPicker from "@/components/FocalPointPicker";
import type { HeroBanner, ImagePosition } from "@/lib/types";

const emptyForm = {
  imageUrl: "",
  headline: "",
  subtext: "",
  ctaLabel: "Shop Now",
  ctaHref: "/shop",
  desktopPosition: { x: 50, y: 50 } as ImagePosition,
  mobilePosition: { x: 50, y: 50 } as ImagePosition,
};

export default function AdminBannerPage() {
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HeroBanner | null>(null);

  async function refresh() {
    setLoading(true);
    setBanners(await getBanners());
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(b: HeroBanner) {
    setEditingId(b.id);
    setForm({
      imageUrl: b.imageUrl,
      headline: b.headline,
      subtext: b.subtext,
      ctaLabel: b.ctaLabel,
      ctaHref: b.ctaHref,
      desktopPosition: b.desktopPosition || { x: 50, y: 50 },
      mobilePosition: b.mobilePosition || { x: 50, y: 50 },
    });
    setModalOpen(true);
  }

  async function handleImageUpload(file: File) {
    setUploading(true);
    try {
      let url: string;
      if (isFirebaseConfigured && storage) {
        const fileRef = ref(storage, `banners/${Date.now()}-${file.name}`);
        await uploadBytes(fileRef, file);
        url = await getDownloadURL(fileRef);
      } else {
        url = await fileToDataUrl(file);
      }
      setForm((f) => ({ ...f, imageUrl: url }));
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const id = editingId || `b${Date.now()}`;
      const order = editingId ? banners.find((b) => b.id === editingId)?.order ?? 0 : banners.length;
      await saveBanner({
        id,
        imageUrl: form.imageUrl || "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1200&q=80",
        headline: form.headline,
        subtext: form.subtext,
        ctaLabel: form.ctaLabel,
        ctaHref: form.ctaHref,
        order,
        desktopPosition: form.desktopPosition,
        mobilePosition: form.mobilePosition,
      });
      setModalOpen(false);
      await refresh();
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    await deleteBanner(deleteTarget.id);
    setDeleteTarget(null);
    await refresh();
  }

  function onDrop(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) return;
    const reordered = [...banners];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(targetIndex, 0, moved);
    setBanners(reordered);
    setDragIndex(null);
    reorderBanners(reordered.map((b) => b.id));
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Hero Banners</h1>
          <p className="text-sm text-gray-400 mt-1">Add multiple banners and drag to reorder how they appear in the carousel.</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-1.5 bg-ink text-white text-sm font-semibold px-4 py-2.5 rounded-full">
          <Plus size={16} /> Add Banner
        </button>
      </div>

      <div className="space-y-3 mt-6">
        {loading ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : (
          banners.map((b, i) => (
            <div
              key={b.id}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(i)}
              className="bg-white rounded-2xl shadow-card p-3 flex items-center gap-3 cursor-move"
            >
              <GripVertical size={16} className="text-gray-300 shrink-0" />
              <div className="relative w-20 h-14 rounded-xl overflow-hidden shrink-0 bg-bg">
                <Image src={b.imageUrl} alt={b.headline} fill className="object-cover" sizes="80px" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{b.headline}</p>
                <p className="text-xs text-gray-400 truncate">{b.subtext}</p>
              </div>
              <button onClick={() => openEdit(b)} className="w-8 h-8 rounded-full bg-bg flex items-center justify-center"><Pencil size={14} /></button>
              <button onClick={() => setDeleteTarget(b)} className="w-8 h-8 rounded-full bg-bg flex items-center justify-center text-accent"><Trash2 size={14} /></button>
            </div>
          ))
        )}
        {!loading && banners.length === 0 && <p className="text-sm text-gray-400">No banners yet. Add one to get started.</p>}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white w-full md:max-w-lg md:rounded-3xl rounded-t-3xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-black/5 sticky top-0 bg-white">
              <h2 className="font-bold text-lg">{editingId ? "Edit Banner" : "Add Banner"}</h2>
              <button onClick={() => setModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
              <div>
                <p className="text-xs text-gray-400 mb-2">Banner Photo</p>
                {form.imageUrl && (
                  <div className="relative w-full h-32 rounded-2xl overflow-hidden mb-2">
                    <Image src={form.imageUrl} alt={form.headline ? `${form.headline} banner preview` : "Banner image preview"} fill className="object-cover" sizes="400px" />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                  className="text-xs w-full"
                />
                {uploading && <p className="text-xs text-gray-400 mt-1">Uploading...</p>}
              </div>

              {form.imageUrl && (
                <div className="space-y-3">
                  <FocalPointPicker
                    imageUrl={form.imageUrl}
                    value={form.desktopPosition}
                    onChange={(pos) => setForm((f) => ({ ...f, desktopPosition: pos }))}
                    aspectClassName="aspect-[21/9]"
                    label="Desktop crop"
                  />
                  <FocalPointPicker
                    imageUrl={form.imageUrl}
                    value={form.mobilePosition}
                    onChange={(pos) => setForm((f) => ({ ...f, mobilePosition: pos }))}
                    aspectClassName="aspect-[4/5]"
                    label="Mobile crop"
                  />
                </div>
              )}
              <input required placeholder="Headline" value={form.headline} onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))} className="w-full bg-bg rounded-2xl px-4 py-3 text-sm outline-none" />
              <input required placeholder="Subtext" value={form.subtext} onChange={(e) => setForm((f) => ({ ...f, subtext: e.target.value }))} className="w-full bg-bg rounded-2xl px-4 py-3 text-sm outline-none" />
              <div className="grid grid-cols-2 gap-3">
                <input required placeholder="CTA Label" value={form.ctaLabel} onChange={(e) => setForm((f) => ({ ...f, ctaLabel: e.target.value }))} className="w-full bg-bg rounded-2xl px-4 py-3 text-sm outline-none" />
                <input required placeholder="CTA Link (e.g. /shop)" value={form.ctaHref} onChange={(e) => setForm((f) => ({ ...f, ctaHref: e.target.value }))} className="w-full bg-bg rounded-2xl px-4 py-3 text-sm outline-none" />
              </div>
              <button type="submit" disabled={saving || uploading} className="w-full bg-ink text-white font-semibold py-3.5 rounded-full disabled:opacity-50">
                {saving ? "Saving..." : editingId ? "Save Changes" : "Add Banner"}
              </button>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-3xl p-6 w-full max-w-sm text-center">
            <h3 className="font-bold">Delete this banner?</h3>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 bg-bg font-semibold py-3 rounded-full text-sm">Cancel</button>
              <button onClick={confirmDelete} className="flex-1 bg-accent text-white font-semibold py-3 rounded-full text-sm">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
