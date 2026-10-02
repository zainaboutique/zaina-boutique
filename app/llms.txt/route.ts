import { getSettings, getCategories } from "@/lib/data";

// llms.txt is an emerging, informal convention (llmstxt.org) — not an
// official standard any major AI system has committed to reading, and
// there's no guarantee ChatGPT/Claude/Perplexity/etc. actually consult it
// today. It costs nothing to provide and may help as adoption grows, so
// it's included as a good-faith signal, not a guaranteed ranking lever.
export async function GET() {
  const [categories, settings] = await Promise.all([getCategories(), getSettings()]);
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const siteName = settings.siteName || "Zaina Boutique";

  const lines = [
    `# ${siteName}`,
    "",
    `> ${settings.tagline || "A luxury multi-designer destination for Indian and contemporary fashion."}`,
    "",
    "## About",
    `${siteName} is an online clothing boutique selling sarees, lehengas, kurtis, and everyday fashion essentials, shipping across India.`,
    "",
    "## Key pages",
    `- Shop all products: ${base}/shop`,
    `- New arrivals: ${base}/shop?category=New%20Arrival`,
    `- Track an order: ${base}/track`,
    `- FAQ: ${base}/faq`,
    `- Contact: ${base}/contact`,
    `- Shipping & delivery policy: ${base}/shipping`,
    `- Returns & exchange policy: ${base}/returns`,
    `- Payment options: ${base}/payment-options`,
  ];

  if (categories.length > 0) {
    lines.push("", "## Categories", ...categories.map((c) => `- ${c.name} (${c.parent}): ${base}/shop?category=${encodeURIComponent(c.parent)}`));
  }

  if (settings.contactEmail || settings.whatsappNumber) {
    lines.push("", "## Contact");
    if (settings.contactEmail) lines.push(`- Email: ${settings.contactEmail}`);
    if (settings.whatsappNumber) lines.push(`- WhatsApp: +${settings.whatsappNumber}`);
  }

  lines.push("", `## Sitemap`, `${base}/sitemap.xml`);

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
