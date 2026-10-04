// Makes the policy/info pages refresh themselves every 5 minutes, so edits
// made in Admin -> Pages show up without a redeploy.
// Run from the sky-store folder:  node scripts/patch-pages-refresh.js
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const PAGES = ["about", "shipping", "returns", "payment-options", "size-guide", "terms", "privacy", "faq"];
const LINE = "export const revalidate = 300;";
let changed = 0, problems = 0;

for (const name of PAGES) {
  const rel = `app/${name}/page.tsx`;
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) { console.log(`not found      ${rel}`); continue; }

  let text = fs.readFileSync(file, "utf8");
  const crlf = text.includes("\r\n");
  text = text.replace(/\r\n/g, "\n");

  if (/^\s*["']use client["']/.test(text)) {
    console.log(`skipped        ${rel} (loads its content in the browser already)`);
    continue;
  }
  if (/export const (revalidate|dynamic)\b/.test(text)) {
    console.log(`already set    ${rel}`);
    continue;
  }

  // insert right after the last import statement
  const lines = text.split("\n");
  let last = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^import\b.*;\s*$/.test(lines[i]) || /^\}\s*from\s+["'].*["'];\s*$/.test(lines[i])) last = i;
  }
  if (last === -1) {
    console.log(`NOT CHANGED    ${rel} (could not find where the imports end)`);
    problems++;
    continue;
  }
  lines.splice(last + 1, 0, "", LINE);
  let out = lines.join("\n");
  if (crlf) out = out.replace(/\n/g, "\r\n");
  fs.writeFileSync(file, out, "utf8");
  console.log(`updated        ${rel}`);
  changed++;
}

console.log(`\n${changed} page(s) updated.` + (problems ? ` ${problems} NOT changed - send me a screenshot of this.` : ""));
process.exit(problems ? 1 : 0);
