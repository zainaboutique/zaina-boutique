"use client";

import { useEffect, useState } from "react";
import Image from "@/components/OptimizedImage";
import { Plus, Trash2, X } from "lucide-react";
import { getAllBlogPosts, saveBlogPost, deleteBlogPost } from "@/lib/data";
import { fileToDataUrl, slugify } from "@/lib/utils";
import { storage, isFirebaseConfigured } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import RichTextEditor from "@/components/RichTextEditor";
import type { BlogPost } from "@/lib/types";

const emptyForm = {
  title: "",
  slug: "",
  excerpt: "",
  coverImage: "",
  content: "",
  author: "Zaina Boutique",
  status: "draft" as "draft" | "published",
};

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [slugTouched, setSlugTouched] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [saving, setSaving] = useState(false);

  async function refresh() {
    setLoading(true);
    setPosts(await getAllBlogPosts());
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  function openNew() {
    setEditingId(null);
    setForm(emptyForm);
    setSlugTouched(false);
    setModalOpen(true);
  }

  function openEdit(post: BlogPost) {
    setEditingId(post.id);
    setForm({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      coverImage: post.coverImage,
      content: post.content,
      author: post.author,
      status: post.status,
    });
    setSlugTouched(true);
    setModalOpen(true);
  }

  async function handleCoverUpload(file: File) {
    setUploadingCover(true);
    try {
      let url: string;
      if (isFirebaseConfigured && storage) {
        const fileRef = ref(storage, `blog/cover-${Date.now()}-${file.name}`);
        await uploadBytes(fileRef, file);
        url = await getDownloadURL(fileRef);
      } else {
        url = await fileToDataUrl(file);
      }
      setForm((f) => ({ ...f, coverImage: url }));
    } finally {
      setUploadingCover(false);
    }
  }

  async function handleSave() {
    if (!form.title.trim()) return;
    const finalSlug = form.slug || slugify(form.title);
    const duplicate = posts.find((p) => p.slug === finalSlug && p.id !== editingId);
    if (duplicate) {
      alert(`A post with the slug "${finalSlug}" already exists. Please change the slug.`);
      return;
    }
    setSaving(true);
    try {
      await saveBlogPost({
        id: editingId || undefined,
        slug: finalSlug,
        title: form.title,
        excerpt: form.excerpt,
        coverImage: form.coverImage || "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&q=80",
        content: form.content,
        author: form.author || "Zaina Boutique",
        status: form.status,
      });
      setModalOpen(false);
      await refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this post? This can't be undone.")) return;
    await deleteBlogPost(id);
    await refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Blog</h1>
          <p className="text-sm text-gray-400 mt-1">Write and manage your storefront's blog posts.</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-1.5 bg-ink text-white font-semibold px-4 py-2.5 rounded-full text-sm">
          <Plus size={15} /> New Post
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading...</p>
      ) : posts.length === 0 ? (
        <p className="text-sm text-gray-400">No posts yet — click "New Post" to write your first one.</p>
      ) : (
        <div className="bg-white rounded-2xl shadow-card divide-y divide-black/5">
          {posts.map((post) => (
            <div key={post.id} onClick={() => openEdit(post)} className="flex items-center gap-4 p-4 cursor-pointer hover:bg-bg/50">
              <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-bg">
                <Image src={post.coverImage} alt={post.title} fill className="object-cover" sizes="64px" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{post.title}</p>
                <p className="text-xs text-gray-400 truncate">{post.excerpt}</p>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${post.status === "published" ? "bg-green-100 text-green-700" : "bg-bg text-gray-500"}`}>
                {post.status === "published" ? "Published" : "Draft"}
              </span>
              <button onClick={(e) => { e.stopPropagation(); handleDelete(post.id); }} className="w-8 h-8 rounded-full bg-bg flex items-center justify-center text-accent shrink-0">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{editingId ? "Edit Post" : "New Post"}</h2>
              <button onClick={() => setModalOpen(false)}><X size={20} /></button>
            </div>

            <div className="space-y-3">
              <input
                placeholder="Post title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value, slug: slugTouched ? f.slug : slugify(e.target.value) }))}
                className="w-full bg-bg rounded-2xl px-4 py-3 text-sm font-semibold outline-none"
              />
              <input
                placeholder="URL slug"
                value={form.slug}
                onChange={(e) => { setSlugTouched(true); setForm((f) => ({ ...f, slug: e.target.value })); }}
                className="w-full bg-bg rounded-2xl px-4 py-3 text-sm outline-none font-mono"
              />
              <textarea
                placeholder="Short excerpt (shown on the blog listing page)"
                value={form.excerpt}
                onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                rows={2}
                className="w-full bg-bg rounded-2xl px-4 py-3 text-sm outline-none resize-none"
              />

              <div className="grid grid-cols-2 gap-3">
                <input
                  placeholder="Author"
                  value={form.author}
                  onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
                  className="bg-bg rounded-2xl px-4 py-3 text-sm outline-none"
                />
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as "draft" | "published" }))}
                  className="bg-bg rounded-2xl px-4 py-3 text-sm outline-none"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>

              <div>
                <p className="text-xs text-gray-400 mb-2">Cover Image</p>
                <div className="flex items-center gap-3">
                  {form.coverImage && (
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-bg shrink-0">
                      <Image src={form.coverImage} alt="Cover" fill className="object-cover" sizes="64px" />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleCoverUpload(e.target.files[0])}
                    className="text-xs flex-1"
                  />
                </div>
                {uploadingCover && <p className="text-xs text-gray-400 mt-1">Uploading...</p>}
              </div>

              <div>
                <p className="text-xs text-gray-400 mb-2">Post Content</p>
                <RichTextEditor value={form.content} onChange={(html) => setForm((f) => ({ ...f, content: html }))} />
              </div>

              <button onClick={handleSave} disabled={saving} className="w-full bg-ink text-white font-semibold py-3.5 rounded-full text-sm disabled:opacity-50">
                {saving ? "Saving..." : editingId ? "Save Changes" : "Publish Post"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
