"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { getAllPageContent, savePageContent, getFaqs, saveFaq, deleteFaq, reorderFaqs } from "@/lib/data";
import type { PageContent, FaqItem } from "@/lib/types";

const STATIC_PAGES = [
  { slug: "about", label: "About Us" },
  { slug: "shipping", label: "Shipping & Delivery" },
  { slug: "returns", label: "Return & Exchange" },
  { slug: "payment-options", label: "Payment Options" },
  { slug: "size-guide", label: "Size Guide" },
  { slug: "terms", label: "Terms & Conditions" },
  { slug: "privacy", label: "Privacy Policy" },
];

export default function AdminPagesPage() {
  const [pages, setPages] = useState<Record<string, PageContent>>({});
  const [activeSlug, setActiveSlug] = useState(STATIC_PAGES[0].slug);
  const [form, setForm] = useState({ title: "", body: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [faqLoading, setFaqLoading] = useState(true);
  const [newFaq, setNewFaq] = useState({ question: "", answer: "" });
  const [tab, setTab] = useState<"pages" | "faq">("pages");

  async function refreshPages() {
    setLoading(true);
    const all = await getAllPageContent();
    const map: Record<string, PageContent> = {};
    all.forEach((p) => (map[p.slug] = p));
    setPages(map);
    setLoading(false);
  }

  async function refreshFaqs() {
    setFaqLoading(true);
    setFaqs(await getFaqs());
    setFaqLoading(false);
  }

  useEffect(() => {
    refreshPages();
    refreshFaqs();
  }, []);

  useEffect(() => {
    const p = pages[activeSlug];
    if (p) setForm({ title: p.title, body: p.body });
  }, [activeSlug, pages]);

  async function handleSavePage() {
    setSaving(true);
    try {
      await savePageContent(activeSlug, form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      await refreshPages();
    } finally {
      setSaving(false);
    }
  }

  async function addFaq() {
    if (!newFaq.question.trim() || !newFaq.answer.trim()) return;
    await saveFaq({ id: `f${Date.now()}`, question: newFaq.question, answer: newFaq.answer, order: faqs.length });
    setNewFaq({ question: "", answer: "" });
    await refreshFaqs();
  }

  async function updateFaqField(id: string, field: "question" | "answer", value: string) {
    setFaqs((prev) => prev.map((f) => (f.id === id ? { ...f, [field]: value } : f)));
  }

  async function saveFaqEdit(faq: FaqItem) {
    await saveFaq(faq);
    await refreshFaqs();
  }

  async function removeFaq(id: string) {
    await deleteFaq(id);
    await refreshFaqs();
  }

  async function moveFaq(index: number, direction: -1 | 1) {
    const next = [...faqs];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setFaqs(next);
    await reorderFaqs(next.map((f) => f.id));
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Pages</h1>
      <p className="text-sm text-gray-400 mt-1">Edit the content shown on your storefront's static pages and FAQ.</p>

      <div className="flex gap-2 mt-6">
        <button onClick={() => setTab("pages")} className={`px-4 py-2 rounded-full text-sm font-medium ${tab === "pages" ? "bg-ink text-white" : "bg-white shadow-card"}`}>Pages</button>
        <button onClick={() => setTab("faq")} className={`px-4 py-2 rounded-full text-sm font-medium ${tab === "faq" ? "bg-ink text-white" : "bg-white shadow-card"}`}>FAQ</button>
      </div>

      {tab === "pages" && (
        <div className="grid md:grid-cols-[220px_1fr] gap-4 mt-4">
          <div className="bg-white rounded-2xl shadow-card p-2 space-y-1 h-fit">
            {STATIC_PAGES.map((p) => (
              <button
                key={p.slug}
                onClick={() => setActiveSlug(p.slug)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium ${activeSlug === p.slug ? "bg-ink text-white" : "hover:bg-bg"}`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-2xl shadow-card p-5">
            {loading ? (
              <p className="text-sm text-gray-400">Loading...</p>
            ) : (
              <div className="space-y-3">
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Page title"
                  className="w-full bg-bg rounded-2xl px-4 py-3 text-sm font-semibold outline-none"
                />
                <textarea
                  value={form.body}
                  onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                  placeholder="Page content — leave a blank line between paragraphs"
                  rows={14}
                  className="w-full bg-bg rounded-2xl px-4 py-3 text-sm outline-none resize-none"
                />
                <button onClick={handleSavePage} disabled={saving} className="w-full bg-ink text-white font-semibold py-3 rounded-full text-sm disabled:opacity-50">
                  {saving ? "Saving..." : "Save Page"}
                </button>
                {saved && <p className="text-xs text-green-600 text-center">Saved — live on the storefront now.</p>}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "faq" && (
        <div className="bg-white rounded-2xl shadow-card p-5 mt-4 max-w-2xl space-y-4">
          {faqLoading ? (
            <p className="text-sm text-gray-400">Loading...</p>
          ) : (
            <>
              {faqs.map((faq, i) => (
                <div key={faq.id} className="border border-black/5 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col">
                      <button onClick={() => moveFaq(i, -1)} disabled={i === 0} className="disabled:opacity-30"><ChevronUp size={14} /></button>
                      <button onClick={() => moveFaq(i, 1)} disabled={i === faqs.length - 1} className="disabled:opacity-30"><ChevronDown size={14} /></button>
                    </div>
                    <input
                      value={faq.question}
                      onChange={(e) => updateFaqField(faq.id, "question", e.target.value)}
                      onBlur={() => saveFaqEdit(faqs.find((f) => f.id === faq.id)!)}
                      placeholder="Question"
                      className="flex-1 bg-bg rounded-xl px-3 py-2 text-sm font-medium outline-none"
                    />
                    <button onClick={() => removeFaq(faq.id)} className="w-8 h-8 rounded-full bg-bg flex items-center justify-center text-accent shrink-0"><Trash2 size={13} /></button>
                  </div>
                  <textarea
                    value={faq.answer}
                    onChange={(e) => updateFaqField(faq.id, "answer", e.target.value)}
                    onBlur={() => saveFaqEdit(faqs.find((f) => f.id === faq.id)!)}
                    placeholder="Answer"
                    rows={2}
                    className="w-full bg-bg rounded-xl px-3 py-2 text-sm outline-none resize-none ml-6"
                  />
                </div>
              ))}

              <div className="border border-dashed border-black/15 rounded-2xl p-4 space-y-2">
                <input
                  value={newFaq.question}
                  onChange={(e) => setNewFaq((f) => ({ ...f, question: e.target.value }))}
                  placeholder="New question"
                  className="w-full bg-bg rounded-xl px-3 py-2 text-sm outline-none"
                />
                <textarea
                  value={newFaq.answer}
                  onChange={(e) => setNewFaq((f) => ({ ...f, answer: e.target.value }))}
                  placeholder="Answer"
                  rows={2}
                  className="w-full bg-bg rounded-xl px-3 py-2 text-sm outline-none resize-none"
                />
                <button onClick={addFaq} className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                  <Plus size={14} /> Add FAQ
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
