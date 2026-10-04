// 1) Adds an "Includes" field to products (type + admin form).
// 2) Hides an empty size in the cart and in the order-tracking page.
// Run from the sky-store folder:  node scripts/patch-includes-and-sizes.js
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
let problems = 0;

function patchFile(relPath, label, edits) {
  const file = path.join(root, relPath);
  if (!fs.existsSync(file)) {
    console.log(`SKIPPED  ${label}: file not found (${relPath})`);
    problems++;
    return;
  }
  let text = fs.readFileSync(file, "utf8");
  const crlf = text.includes("\r\n");
  text = text.replace(/\r\n/g, "\n");

  if (edits.every((e) => e.done(text))) {
    console.log(`already done  ${label}`);
    return;
  }
  for (const e of edits) {
    if (!e.done(text) && !e.canApply(text)) {
      console.log(`NOT CHANGED  ${label}: could not find "${e.name}"`);
      problems++;
      return;
    }
  }
  for (const e of edits) if (!e.done(text)) text = e.apply(text);

  if (crlf) text = text.replace(/\n/g, "\r\n");
  fs.writeFileSync(file, text, "utf8");
  console.log(`updated  ${label}`);
}

const replaceEdit = (name, oldStr, newStr, doneMarker) => ({
  name,
  done: (t) => t.includes(doneMarker),
  canApply: (t) => t.includes(oldStr),
  apply: (t) => t.replace(oldStr, newStr),
});

// ---- 1a. the product type ----
patchFile("lib/types.ts", "lib/types.ts (Includes field)", [
  replaceEdit(
    "care?: string; in ProductDetails",
    "  care?: string;\n}",
    '  care?: string;\n  includes?: string; // what comes with it, e.g. "Saree and blouse piece"\n}',
    "includes?: string;"
  ),
]);

// ---- 1b. the admin product form ----
patchFile("app/admin/products/page.tsx", "admin products form (Includes field)", [
  replaceEdit("emptyForm care", '  care: "",\n};', '  care: "",\n  includes: "",\n};', 'includes: "",'),
  replaceEdit(
    "openEdit care",
    '      care: p.details?.care ?? "",\n',
    '      care: p.details?.care ?? "",\n      includes: (p.details as { includes?: string } | undefined)?.includes ?? "",\n',
    "(p.details as { includes?: string } | undefined)?.includes"
  ),
  replaceEdit(
    "details payload",
    "details: { material: form.material, fit: form.fit, care: form.care },",
    "details: { material: form.material, fit: form.fit, care: form.care, includes: form.includes },",
    "includes: form.includes }"
  ),
  {
    name: "Care instructions input",
    done: (t) => t.includes('placeholder="Includes'),
    canApply: (t) => /<input placeholder="Care instructions"[^\n]*\n\s*<\/div>\n/.test(t),
    apply: (t) =>
      t.replace(
        /(<input placeholder="Care instructions"[^\n]*\n\s*<\/div>\n)/,
        `$1              <input placeholder="Includes (e.g. Saree + blouse piece)" value={form.includes} onChange={(e) => setForm((f) => ({ ...f, includes: e.target.value }))} className="w-full bg-bg rounded-2xl px-4 py-3 text-sm outline-none" />\n`
      ),
  },
]);

// ---- 2a. cart: no "Size:" when there is no size ----
patchFile("components/CartDrawer.tsx", "cart (hide empty size)", [
  replaceEdit(
    "Size line in the cart",
    'Size: {item.size}{item.color ? ` · Color: ${item.color}` : ""}',
    '{[item.size ? `Size: ${item.size}` : "", item.color ? `Color: ${item.color}` : ""].filter(Boolean).join(" · ")}',
    '.filter(Boolean).join(" · ")'
  ),
]);

// ---- 2b. order tracking: no empty brackets ----
patchFile("app/track/TrackClient.tsx", "order tracking (hide empty size)", [
  replaceEdit(
    "item line in the tracking page",
    '({item.size}{item.color ? `, ${item.color}` : ""}) × {item.quantity}',
    '{(item.size || item.color) && `(${[item.size, item.color].filter(Boolean).join(", ")}) `}× {item.quantity}',
    '.filter(Boolean).join(", ")}) `}'
  ),
]);

console.log(problems ? `\n${problems} file(s) were NOT changed - send me a screenshot of this.` : "\nAll done.");
process.exit(problems ? 1 : 0);
