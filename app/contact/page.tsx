import type { Metadata } from "next";
import { Mail, MapPin, MessageCircle } from "lucide-react";
import { getSettings } from "@/lib/data";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: "Contact Us — Get in Touch With Our Team",
    description: `Get in touch with ${settings.siteName || "Zaina Boutique"} — reach us by email or WhatsApp, or find our store address. We're happy to help with orders, sizing, or anything else.`,
    alternates: { canonical: "/contact" },
  };
}

export default async function ContactPage() {
  const settings = await getSettings();
  return (
    <div className="min-h-screen bg-bg pb-28 md:pb-12">
      <div className="max-w-2xl mx-auto px-4 pt-10">
        <h1 className="text-2xl font-bold mb-6">Contact Us</h1>
        <div className="space-y-4">
          {settings.contactEmail && (
            <a href={`mailto:${settings.contactEmail}`} className="flex items-center gap-3 bg-card rounded-2xl shadow-card p-4">
              <div className="w-10 h-10 rounded-full bg-bg flex items-center justify-center"><Mail size={16} /></div>
              <div>
                <p className="text-sm font-semibold">Email</p>
                <p className="text-sm text-gray-500">{settings.contactEmail}</p>
              </div>
            </a>
          )}
          {settings.whatsappNumber && (
            <a href={`https://wa.me/${settings.whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-card rounded-2xl shadow-card p-4">
              <div className="w-10 h-10 rounded-full bg-bg flex items-center justify-center"><MessageCircle size={16} /></div>
              <div>
                <p className="text-sm font-semibold">WhatsApp</p>
                <p className="text-sm text-gray-500">+{settings.whatsappNumber}</p>
              </div>
            </a>
          )}
          {settings.address && (
            <div className="flex items-center gap-3 bg-card rounded-2xl shadow-card p-4">
              <div className="w-10 h-10 rounded-full bg-bg flex items-center justify-center"><MapPin size={16} /></div>
              <div>
                <p className="text-sm font-semibold">Address</p>
                <p className="text-sm text-gray-500">{settings.address}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
