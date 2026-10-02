"use client";

import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";
import type { Settings } from "@/lib/types";

export function buildWhatsAppLink(phone: string, message: string): string {
  const digits = phone.replace(/[^\d]/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export default function WhatsAppButton({ settings }: { settings: Settings }) {
  const pathname = usePathname();
  if (!settings.whatsappNumber) return null;

  // Product pages have their own floating Add to Bag bar in this same
  // bottom-right area on mobile — sit above it there instead of overlapping.
  const isProductPage = pathname?.startsWith("/product/");

  const link = buildWhatsAppLink(settings.whatsappNumber, "Hi Zaina Boutique! I'd like to place an order.");

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Order on WhatsApp"
      className={`fixed right-4 md:bottom-6 z-40 w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center shadow-dock ${isProductPage ? "bottom-44" : "bottom-24"}`}
    >
      <MessageCircle size={22} />
    </a>
  );
}
