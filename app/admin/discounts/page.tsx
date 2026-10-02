"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/utils";
import { Plus, Trash2, X } from "lucide-react";
import { getDiscounts, createDiscount, updateDiscount, deleteDiscount } from "@/lib/data";
import type { Discount } from "@/lib/types";

const emptyForm = { code: "", type: "percent" as "percent" | "amount", value: "", active: true };

export default function AdminDiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function refresh() {
    setLoading(true);
    setDiscounts(await getDiscounts());
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createDiscount({ code: form.code.toUpperCase(), type: form.type, value: Number(form.value), active: form.active });
      setForm(emptyForm);
      setModalOpen(false);
      await refresh();
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(d: Discount) {
    await updateDiscount(d.id, { active: !d.active });
    await refresh();
  }

  async function remove(id: string) {
    await deleteDiscount(id);
    await refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Discounts</h1>
          <p className="text-sm text-gray-400 mt-1">Create promo codes customers can apply at checkout.</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="flex items-center gap-1.5 bg-ink text-white text-sm font-semibold px-4 py-2.5 rounded-full">
          <Plus size={16} /> Add Discount
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-card mt-6 overflow-x-auto">
        <table className="w-full text-sm min-w-[480px]">
          <thead>
            <tr className="text-left text-gray-400 border-b border-black/5">
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Value</th>
              <th className="px-4 py-3 font-medium">Active</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400">Loading...</td></tr>
            ) : discounts.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400">No discount codes yet.</td></tr>
            ) : (
              discounts.map((d) => (
                <tr key={d.id} className="border-b border-black/5 last:border-0">
                  <td className="px-4 py-3 font-mono font-semibold">{d.code}</td>
                  <td className="px-4 py-3">{d.type === "percent" ? `${d.value}%` : `${formatPrice(d.value)}`} off</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(d)} className={`text-xs font-semibold px-2.5 py-1 rounded-full ${d.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {d.active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => remove(d.id)} className="w-8 h-8 rounded-full bg-bg flex items-center justify-center text-accent"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white w-full md:max-w-sm md:rounded-3xl rounded-t-3xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-black/5">
              <h2 className="font-bold text-lg">Add Discount</h2>
              <button onClick={() => setModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
              <input required placeholder="Code (e.g. WELCOME10)" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} className="w-full bg-bg rounded-2xl px-4 py-3 text-sm outline-none" />
              <div className="grid grid-cols-2 gap-3">
                <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as "percent" | "amount" }))} className="w-full bg-bg rounded-2xl px-4 py-3 text-sm outline-none">
                  <option value="percent">% Off</option>
                  <option value="amount">₹ Off</option>
                </select>
                <input required type="number" placeholder="Value" value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))} className="w-full bg-bg rounded-2xl px-4 py-3 text-sm outline-none" />
              </div>
              <button type="submit" disabled={saving} className="w-full bg-ink text-white font-semibold py-3.5 rounded-full disabled:opacity-50">
                {saving ? "Saving..." : "Add Discount"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
