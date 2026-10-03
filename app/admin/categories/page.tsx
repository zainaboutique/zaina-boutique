"use client";

import { useEffect, useState } from "react";
import Image from "@/components/OptimizedImage";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { getCategories, createCategory, updateCategory, deleteCategory, getSettings, saveSettings } from "@/lib/data";
import { OCCASIONS } from "@/lib/demo-data";
import { storage, isFirebaseConfigured } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { fileToDataUrl } from "@/lib/utils";
import FocalPointPicker from "@/components/FocalPointPicker";
import type { Category, ShopGroup, ImagePosition, Settings } from "@/lib/types";

const GROUPS: ShopGroup[] = ["New Arrival", "Women", "Men", "Kids"];
const emptyForm = { name: "", slug: "", parent: "New Arrival" as ShopGroup, imageUrl: "", position: { x: 50, y: 50 } as ImagePosition };

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [uploadingMainCat, setUploadingMainCat] = useState<ShopGroup | null>(null);
  const [uploadingOccasion, setUploadingOccasion] = useState<string | null>(null);

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  async function handleMainCategoryUpload(group: ShopGroup, file: File) {
    if (!settings) return;
    setUploadingMainCat(group);
    try {
      let url: string;
      if (isFirebaseConfigured && storage) {
        const fileRef = ref(storage, `main-categories/${group}-${Date.now()}`);
        await uploadBytes(fileRef, file);
        url = await getDownloadURL(fileRef);
      } else {
        url = await fileToDataUrl(file);
      }
      const updated = { ...settings, mainCategoryImages: { ...settings.mainCategoryImages, [group]: url } };
      await saveSettings(updated);
      setSettings(updated);
    } finally {
      setUploadingMainCat(null);
    }
  }

  async function handleOccasionCoverUpload(occasion: string, file: File) {
    if (!settings) return;
    setUploadingOccasion(occasion);
    try {
      let url: string;
      if (isFirebaseConfigured && storage) {
        const fileRef = ref(storage, `occasion-covers/${occasion}-${Date.now()}`);
        await uploadBytes(fileRef, file);
        url = await getDownloadURL(fileRef);
      } else {
        url = await fileToDataUrl(file);
      }
      const updated = { ...settings, occasionCoverImages: { ...settings.occasionCoverImages, [occasion]: url } };
      await saveSettings(updated);
      setSettings(updated);
    } finally {
      setUploadingOccasion(null);
    }
  }

  async function refresh() {
    setLoading(true);
    setCategories(await getCategories());
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

  function openEdit(c: Category) {
    setEditingId(c.id);
    setForm({ name: c.name, slug: c.slug, parent: c.parent, imageUrl: c.imageUrl, position: c.position || { x: 50, y: 50 } });
    setModalOpen(true);
  }

  async function handleImageUpload(file: File) {
    setUploading(true);
    try {
      let url: string;
      if (isFirebaseConfigured && storage) {
        const fileRef = ref(storage, `categories/${Date.now()}-${file.name}`);
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
      const payload = {
        name: form.name,
        slug: form.slug || form.name.toLowerCase().replace(/\s+/g, "-"),
        parent: form.parent,
        imageUrl: form.imageUrl || "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=400&q=80",
        order: editingId ? categories.find((c) => c.id === editingId)?.order ?? 0 : categories.length,
        position: form.position,
      };
      if (editingId) await updateCategory(editingId, payload);
      else await createCategory(payload);
      setModalOpen(false);
      await refresh();
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    await deleteCategory(deleteTarget.id);
    setDeleteTarget(null);
    await refresh();
  }

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold">Categories</h1>
        <p className="text-sm text-gray-400 mt-1">Manage your main categories and sub-categories.</p>
      </div>

      <div className="mt-6">
        <p className="text-sm font-semibold mb-1">Main Categories</p>
        <p className="text-xs text-gray-400 mb-3">
          These four are fixed (every product belongs to one) — you can give each an image shown
          in the navigation menu. Add the specific items within each one below, under "Sub
          Categories."
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {GROUPS.map((g) => {
            const img = settings?.mainCategoryImages?.[g];
            return (
              <div key={g} className="bg-white rounded-2xl shadow-card p-3 text-center">
                <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-bg mb-2">
                  {img && <Image src={img} alt={g} fill className="object-cover" sizes="150px" />}
                </div>
                <p className="text-sm font-medium mb-2">{g}</p>
                <label className="text-xs underline cursor-pointer">
                  {uploadingMainCat === g ? "Uploading..." : img ? "Change image" : "Add image"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleMainCategoryUpload(g, e.target.files[0])}
                  />
                </label>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-8">
        <p className="text-sm font-semibold mb-1">Shop By Occasion Covers</p>
        <p className="text-xs text-gray-400 mb-3">
          The homepage picks a cover photo for each occasion tile automatically (the first
          product tagged with it) — set one here to take direct control instead, independent of
          which products happen to be tagged.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {OCCASIONS.map((occasion) => {
            const img = settings?.occasionCoverImages?.[occasion];
            return (
              <div key={occasion} className="bg-white rounded-2xl shadow-card p-3 text-center">
                <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-bg mb-2">
                  {img && <Image src={img} alt={occasion} fill className="object-cover" sizes="150px" />}
                </div>
                <p className="text-sm font-medium mb-2">{occasion}</p>
                <label className="text-xs underline cursor-pointer">
                  {uploadingOccasion === occasion ? "Uploading..." : img ? "Change image" : "Add image"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleOccasionCoverUpload(occasion, e.target.files[0])}
                  />
                </label>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between mt-8">
        <div>
          <p className="text-sm font-semibold">Sub Categories</p>
          <p className="text-xs text-gray-400 mt-0.5">Specific items within a main category, e.g. "Sarees" under Women.</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-1.5 bg-ink text-white text-sm font-semibold px-4 py-2.5 rounded-full">
          <Plus size={16} /> Add Sub Category
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {loading ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : (
          categories.map((c) => (
            <div key={c.id} className="bg-white rounded-2xl shadow-card overflow-hidden flex items-center gap-3 p-3">
              <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-bg">
                <Image
                  src={c.imageUrl}
                  alt={c.name}
                  fill
                  className="object-cover"
                  style={{ objectPosition: `${c.position?.x ?? 50}% ${c.position?.y ?? 50}%` }}
                  sizes="56px"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{c.name}</p>
                <p className="text-xs text-gray-400">{c.parent}</p>
              </div>
              <button onClick={() => openEdit(c)} className="w-8 h-8 rounded-full bg-bg flex items-center justify-center"><Pencil size={14} /></button>
              <button onClick={() => setDeleteTarget(c)} className="w-8 h-8 rounded-full bg-bg flex items-center justify-center text-accent"><Trash2 size={14} /></button>
            </div>
          ))
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white w-full md:max-w-md md:rounded-3xl rounded-t-3xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-black/5 sticky top-0 bg-white">
              <h2 className="font-bold text-lg">{editingId ? "Edit Category" : "Add Category"}</h2>
              <button onClick={() => setModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
              <input
                required
                placeholder="Name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full bg-bg rounded-2xl px-4 py-3 text-sm outline-none"
              />
              <select
                value={form.parent}
                onChange={(e) => setForm((f) => ({ ...f, parent: e.target.value as ShopGroup }))}
                className="w-full bg-bg rounded-2xl px-4 py-3 text-sm outline-none"
              >
                {GROUPS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
              <div>
                <p className="text-xs text-gray-400 mb-2">Category Image</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                  className="text-xs w-full mb-2"
                />
                {uploading && <p className="text-xs text-gray-400 mb-2">Uploading...</p>}
                {form.imageUrl && (
                  <FocalPointPicker
                    imageUrl={form.imageUrl}
                    value={form.position}
                    onChange={(pos) => setForm((f) => ({ ...f, position: pos }))}
                    aspectClassName="aspect-square max-w-[220px]"
                    label="This shows as a circle on the storefront"
                  />
                )}
              </div>
              <button type="submit" disabled={saving || uploading} className="w-full bg-ink text-white font-semibold py-3.5 rounded-full disabled:opacity-50">
                {saving ? "Saving..." : editingId ? "Save Changes" : "Add Category"}
              </button>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-3xl p-6 w-full max-w-sm text-center">
            <h3 className="font-bold">Delete &ldquo;{deleteTarget.name}&rdquo;?</h3>
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
