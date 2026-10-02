import { Inter, Poppins, Playfair_Display, Montserrat, Lora, Raleway } from "next/font/google";

// Separate from app/layout.tsx's font loading. Next.js's font optimization
// works via a build-time plugin, so calling these functions again here (with
// identical arguments) is supported and resolves to the same underlying
// font — it does NOT double-load anything at runtime.
//
// This exists specifically so the Logo Text Font setting can apply a font by
// its real, generated class name directly to the header/footer wordmark,
// rather than through a CSS custom property that references another CSS
// custom property (which turned out to be unreliable in practice — the
// class-based approach below is the more direct, dependable mechanism).
const inter = Inter({ subsets: ["latin"] });
const poppins = Poppins({ subsets: ["latin"], weight: ["500", "600"] });
const playfair = Playfair_Display({ subsets: ["latin"] });
const montserrat = Montserrat({ subsets: ["latin"] });
const lora = Lora({ subsets: ["latin"] });
const raleway = Raleway({ subsets: ["latin"] });

export const LOGO_FONT_CLASSES: Record<string, string> = {
  inter: inter.className,
  poppins: poppins.className,
  playfair: playfair.className,
  montserrat: montserrat.className,
  lora: lora.className,
  raleway: raleway.className,
};

export function getLogoFontClassName(key: string): string {
  return LOGO_FONT_CLASSES[key] || LOGO_FONT_CLASSES.raleway;
}
