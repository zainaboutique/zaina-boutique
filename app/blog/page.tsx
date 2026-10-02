import type { Metadata } from "next";
import BlogListClient from "./BlogListClient";

export const metadata: Metadata = {
  title: "Journal — Style Guides & Fashion Stories",
  description: "Style notes, styling guides, and stories from Zaina Boutique — fashion inspiration, fabric guides, and what's new each season.",
  alternates: { canonical: "/blog" },
};

export default function BlogPage() {
  return <BlogListClient />;
}
