// Removes the emergency "unoptimized: true" line from next.config (it would
// switch off the new, size-aware image loading). Safe to run if it isn't there.
// Run from the sky-store folder:  node scripts/patch-next-restore-images.js
const fs = require("fs");
const path = require("path");

const name = ["next.config.js", "next.config.mjs"].find((n) => fs.existsSync(path.join(__dirname, "..", n)));
if (!name) {
  console.log("Could not find next.config.js. Nothing was changed.");
  process.exit(1);
}
const file = path.join(__dirname, "..", name);
let text = fs.readFileSync(file, "utf8");
const crlf = text.includes("\r\n");
text = text.replace(/\r\n/g, "\n");

const line = /^[ \t]*unoptimized:\s*true,[^\n]*\n/m;
if (!line.test(text)) {
  console.log("No emergency line found - nothing to remove. All good.");
  process.exit(0);
}
text = text.replace(line, "");
if (crlf) text = text.replace(/\n/g, "\r\n");
fs.writeFileSync(file, text, "utf8");
console.log(`Done. The emergency line was removed from ${name}.`);
