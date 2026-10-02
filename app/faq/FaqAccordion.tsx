"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { FaqItem } from "@/lib/types";

export default function FaqAccordion({ faqs }: { faqs: FaqItem[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      {faqs.map((faq) => (
        <div key={faq.id} className="bg-card rounded-2xl shadow-card overflow-hidden">
          <button
            onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
            className="w-full flex items-center justify-between px-4 py-4 text-left text-sm font-semibold"
          >
            {faq.question}
            <ChevronDown size={16} className={`shrink-0 ml-3 transition-transform ${openId === faq.id ? "rotate-180" : ""}`} />
          </button>
          {openId === faq.id && (
            <p className="px-4 pb-4 text-sm text-gray-500 leading-relaxed">{faq.answer}</p>
          )}
        </div>
      ))}
      {faqs.length === 0 && <p className="text-sm text-gray-400">No FAQs added yet.</p>}
    </div>
  );
}
