export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ---------- Currency ----------
// Site currency is INR (₹). Change here if you localize to another market.
export function formatPrice(amount: number): string {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

// ---------- WebP delivery via wsrv.nl (formerly images.weserv.nl — same free
// image proxy/CDN service; the old images.weserv.nl hostname got rate-limited
// after a 2022 Cloudflare policy change, so wsrv.nl is the current, reliable
// domain for the same service) ----------
// Wraps any publicly-reachable image URL so it's served as WebP. Safely
// no-ops for anything the proxy can't fetch — data: URLs (demo-mode uploads
// before Firebase is connected) and local /public paths — since those are
// returned unchanged rather than broken.
export function toWebp(url: string, opts?: { width?: number; quality?: number }): string {
  if (!url) return url;
  if (url.startsWith("data:")) return url; // proxy can't fetch a data URL
  if (url.startsWith("/")) return url; // local /public asset, not publicly fetchable pre-deploy
  if (url.includes("wsrv.nl") || url.includes("weserv.nl")) return url; // already wrapped

  const params = new URLSearchParams({ url, output: "webp" });
  if (opts?.width) params.set("w", String(opts.width));
  params.set("q", String(opts?.quality ?? 80));
  return `https://wsrv.nl/?${params.toString()}`;
}

// ---------- Slugs ----------
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// ---------- localStorage-backed demo persistence ----------
// Used by lib/data.ts when Firebase isn't configured, so admin edits and
// customer orders survive a page refresh within the same browser. This is
// a local-testing convenience only — it does not sync across devices or
// browsers. Connect Firebase for real, shared persistence.
export function readLocal<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeLocal<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable (e.g. private browsing) — fail silently,
    // matching the rest of this demo-mode persistence layer.
  }
}

// ---------- CSV parsing (handles quoted commas AND embedded newlines) ----------
// A naive split-by-line-then-split-by-comma approach breaks on any field that
// contains a literal newline inside quotes (e.g. a multi-paragraph product
// description) — this scans the whole text character-by-character instead,
// tracking quote state, so newlines inside quotes don't end a row early.
export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  // Normalize line endings up front, and strip a leading BOM (common in
  // CSVs exported from Excel/Firestore consoles) which would otherwise
  // corrupt the first header's name.
  const normalized = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");

  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];
    const next = normalized[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        cell += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  // Final cell/row (files not ending in a trailing newline).
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  const nonEmptyRows = rows.filter((r) => r.some((c) => c.trim().length > 0));
  if (nonEmptyRows.length < 2) return [];

  const headers = nonEmptyRows[0].map((h) => h.trim().toLowerCase());
  return nonEmptyRows.slice(1).map((cells) => {
    const record: Record<string, string> = {};
    headers.forEach((h, i) => (record[h] = (cells[i] ?? "").trim()));
    return record;
  });
}
