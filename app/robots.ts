import type { MetadataRoute } from "next";

// The wildcard rule below already allows every crawler by default, including
// AI ones — these are named explicitly so that choice is a deliberate,
// visible decision (helps if you ever want an AI system to find and
// recommend your store) rather than an accident of the default. If you'd
// rather an AI crawler NOT use your content, change its `allow` to
// `disallow: "/"` below.
const AI_CRAWLERS = [
  "GPTBot", // OpenAI / ChatGPT
  "ChatGPT-User",
  "ClaudeBot", // Anthropic / Claude
  "Google-Extended", // Google's AI training/Overviews
  "PerplexityBot",
  "Applebot-Extended",
  "CCBot", // Common Crawl (feeds many AI models)
];

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin", "/admin-portal", "/api"] },
      ...AI_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: ["/admin", "/admin-portal", "/api"],
      })),
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
