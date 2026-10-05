// EMERGENCY: turns off Vercel's own image processing (the part that is over
// the free limit). Photos still come through the free wsrv.nl service.
// Run from the sky-store folder:  node scripts/patch-next-unoptimized.js
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

if (/unoptimized\s*:\s*true/.test(text)) {
  console.log("Already switched off. Nothing to do.");
  process.exit(0);
}
const m = text.match(/^([ \t]*)images:\s*\{[ \t]*\n/m);
if (!m) {
  console.log("Could not find the images section in next.config. Nothing was changed.");
  console.log("Send me a screenshot of this message.");
  process.exit(1);
}
const indent = m[1] + "  ";
text = text.replace(
  m[0],
  m[0] + `${indent}unoptimized: true, // Vercel's image processing is off; wsrv.nl serves the photos\n`
);
if (crlf) text = text.replace(/\n/g, "\r\n");
fs.writeFileSync(file, text, "utf8");
console.log(`Done. ${name} was updated: Vercel image processing is now off.`);
