import type { Metadata } from "next";
import { getFaqs } from "@/lib/data";
import FaqAccordion from "./FaqAccordion";

export const metadata: Metadata = {
  title: "Frequently Asked Questions & Order Help",
  description: "Answers to common questions about ordering, delivery, payments, and returns at Zaina Boutique — everything you need before and after you order.",
  alternates: { canonical: "/faq" },
};

export default async function FaqPage() {
  const faqs = await getFaqs();

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  return (
    <div className="min-h-screen bg-bg pb-28 md:pb-12">
      {faqs.length > 0 && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}
      <div className="max-w-2xl mx-auto px-4 pt-10">
        <h1 className="text-2xl font-bold mb-6">Frequently Asked Questions</h1>
        <FaqAccordion faqs={faqs} />
      </div>
    </div>
  );
}
