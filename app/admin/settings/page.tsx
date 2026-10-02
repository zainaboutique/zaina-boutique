"use client";

import { useEffect, useState } from "react";
import Image from "@/components/OptimizedImage";
import { Plus, Trash2 } from "lucide-react";
import { getSettings, saveSettings } from "@/lib/data";
import { storage, isFirebaseConfigured } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { fileToDataUrl } from "@/lib/utils";
import { FONT_OPTIONS, getFontOption } from "@/lib/fonts";
import { getLogoFontClassName } from "@/lib/logo-fonts";
import type { Settings, FooterLink } from "@/lib/types";

const TABS = ["Branding", "Payments", "Contact", "Announcement", "Header & Footer"] as const;

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Branding");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fontUploading, setFontUploading] = useState(false);
  const [fontNameInput, setFontNameInput] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  async function handleLogoUpload(file: File, field: "logoUrl" | "logoMarkUrl") {
    if (!settings) return;
    setUploading(true);
    try {
      if (isFirebaseConfigured && storage) {
        const fileRef = ref(storage, `branding/${field}-${Date.now()}`);
        await uploadBytes(fileRef, file);
        setSettings({ ...settings, [field]: await getDownloadURL(fileRef) });
      } else {
        setSettings({ ...settings, [field]: await fileToDataUrl(file) });
      }
    } finally {
      setUploading(false);
    }
  }

  async function handleFontUpload(file: File) {
    if (!settings) return;
    setFontUploading(true);
    try {
      let url: string;
      if (isFirebaseConfigured && storage) {
        const fileRef = ref(storage, `branding/font-${Date.now()}-${file.name}`);
        await uploadBytes(fileRef, file);
        url = await getDownloadURL(fileRef);
      } else {
        url = await fileToDataUrl(file);
      }
      const name = fontNameInput.trim() || file.name.replace(/\.[^.]+$/, "");
      setSettings({ ...settings, customFontUrl: url, customFontName: name, fontFamily: "custom" });
    } finally {
      setFontUploading(false);
    }
  }

  function removeCustomFont() {
    if (!settings) return;
    const fallback = settings.fontFamily === "custom" ? FONT_OPTIONS[0].key : settings.fontFamily;
    setSettings({ ...settings, customFontUrl: undefined, customFontName: undefined, fontFamily: fallback });
  }

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    try {
      await saveSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  if (!settings) return <p className="text-sm text-gray-400">Loading...</p>;

  function updateHeaderLink(index: number, field: keyof FooterLink, value: string) {
    const links = [...settings!.headerLinks];
    links[index] = { ...links[index], [field]: value };
    setSettings({ ...settings!, headerLinks: links });
  }

  function updateFooterLink(colIndex: number, linkIndex: number, field: keyof FooterLink, value: string) {
    const columns = [...settings!.footerColumns];
    const links = [...columns[colIndex].links];
    links[linkIndex] = { ...links[linkIndex], [field]: value };
    columns[colIndex] = { ...columns[colIndex], links };
    setSettings({ ...settings!, footerColumns: columns });
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Settings</h1>
      <p className="text-sm text-gray-400 mt-1">Branding, contact info, announcement bar, and header/footer content.</p>

      <div className="flex gap-2 mt-6 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${tab === t ? "bg-ink text-white" : "bg-white shadow-card"}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-card p-5 mt-4 max-w-xl">
        {tab === "Branding" && (
          <div className="space-y-4">
            <input
              placeholder="Site name"
              value={settings.siteName}
              onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
              className="w-full bg-bg rounded-2xl px-4 py-3 text-sm outline-none"
            />
            <textarea
              placeholder="Tagline"
              value={settings.tagline}
              onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
              rows={2}
              className="w-full bg-bg rounded-2xl px-4 py-3 text-sm outline-none resize-none"
            />
            <div>
              <textarea
                placeholder="Meta description (shown in Google search results — separate from the tagline above)"
                value={settings.metaDescription || ""}
                onChange={(e) => setSettings({ ...settings, metaDescription: e.target.value })}
                rows={3}
                className="w-full bg-bg rounded-2xl px-4 py-3 text-sm outline-none resize-none"
              />
              <p className={`text-xs mt-1 ${(settings.metaDescription?.length || 0) > 0 && ((settings.metaDescription?.length || 0) < 120 || (settings.metaDescription?.length || 0) > 180) ? "text-accent" : "text-gray-400"}`}>
                {settings.metaDescription?.length || 0} characters — aim for 120–180. Leave blank to use the built-in default.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400 mb-2">Full Logo (used in footer)</p>
                {settings.logoUrl && (
                  <div className="relative w-full h-16 bg-ink rounded-lg overflow-hidden mb-2">
                    <Image src={settings.logoUrl} alt="logo" fill className="object-contain" sizes="200px" />
                  </div>
                )}
                <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0], "logoUrl")} className="text-xs" />
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-2">Logo Mark (used in header)</p>
                {settings.logoMarkUrl && (
                  <div className="relative w-16 h-16 bg-bg rounded-lg overflow-hidden mb-2">
                    <Image src={settings.logoMarkUrl} alt="logo mark" fill className="object-contain" sizes="64px" />
                  </div>
                )}
                <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0], "logoMarkUrl")} className="text-xs" />
              </div>
            </div>
            {uploading && <p className="text-xs text-gray-400">Uploading...</p>}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400 mb-2">Primary Color (text/ink)</p>
                <input type="color" value={settings.primaryColor} onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })} className="w-full h-11 rounded-xl cursor-pointer" />
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-2">Accent Color</p>
                <input type="color" value={settings.accentColor} onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })} className="w-full h-11 rounded-xl cursor-pointer" />
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-2">Website Font (body text, buttons)</p>
              <select
                value={settings.fontFamily}
                onChange={(e) => setSettings({ ...settings, fontFamily: e.target.value })}
                className="w-full bg-bg rounded-2xl px-4 py-3 text-sm outline-none"
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f.key} value={f.key}>{f.label}</option>
                ))}
                {settings.customFontUrl && (
                  <option value="custom">{settings.customFontName || "Custom"} (uploaded)</option>
                )}
              </select>
              <div
                className="mt-2 rounded-2xl bg-bg px-4 py-3 text-lg"
                style={
                  settings.fontFamily === "custom" && settings.customFontName
                    ? { fontFamily: `'${settings.customFontName}', sans-serif` }
                    : { fontFamily: `var(${getFontOption(settings.fontFamily).cssVar}, ${getFontOption(settings.fontFamily).previewStack})` }
                }
              >
                {settings.siteName || "Zaina Boutique"} — The quick brown fox jumps.
              </div>
            </div>

            <div className="pt-2">
              <p className="text-xs text-gray-400 mb-2">Logo Text Font (the wordmark next to your logo mark) — independent of the Website Font above</p>
              <select
                value={settings.logoFontFamily}
                onChange={(e) => setSettings({ ...settings, logoFontFamily: e.target.value })}
                className="w-full bg-bg rounded-2xl px-4 py-3 text-sm outline-none"
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f.key} value={f.key}>{f.label}</option>
                ))}
                {settings.customFontUrl && (
                  <option value="custom">{settings.customFontName || "Custom"} (uploaded)</option>
                )}
              </select>
              <div
                className={`mt-2 rounded-2xl bg-bg px-4 py-3 text-lg uppercase font-medium ${settings.logoFontFamily !== "custom" ? getLogoFontClassName(settings.logoFontFamily) : ""}`}
                style={
                  settings.logoFontFamily === "custom" && settings.customFontName
                    ? { fontFamily: `'${settings.customFontName}', sans-serif`, letterSpacing: "0.3em" }
                    : { letterSpacing: "0.3em" }
                }
              >
                {settings.siteName || "Zaina Boutique"}
              </div>
            </div>

              <div className="mt-4 pt-4 border-t border-black/5">
                <p className="text-xs text-gray-400 mb-2">Or import your own font file (.ttf, .otf, .woff, .woff2) — once uploaded, it becomes selectable in both dropdowns above</p>
                {settings.customFontUrl && (
                  <div className="flex items-center justify-between bg-bg rounded-2xl px-4 py-2.5 mb-2 text-sm">
                    <span>Uploaded: <strong>{settings.customFontName}</strong></span>
                    <button type="button" onClick={removeCustomFont} className="text-accent text-xs font-semibold">Remove</button>
                  </div>
                )}
                <input
                  placeholder="Font name to show in the list (optional)"
                  value={fontNameInput}
                  onChange={(e) => setFontNameInput(e.target.value)}
                  className="w-full bg-bg rounded-2xl px-4 py-2.5 text-sm outline-none mb-2"
                />
                <input
                  type="file"
                  accept=".ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2"
                  onChange={(e) => e.target.files?.[0] && handleFontUpload(e.target.files[0])}
                  className="text-xs w-full"
                />
                {fontUploading && <p className="text-xs text-gray-400 mt-1">Uploading font...</p>}
              </div>
          </div>
        )}

        {tab === "Payments" && (
          <div className="space-y-5">
            <label className="flex items-center justify-between gap-2 text-sm font-medium bg-bg rounded-2xl px-4 py-3">
              Cash on Delivery
              <input
                type="checkbox"
                checked={settings.payments.codEnabled}
                onChange={(e) => setSettings({ ...settings, payments: { ...settings.payments, codEnabled: e.target.checked } })}
              />
            </label>

            <label className="flex items-center justify-between gap-2 text-sm font-medium bg-bg rounded-2xl px-4 py-3">
              Razorpay (Cards, UPI, Netbanking &amp; more)
              <input
                type="checkbox"
                checked={settings.payments.razorpayEnabled}
                onChange={(e) => setSettings({ ...settings, payments: { ...settings.payments, razorpayEnabled: e.target.checked } })}
              />
            </label>

            <label className="flex items-center justify-between gap-2 text-sm font-medium bg-bg rounded-2xl px-4 py-3">
              Order via WhatsApp
              <input
                type="checkbox"
                checked={settings.payments.whatsappOrderEnabled}
                onChange={(e) => setSettings({ ...settings, payments: { ...settings.payments, whatsappOrderEnabled: e.target.checked } })}
              />
            </label>
            {settings.payments.whatsappOrderEnabled && !settings.whatsappNumber && (
              <p className="text-xs text-accent -mt-3">
                Set a WhatsApp number under the Contact tab for this to work.
              </p>
            )}

            <div>
              <p className="text-xs text-gray-400 mb-2">Razorpay Key ID (public — safe to store here)</p>
              <input
                value={settings.payments.razorpayKeyId || ""}
                onChange={(e) => setSettings({ ...settings, payments: { ...settings.payments, razorpayKeyId: e.target.value } })}
                placeholder="rzp_live_xxxxxxxxxxxx"
                className="w-full bg-bg rounded-2xl px-4 py-3 text-sm outline-none font-mono"
              />
            </div>

            <div className="rounded-2xl bg-bg px-4 py-3 text-xs text-gray-500 leading-relaxed">
              <p className="font-semibold text-ink mb-1">About the Key Secret</p>
              Razorpay&apos;s <strong>Key Secret</strong> is never entered here — it must be set as the
              <code className="mx-1 bg-white px-1.5 py-0.5 rounded">RAZORPAY_KEY_SECRET</code> environment
              variable on your server (locally in <code className="bg-white px-1.5 py-0.5 rounded">.env.local</code>,
              and in Vercel → Settings → Environment Variables). Storing a secret key in this database would let
              anyone with read access to your storefront see it, which would let them create fraudulent charges.
              See the README for full setup steps.
            </div>

            <div className="rounded-2xl bg-bg px-4 py-3 text-xs text-gray-500 leading-relaxed">
              <p className="font-semibold text-ink mb-1">About Order via WhatsApp</p>
              When a customer chooses this at checkout, their order is still recorded here in Admin → Order
              (Pending, no payment collected) and they're taken straight to WhatsApp with the order number,
              items, total, and delivery address pre-filled, sent to the number set in Settings → Contact.
            </div>
          </div>
        )}

        {tab === "Contact" && (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-400 mb-2">WhatsApp Order Number (digits only, with country code)</p>
              <input
                value={settings.whatsappNumber || ""}
                onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                placeholder="918344867027"
                className="w-full bg-bg rounded-2xl px-4 py-3 text-sm outline-none"
              />
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-2">Contact Email</p>
              <input
                type="email"
                value={settings.contactEmail || ""}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                placeholder="you@example.com"
                className="w-full bg-bg rounded-2xl px-4 py-3 text-sm outline-none"
              />
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-2">Store Address</p>
              <input
                value={settings.address || ""}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                placeholder="City, State, PIN"
                className="w-full bg-bg rounded-2xl px-4 py-3 text-sm outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                value={settings.socialLinks?.instagram || ""}
                onChange={(e) => setSettings({ ...settings, socialLinks: { ...settings.socialLinks, instagram: e.target.value } })}
                placeholder="Instagram URL"
                className="w-full bg-bg rounded-2xl px-4 py-3 text-sm outline-none"
              />
              <input
                value={settings.socialLinks?.facebook || ""}
                onChange={(e) => setSettings({ ...settings, socialLinks: { ...settings.socialLinks, facebook: e.target.value } })}
                placeholder="Facebook URL"
                className="w-full bg-bg rounded-2xl px-4 py-3 text-sm outline-none"
              />
            </div>
          </div>
        )}

        {tab === "Announcement" && (
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={settings.announcementEnabled} onChange={(e) => setSettings({ ...settings, announcementEnabled: e.target.checked })} />
              Show announcement bar
            </label>
            <input
              value={settings.announcementText}
              onChange={(e) => setSettings({ ...settings, announcementText: e.target.value })}
              placeholder="Announcement text"
              className="w-full bg-bg rounded-2xl px-4 py-3 text-sm outline-none"
            />
            <input
              value={settings.announcementHref || ""}
              onChange={(e) => setSettings({ ...settings, announcementHref: e.target.value })}
              placeholder="Link (e.g. /shop)"
              className="w-full bg-bg rounded-2xl px-4 py-3 text-sm outline-none"
            />
          </div>
        )}

        {tab === "Header & Footer" && (
          <div className="space-y-6">
            <div>
              <p className="text-sm font-semibold mb-2">Header Links</p>
              {settings.headerLinks.map((link, i) => (
                <div key={i} className="grid grid-cols-2 gap-2 mb-2">
                  <input value={link.label} onChange={(e) => updateHeaderLink(i, "label", e.target.value)} placeholder="Label" className="bg-bg rounded-xl px-3 py-2 text-sm outline-none" />
                  <input value={link.href} onChange={(e) => updateHeaderLink(i, "href", e.target.value)} placeholder="/path" className="bg-bg rounded-xl px-3 py-2 text-sm outline-none" />
                </div>
              ))}
              <button
                onClick={() => setSettings({ ...settings, headerLinks: [...settings.headerLinks, { label: "New Link", href: "/" }] })}
                className="flex items-center gap-1 text-xs font-semibold text-gray-500 mt-1"
              >
                <Plus size={12} /> Add link
              </button>
            </div>

            {settings.footerColumns.map((col, ci) => (
              <div key={ci}>
                <p className="text-sm font-semibold mb-2">{col.title}</p>
                {col.links.map((link, li) => (
                  <div key={li} className="grid grid-cols-[1fr_1fr_auto] gap-2 mb-2 items-center">
                    <input value={link.label} onChange={(e) => updateFooterLink(ci, li, "label", e.target.value)} placeholder="Label" className="bg-bg rounded-xl px-3 py-2 text-sm outline-none" />
                    <input value={link.href} onChange={(e) => updateFooterLink(ci, li, "href", e.target.value)} placeholder="/path" className="bg-bg rounded-xl px-3 py-2 text-sm outline-none" />
                    <button
                      onClick={() => {
                        const columns = [...settings.footerColumns];
                        columns[ci] = { ...columns[ci], links: columns[ci].links.filter((_, idx) => idx !== li) };
                        setSettings({ ...settings, footerColumns: columns });
                      }}
                      className="w-8 h-8 rounded-full bg-bg flex items-center justify-center text-accent"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const columns = [...settings.footerColumns];
                    columns[ci] = { ...columns[ci], links: [...columns[ci].links, { label: "New Link", href: "/" }] };
                    setSettings({ ...settings, footerColumns: columns });
                  }}
                  className="flex items-center gap-1 text-xs font-semibold text-gray-500"
                >
                  <Plus size={12} /> Add link
                </button>
              </div>
            ))}
          </div>
        )}

        <button onClick={handleSave} disabled={saving} className="w-full bg-ink text-white font-semibold py-3.5 rounded-full mt-6 disabled:opacity-50">
          {saving ? "Saving..." : "Save Settings"}
        </button>
        {saved && <p className="text-xs text-green-600 text-center mt-2">Settings updated.</p>}
      </div>
    </div>
  );
}
