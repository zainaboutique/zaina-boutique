"use client";

import { useEffect, useRef, useState } from "react";
import Image from "@/components/OptimizedImage";
import { Plus, Pencil, Trash2, X, Star, Upload, FileUp } from "lucide-react";
import { getProducts, createProduct, updateProduct, deleteProduct, getCoverImage, bulkCreateProducts } from "@/lib/data";
import { storage, isFirebaseConfigured } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { formatPrice, fileToDataUrl, slugify, parseCsv } from "@/lib/utils";
import { SUGGESTED_CATEGORY_CHIPS, OCCASIONS } from "@/lib/demo-data";
import type { Product, Audience, Badge, ProductColor } from "@/lib/types";
import { useAdminAuth } from "@/lib/use-admin-auth";

const AUDIENCES: Audience[] = ["Women", "Men", "Kids", "Unisex"];
const BADGES: Badge[] = ["Premium", "Exclusive", "On Sale", "Trending", "New", "Best Seller", "Featured"];
const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "One Size", "Free Size"];

function normalizeAudience(raw: string): Audience {
  const v = (raw || "").trim().toLowerCase();
  if (v === "women") return "Women";
  if (v === "men") return "Men";
  if (v === "kids") return "Kids";
  return "Unisex";
}

function isTrue(v: string | undefined): boolean {
  return /^(true|yes|1)$/i.test((v || "").trim());
}

function parseColorsField(raw: string | undefined): ProductColor[] {
  if (!raw) return [];
  return raw
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((entry) => {
      const match = entry.match(/^(.*?)\s*\(#([0-9a-fA-F]{3,8})\)\.?\s*$/);
      if (match) {
        return { name: match[1].trim().replace(/\.$/, ""), hex: `#${match[2]}` };
      }
      return { name: entry };
    });
}

const emptyForm = {
  title: "",
  slug: "",
  description: "",
  price: "",
  compareAtPrice: "",
  designer: "",
  audience: "Women" as Audience,
  categories: [] as string[],
  subCategory: "",
  fabric: "",
  occasions: [] as string[],
  badges: [] as Badge[],
  images: [] as string[],
  coverImageIndex: 0,
  colors: [] as ProductColor[],
  sizes: [] as string[],
  customSize: "",
  stock: "",
  inStock: true,
  freeShipping: false,
  shippingCost: "",
  tags: "",
  material: "",
  fit: "",
  care: "",
  includes: "",
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [colorUploading, setColorUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(30);
  const { isOwner } = useAdminAuth(); // staff accounts don't see Import CSV

  async function refresh() {
    setLoading(true);
    setProducts(await getProducts());
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setSlugTouched(false);
    setModalOpen(true);
  }

  function openEdit(p: Product) {
    setEditingId(p.id);
    setSlugTouched(true);
    setForm({
      title: p.title,
      slug: p.slug || slugify(p.title),
      description: p.description,
      price: String(p.price),
      compareAtPrice: p.compareAtPrice ? String(p.compareAtPrice) : "",
      designer: p.designer || "",
      audience: p.audience || "Women",
      categories: p.categories || [],
      subCategory: p.subCategory || "",
      fabric: p.fabric || "",
      occasions: p.occasions || [],
      badges: p.badges,
      images: p.images?.length ? p.images : [p.imageUrl],
      coverImageIndex: p.coverImageIndex ?? 0,
      colors: p.colors || [],
      sizes: p.sizes || [],
      customSize: "",
      stock: String(p.stock),
      inStock: p.inStock ?? true,
      freeShipping: Boolean(p.freeShipping),
      shippingCost: p.shippingCost !== undefined ? String(p.shippingCost) : "",
      tags: (p.tags ?? []).join(", "),
      material: p.details?.material ?? "",
      fit: p.details?.fit ?? "",
      care: p.details?.care ?? "",
      includes: (p.details as { includes?: string } | undefined)?.includes ?? "",
    });
    setModalOpen(true);
  }

  function toggleFromList<K extends "badges" | "categories" | "occasions" | "sizes">(key: K, value: string) {
    setForm((f) => {
      const list = f[key] as string[];
      const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
      return { ...f, [key]: next };
    });
  }

  async function handleImageUpload(files: FileList) {
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        if (isFirebaseConfigured && storage) {
          const fileRef = ref(storage, `products/${Date.now()}-${file.name}`);
          await uploadBytes(fileRef, file);
          uploaded.push(await getDownloadURL(fileRef));
        } else {
          uploaded.push(await fileToDataUrl(file));
        }
      }
      setForm((f) => ({ ...f, images: [...f.images, ...uploaded] }));
    } finally {
      setUploading(false);
    }
  }

  function removeImage(index: number) {
    setForm((f) => {
      const images = f.images.filter((_, i) => i !== index);
      const coverImageIndex = f.coverImageIndex >= images.length ? 0 : f.coverImageIndex;
      return { ...f, images, coverImageIndex };
    });
  }

  async function handleColorPhoto(file: File, colorIndex: number) {
    setColorUploading(true);
    try {
      let url: string;
      if (isFirebaseConfigured && storage) {
        const fileRef = ref(storage, `products/colors/${Date.now()}-${file.name}`);
        await uploadBytes(fileRef, file);
        url = await getDownloadURL(fileRef);
      } else {
        url = await fileToDataUrl(file);
      }
      setForm((f) => {
        const colors = [...f.colors];
        colors[colorIndex] = { ...colors[colorIndex], photoUrl: url };
        return { ...f, colors };
      });
    } finally {
      setColorUploading(false);
    }
  }

  function addColorRow() {
    setForm((f) => ({ ...f, colors: [...f.colors, { name: "", hex: "#000000", photoUrl: "" }] }));
  }

  function updateColorName(index: number, name: string) {
    setForm((f) => {
      const colors = [...f.colors];
      colors[index] = { ...colors[index], name };
      return { ...f, colors };
    });
  }

  function updateColorHex(index: number, hex: string) {
    setForm((f) => {
      const colors = [...f.colors];
      colors[index] = { ...colors[index], hex };
      return { ...f, colors };
    });
  }

  function removeColorRow(index: number) {
    setForm((f) => ({ ...f, colors: f.colors.filter((_, i) => i !== index) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const finalSlug = form.slug || slugify(form.title);
    const duplicate = products.find((p) => p.slug === finalSlug && p.id !== editingId);
    if (duplicate) {
      alert(
        `The slug "${finalSlug}" is already used by "${duplicate.title}". Since product pages are now reached by slug, two products can't share one — please change the slug before saving.`
      );
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        slug: finalSlug,
        description: form.description,
        price: Number(form.price),
        compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : undefined,
        designer: form.designer || undefined,
        audience: form.audience,
        category: (form.audience === "Men" ? "Men" : "Essentials") as Product["category"],
        categories: form.categories,
        subCategory: form.subCategory || undefined,
        fabric: form.fabric || undefined,
        occasions: form.occasions,
        badges: form.badges,
        imageUrl: form.images[form.coverImageIndex] || form.images[0] || "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80",
        images: form.images,
        coverImageIndex: form.coverImageIndex,
        colors: form.colors.filter((c) => c.name && (c.photoUrl || c.hex)),
        stock: Number(form.stock),
        inStock: form.inStock,
        freeShipping: form.freeShipping,
        shippingCost: !form.freeShipping && form.shippingCost ? Number(form.shippingCost) : undefined,
        sizes: form.sizes,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        details: { material: form.material, fit: form.fit, care: form.care, includes: form.includes },
        createdAt: Date.now(),
      };
      if (editingId) {
        await updateProduct(editingId, payload);
      } else {
        await createProduct(payload);
      }
      setModalOpen(false);
      await refresh();
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    await deleteProduct(deleteTarget.id);
    setDeleteTarget(null);
    await refresh();
  }

  async function handleCsvImport(file: File) {
    setImporting(true);
    setImportResult(null);
    try {
      const text = await file.text();
      const rows = parseCsv(text);

      const toCreate = rows
        .filter((r) => (r.name || r.title) && r.price)
        .map((r) => {
          const title = r.name || r.title;
          const audience = normalizeAudience(r.audience);
          const categories = Array.from(
            new Set(
              [r.category, ...(r["other categories"] || "").split(";")]
                .map((s) => s.trim())
                .filter(Boolean)
            )
          );
          const occasions = Array.from(
            new Set(
              [...(r.occasion || "").split(";"), isTrue(r.festive) ? "Festive" : ""]
                .map((s) => s.trim())
                .filter(Boolean)
            )
          );
          const badges: Badge[] = [
            isTrue(r.new) ? "New" : null,
            isTrue(r.sale) ? "On Sale" : null,
            isTrue(r["best seller"]) ? "Best Seller" : null,
            isTrue(r.featured) ? "Featured" : null,
          ].filter((b): b is Badge => b !== null);
          const images = (r.images || "").split("|").map((s) => s.trim()).filter(Boolean);
          const createdAt = r["created at"] && !Number.isNaN(Date.parse(r["created at"])) ? Date.parse(r["created at"]) : Date.now();

          return {
            title,
            slug: r.slug || slugify(title),
            description: r.description || "",
            price: Number(r.price) || 0,
            compareAtPrice: r["compare price"] ? Number(r["compare price"]) : undefined,
            designer: r.designer || undefined,
            audience,
            category: (audience === "Men" ? "Men" : "Essentials") as Product["category"],
            categories,
            subCategory: r["sub category"] || undefined,
            fabric: r.fabric || undefined,
            occasions,
            badges,
            imageUrl: images[0] || "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80",
            images,
            coverImageIndex: 0,
            colors: parseColorsField(r.colors),
            stock: Number(r["stock count"]) || 0,
            inStock: r["in stock"] ? isTrue(r["in stock"]) : undefined,
            sizePricing: r["size pricing"] || undefined,
            freeShipping: isTrue(r["free shipping"]),
            sizes: (r.sizes || "").split(";").map((s) => s.trim()).filter(Boolean),
            tags: (r.tags || "").split(";").map((s) => s.trim()).filter(Boolean),
            createdAt,
          };
        });

      if (toCreate.length === 0) {
        setImportResult("No valid rows found. Each row needs at least a Name and a Price column.");
        return;
      }

      // Product pages are now reached by slug, so two products can't share
      // one — drop rows whose slug already exists (either earlier in this
      // same CSV, or already in the store) rather than silently creating an
      // unreachable duplicate.
      const existingSlugs = new Set(products.map((p) => p.slug));
      const seenInThisImport = new Set<string>();
      const skippedDuplicates: string[] = [];
      const deduped = toCreate.filter((p) => {
        if (existingSlugs.has(p.slug) || seenInThisImport.has(p.slug)) {
          skippedDuplicates.push(`${p.title} (slug: ${p.slug})`);
          return false;
        }
        seenInThisImport.add(p.slug);
        return true;
      });

      if (deduped.length === 0) {
        setImportResult("Every row's slug already exists in your store — nothing new to import.");
        return;
      }

      const count = await bulkCreateProducts(deduped);
      const skippedNote = skippedDuplicates.length > 0 ? ` Skipped ${skippedDuplicates.length} row(s) with a slug that already exists: ${skippedDuplicates.slice(0, 5).join(", ")}${skippedDuplicates.length > 5 ? ", ..." : ""}.` : "";
      setImportResult(`Imported ${count} product${count === 1 ? "" : "s"} successfully.${skippedNote}`);
      await refresh();
    } catch (err) {
      setImportResult(`Import failed: ${err instanceof Error ? err.message : "unknown error"}`);
    } finally {
      setImporting(false);
      if (csvInputRef.current) csvInputRef.current.value = "";
    }
  }

  // Search by name, then show only the first few — a long list of rows with
  // photos is what makes this page slow.
  const searchTerm = search.trim().toLowerCase();
  const filteredProducts = searchTerm
    ? products.filter((p) => p.title.toLowerCase().includes(searchTerm) || (p.slug || "").toLowerCase().includes(searchTerm))
    : products;
  const visibleProducts = filteredProducts.slice(0, visibleCount);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-sm text-gray-400 mt-1">Manage your catalogue.</p>
        </div>
        <div className="flex gap-2">
          {isOwner && (
            <>
              <button
                onClick={() => csvInputRef.current?.click()}
                disabled={importing}
                className="flex items-center gap-1.5 bg-white shadow-card text-sm font-semibold px-4 py-2.5 rounded-full disabled:opacity-50"
              >
                <FileUp size={16} /> {importing ? "Importing..." : "Import CSV"}
              </button>
              <input ref={csvInputRef} type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files?.[0] && handleCsvImport(e.target.files[0])} />
            </>
          )}
          <button onClick={openCreate} className="flex items-center gap-1.5 bg-ink text-white text-sm font-semibold px-4 py-2.5 rounded-full">
            <Plus size={16} /> Add Product
          </button>
        </div>
      </div>

      {importResult && (
        <div className="mt-3 text-sm bg-white shadow-card rounded-2xl px-4 py-3">
          {importResult}
          <p className="text-xs text-gray-400 mt-1">
            Columns: Name, Price (required), Slug, Designer, Audience (Women/Men/Kids), Category, Other Categories
            (semicolon-separated), Sub Category, Compare Price, Fabric, Occasion (semicolon-separated), Tags
            (semicolon-separated), Sizes (semicolon-separated), Colors (&quot;Name (#hex); Name (#hex)&quot;), In Stock
            (true/false), Stock Count, Featured/New/Sale/Best Seller/Free Shipping (true/false), Images
            (pipe-separated URLs), Description, Created At. See the README for full details.
          </p>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setVisibleCount(30); }}
          placeholder="Search products by name..."
          aria-label="Search products"
          className="flex-1 min-w-[220px] bg-white shadow-card rounded-full px-4 py-2.5 text-sm outline-none"
        />
        <span className="text-xs text-gray-400">
          {loading ? "" : `Showing ${Math.min(visibleCount, filteredProducts.length)} of ${filteredProducts.length}`}
        </span>
      </div>

      <div className="bg-white rounded-2xl shadow-card mt-3 overflow-x-auto">
        <table className="w-full text-sm min-w-[760px]">
          <thead>
            <tr className="text-left text-gray-400 border-b border-black/5">
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Audience</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Shipping</th>
              <th className="px-4 py-3 font-medium">Badges</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-400">Loading...</td></tr>
            ) : (
              visibleProducts.map((p) => (
                <tr key={p.id} className="border-b border-black/5 last:border-0">
                  <td className="px-4 py-3 flex items-center gap-3">
                    <div className="relative w-10 h-12 rounded-lg overflow-hidden shrink-0 bg-bg">
                      <Image src={getCoverImage(p)} alt={p.title} fill className="object-cover" sizes="40px" />
                    </div>
                    <div>
                      <span className="font-medium">{p.title}</span>
                      {p.designer && <p className="text-xs text-gray-400">{p.designer}</p>}
                    </div>
                  </td>
                  <td className="px-4 py-3">{p.audience}</td>
                  <td className="px-4 py-3">{formatPrice(p.price)}</td>
                  <td className="px-4 py-3">
                    {p.stock > 0 ? (
                      p.stock
                    ) : p.inStock === false ? (
                      <span className="text-xs font-medium text-accent">Out of stock</span>
                    ) : (
                      <span className="text-xs font-medium text-green-600">In stock</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {p.freeShipping ? (
                      <span className="text-xs font-medium text-green-600">Free</span>
                    ) : p.shippingCost !== undefined ? (
                      <span className="text-xs font-medium">{formatPrice(p.shippingCost)}</span>
                    ) : (
                      <span className="text-xs text-gray-400">Default</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {p.badges.map((b) => (
                        <span key={b} className="text-[10px] bg-bg px-2 py-1 rounded-full">{b}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(p)} className="w-8 h-8 rounded-full bg-bg flex items-center justify-center"><Pencil size={14} /></button>
                      <button onClick={() => setDeleteTarget(p)} className="w-8 h-8 rounded-full bg-bg flex items-center justify-center text-accent"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          {!loading && filteredProducts.length > visibleProducts.length && (
              <tr>
                <td colSpan={7} className="px-4 py-4 text-center">
                  <button onClick={() => setVisibleCount((n) => n + 30)} className="bg-bg font-semibold text-sm px-6 py-2.5 rounded-full">
                    Show more
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white w-full md:max-w-xl md:rounded-3xl rounded-t-3xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-black/5 sticky top-0 bg-white z-10">
              <h2 className="font-bold text-lg">{editingId ? "Edit Product" : "Add Product"}</h2>
              <button onClick={() => setModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Basics</p>
              <input
                required
                placeholder="Name"
                value={form.title}
                onChange={(e) => {
                  const title = e.target.value;
                  setForm((f) => ({ ...f, title, slug: slugTouched ? f.slug : slugify(title) }));
                }}
                className="w-full bg-bg rounded-2xl px-4 py-3 text-sm outline-none"
              />
              <input
                required
                placeholder="Slug"
                value={form.slug}
                onChange={(e) => { setSlugTouched(true); setForm((f) => ({ ...f, slug: e.target.value })); }}
                className="w-full bg-bg rounded-2xl px-4 py-3 text-sm outline-none font-mono"
              />
              <textarea required placeholder="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} className="w-full bg-bg rounded-2xl px-4 py-3 text-sm outline-none resize-none" />
              <input placeholder="Designer / Label (e.g. In-house, or a collection line)" value={form.designer} onChange={(e) => setForm((f) => ({ ...f, designer: e.target.value }))} className="w-full bg-bg rounded-2xl px-4 py-3 text-sm outline-none" />

              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-2">Pricing &amp; Inventory</p>
              <div className="grid grid-cols-2 gap-3">
                <input required type="number" step="0.01" placeholder="Price (₹)" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} className="w-full bg-bg rounded-2xl px-4 py-3 text-sm outline-none" />
                <input type="number" step="0.01" placeholder="Compare-at Price (₹)" value={form.compareAtPrice} onChange={(e) => setForm((f) => ({ ...f, compareAtPrice: e.target.value }))} className="w-full bg-bg rounded-2xl px-4 py-3 text-sm outline-none" />
              </div>
              <div className="flex items-center gap-3">
                <input type="number" placeholder="Stock Count" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} className="flex-1 bg-bg rounded-2xl px-4 py-3 text-sm outline-none" />
                <label className="flex items-center gap-2 text-sm font-medium whitespace-nowrap">
                  <input type="checkbox" checked={form.inStock} onChange={(e) => setForm((f) => ({ ...f, inStock: e.target.checked }))} />
                  In Stock
                </label>
              </div>
              <p className="text-[11px] text-gray-400 -mt-2">
                If you don&apos;t track exact quantities, leave Stock Count at 0 and just use the In Stock toggle.
              </p>

              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-2">Categorization</p>
              <select value={form.audience} onChange={(e) => setForm((f) => ({ ...f, audience: e.target.value as Audience }))} className="w-full bg-bg rounded-2xl px-4 py-3 text-sm outline-none">
                {AUDIENCES.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>

              <div>
                <p className="text-xs text-gray-400 mb-2">Categories (select one or more)</p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_CATEGORY_CHIPS.map((c) => (
                    <button type="button" key={c} onClick={() => toggleFromList("categories", c)} className={`text-xs font-medium px-3 py-1.5 rounded-full ${form.categories.includes(c) ? "bg-ink text-white" : "bg-bg text-ink"}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Sub-category (e.g. Bridal Lehengas)" value={form.subCategory} onChange={(e) => setForm((f) => ({ ...f, subCategory: e.target.value }))} className="w-full bg-bg rounded-2xl px-4 py-3 text-sm outline-none" />
                <input placeholder="Fabric" value={form.fabric} onChange={(e) => setForm((f) => ({ ...f, fabric: e.target.value }))} className="w-full bg-bg rounded-2xl px-4 py-3 text-sm outline-none" />
              </div>

              <div>
                <p className="text-xs text-gray-400 mb-2">Occasions</p>
                <div className="flex flex-wrap gap-2">
                  {OCCASIONS.map((o) => (
                    <button type="button" key={o} onClick={() => toggleFromList("occasions", o)} className={`text-xs font-medium px-3 py-1.5 rounded-full ${form.occasions.includes(o) ? "bg-ink text-white" : "bg-bg text-ink"}`}>
                      {o}
                    </button>
                  ))}
                </div>
              </div>

              <input placeholder="Tags, comma separated" value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} className="w-full bg-bg rounded-2xl px-4 py-3 text-sm outline-none" />

              <label className="flex items-center gap-2 text-sm font-medium">
                <input type="checkbox" checked={form.freeShipping} onChange={(e) => setForm((f) => ({ ...f, freeShipping: e.target.checked }))} />
                Free Shipping
              </label>
              {!form.freeShipping && (
                <div>
                  <input
                    type="number"
                    min={0}
                    placeholder="Shipping cost for this product (₹) — leave blank to use the site-wide default"
                    value={form.shippingCost}
                    onChange={(e) => setForm((f) => ({ ...f, shippingCost: e.target.value }))}
                    className="w-full bg-bg rounded-2xl px-4 py-3 text-sm outline-none"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Only needed if this product should cost more (or less) to ship than your
                    site-wide default in Settings → Payments. Most products can leave this blank.
                  </p>
                </div>
              )}

              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-2">Details</p>
              <input placeholder="Material (e.g. 100% Cotton)" value={form.material} onChange={(e) => setForm((f) => ({ ...f, material: e.target.value }))} className="w-full bg-bg rounded-2xl px-4 py-3 text-sm outline-none" />
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Fit (e.g. Relaxed fit)" value={form.fit} onChange={(e) => setForm((f) => ({ ...f, fit: e.target.value }))} className="w-full bg-bg rounded-2xl px-4 py-3 text-sm outline-none" />
                <input placeholder="Care instructions" value={form.care} onChange={(e) => setForm((f) => ({ ...f, care: e.target.value }))} className="w-full bg-bg rounded-2xl px-4 py-3 text-sm outline-none" />
              </div>
              <input placeholder="Includes (e.g. Saree + blouse piece)" value={form.includes} onChange={(e) => setForm((f) => ({ ...f, includes: e.target.value }))} className="w-full bg-bg rounded-2xl px-4 py-3 text-sm outline-none" />

              <div>
                <p className="text-xs text-gray-400 mb-2">Badges</p>
                <div className="flex flex-wrap gap-2">
                  {BADGES.map((b) => (
                    <button type="button" key={b} onClick={() => toggleFromList("badges", b)} className={`text-xs font-medium px-3 py-1.5 rounded-full ${form.badges.includes(b) ? "bg-ink text-white" : "bg-bg text-ink"}`}>
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-2">Sizes</p>
              <div className="flex flex-wrap gap-2">
                {SIZE_OPTIONS.map((s) => (
                  <button type="button" key={s} onClick={() => toggleFromList("sizes", s)} className={`text-xs font-medium px-3 py-1.5 rounded-full ${form.sizes.includes(s) ? "bg-ink text-white" : "bg-bg text-ink"}`}>
                    {s}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  placeholder="Custom size (e.g. 38, 40, 5XL...)"
                  value={form.customSize}
                  onChange={(e) => setForm((f) => ({ ...f, customSize: e.target.value }))}
                  className="flex-1 bg-bg rounded-2xl px-4 py-2.5 text-sm outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!form.customSize.trim()) return;
                    setForm((f) => ({ ...f, sizes: [...f.sizes, f.customSize.trim()], customSize: "" }));
                  }}
                  className="bg-bg text-sm font-semibold px-4 rounded-2xl"
                >
                  + Add
                </button>
              </div>

              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-2">Colors</p>
              <p className="text-[11px] text-gray-400 -mt-2">Pick a swatch color, or add a photo for a real thumbnail — a photo takes priority if both are set.</p>
              {form.colors.map((color, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-bg shrink-0">
                    {color.photoUrl ? (
                      <Image src={color.photoUrl} alt={color.name || "color"} fill className="object-cover" sizes="40px" />
                    ) : (
                      <div className="w-full h-full" style={{ background: color.hex || "#ccc" }} />
                    )}
                  </div>
                  <input type="color" value={color.hex || "#000000"} onChange={(e) => updateColorHex(i, e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer shrink-0" />
                  <input placeholder="Color name" value={color.name} onChange={(e) => updateColorName(i, e.target.value)} className="flex-1 bg-bg rounded-2xl px-4 py-2.5 text-sm outline-none" />
                  <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleColorPhoto(e.target.files[0], i)} className="text-xs w-24" />
                  <button type="button" onClick={() => removeColorRow(i)} className="w-8 h-8 rounded-full bg-bg flex items-center justify-center text-accent shrink-0"><X size={14} /></button>
                </div>
              ))}
              <button type="button" onClick={addColorRow} className="flex items-center gap-1 text-xs font-semibold text-gray-500">
                <Plus size={12} /> Add color
              </button>
              {colorUploading && <p className="text-xs text-gray-400">Uploading color photo...</p>}

              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-2">Images</p>
              <p className="text-[11px] text-gray-400 -mt-2">Click the star to set the cover photo shown in listings.</p>
              <div className="flex flex-wrap gap-3 mb-2">
                {form.images.map((src, i) => (
                  <div key={src + i} className="relative w-16 h-16 rounded-xl overflow-hidden">
                    <Image src={src} alt={form.title ? `${form.title} — photo ${i + 1}` : `Product photo ${i + 1}`} fill className="object-cover" sizes="64px" />
                    <button type="button" onClick={() => setForm((f) => ({ ...f, coverImageIndex: i }))} className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full flex items-center justify-center ${form.coverImageIndex === i ? "bg-yellow-400 text-white" : "bg-black/50 text-white"}`} title="Set as cover photo">
                      <Star size={11} fill={form.coverImageIndex === i ? "currentColor" : "none"} />
                    </button>
                    <button type="button" onClick={() => removeImage(i)} className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center">
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>
              <label className="flex items-center justify-center gap-2 border border-dashed rounded-2xl py-4 text-sm cursor-pointer border-black/15 text-gray-400">
                <Upload size={16} /> Upload images
                <input type="file" accept="image/*" multiple onChange={(e) => e.target.files && handleImageUpload(e.target.files)} className="hidden" />
              </label>
              {uploading && <p className="text-xs text-gray-400 mt-1">Uploading images...</p>}

              <button type="submit" disabled={saving || uploading} className="w-full bg-ink text-white font-semibold py-3.5 rounded-full disabled:opacity-50 sticky bottom-0">
                {saving ? "Saving..." : editingId ? "Save Changes" : "Add Product"}
              </button>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-3xl p-6 w-full max-w-sm text-center">
            <h3 className="font-bold">Delete &ldquo;{deleteTarget.title}&rdquo;?</h3>
            <p className="text-sm text-gray-400 mt-1">This action cannot be undone.</p>
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
