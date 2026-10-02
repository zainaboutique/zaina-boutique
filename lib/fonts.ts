// Curated set of self-hosted Google Fonts admins can pick between for
// site-wide branding. Each entry's `cssVar` matches a variable registered
// in app/layout.tsx via next/font/google, so switching fonts never causes
// a network request at runtime — every option is already loaded.
export interface FontOption {
  key: string;
  label: string;
  cssVar: string; // e.g. "--font-inter"
  previewStack: string; // fallback stack for contexts before the var loads
}

export const FONT_OPTIONS: FontOption[] = [
  { key: "inter", label: "Inter (Clean Sans-Serif)", cssVar: "--font-inter", previewStack: "Inter, sans-serif" },
  { key: "poppins", label: "Poppins (Modern Geometric)", cssVar: "--font-poppins", previewStack: "Poppins, sans-serif" },
  { key: "playfair", label: "Playfair Display (Elegant Serif)", cssVar: "--font-playfair", previewStack: "'Playfair Display', serif" },
  { key: "montserrat", label: "Montserrat (Bold Sans)", cssVar: "--font-montserrat", previewStack: "Montserrat, sans-serif" },
  { key: "lora", label: "Lora (Readable Serif)", cssVar: "--font-lora", previewStack: "Lora, serif" },
  { key: "raleway", label: "Raleway (Thin & Elegant)", cssVar: "--font-raleway", previewStack: "Raleway, sans-serif" },
];

export function getFontOption(key: string): FontOption {
  return FONT_OPTIONS.find((f) => f.key === key) || FONT_OPTIONS[0];
}
