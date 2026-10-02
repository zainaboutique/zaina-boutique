import type { Metadata } from "next";
import ShopClient from "./ShopClient";

export const metadata: Metadata = {
  title: "Shop Sarees, Lehengas, Kurtis & More",
  description: "Browse the full Zaina Boutique collection — sarees, lehengas, kurtis, and everyday essentials. Filter by category, occasion, or search to find exactly what you're looking for.",
  alternates: { canonical: "/shop" },
};

export default function ShopPage() {
  return <ShopClient />;
}
