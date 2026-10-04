import type { Metadata } from "next";
import { getPageContent } from "@/lib/data";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  // The meta title/description are intentionally NOT built from the admin's
  // live content.title/body — those can be edited to anything (including
  // very short placeholder text), which would push the actual rendered
  // title/description tags out of the 50-60 / 120-180 character ranges that
  // read well in a Google search result. The on-page H1 heading below still
  // always reflects the admin's current title and body exactly.
  return {
    title: "Shipping & Delivery Information Guide",
    description: "Everything you need to know about Zaina Boutique's shipping times, delivery areas, and order tracking — fast, reliable delivery across India.",
    alternates: { canonical: "/shipping" },
  };
}

export default async function Page() {
  const content = await getPageContent("shipping");
  return (
    <div className="min-h-screen bg-bg pb-8">
      <div className="max-w-2xl mx-auto px-4 pt-10">
        <h1 className="text-2xl font-bold mb-4">{content.title}</h1>
        {content.body.split("\n\n").map((para, i) => (
          <p key={i} className="text-sm text-gray-500 leading-relaxed mb-4 whitespace-pre-line">{para}</p>
        ))}
      </div>
    </div>
  );
}
