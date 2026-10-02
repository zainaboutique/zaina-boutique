import type { Metadata } from "next";
import { MapPin } from "lucide-react";
import { getSettings } from "@/lib/data";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: "Store Locator — Visit Us In Person",
    description: `Find ${settings.siteName || "Zaina Boutique"}'s store location and visit us in person to browse our full collection of sarees, lehengas, kurtis, and more.`,
    alternates: { canonical: "/store-locator" },
  };
}

export default async function StoreLocatorPage() {
  const settings = await getSettings();
  return (
    <div className="min-h-screen bg-bg pb-8">
      <div className="max-w-2xl mx-auto px-4 pt-10">
        <h1 className="text-2xl font-bold mb-6">Store Locator</h1>
        {settings.address ? (
          <div className="flex items-center gap-3 bg-card rounded-2xl shadow-card p-4">
            <div className="w-10 h-10 rounded-full bg-bg flex items-center justify-center shrink-0"><MapPin size={16} /></div>
            <div>
              <p className="text-sm font-semibold">{settings.siteName}</p>
              <p className="text-sm text-gray-500">{settings.address}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No store location has been added yet.</p>
        )}
      </div>
    </div>
  );
}
