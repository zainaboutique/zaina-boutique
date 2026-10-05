// Stops your site from processing images from ANY website (which anyone could
// use to burn through your Vercel image allowance). Only your own image
// sources stay allowed.
// Run from the sky-store folder:  node scripts/patch-next-images.js
const fs = require("fs");
const path = require("path");

const candidates = ["next.config.js", "next.config.mjs"];
const name = candidates.find((n) => fs.existsSync(path.join(__dirname, "..", n)));
if (!name) {
  console.log("Could not find next.config.js. Nothing was changed.");
  process.exit(1);
}
const file = path.join(__dirname, "..", name);
let text = fs.readFileSync(file, "utf8");
const crlf = text.includes("\r\n");
text = text.replace(/\r\n/g, "\n");

const open = /^([ \t]*)\{ protocol: "https", hostname: "\*\*" \},[ \t]*\n/m;
if (!open.test(text)) {
  console.log("The open image rule is not there (already fixed?). Nothing was changed.");
  process.exit(0);
}

text = text.replace(open, (_m, indent) =>
  `${indent}{ protocol: "https", hostname: "wsrv.nl" },\n` +
  `${indent}{ protocol: "https", hostname: "lh3.googleusercontent.com" },\n`
);

if (crlf) text = text.replace(/\n/g, "\r\n");
fs.writeFileSync(file, text, "utf8");
console.log(`Done. ${name} was updated: images are now accepted only from Firebase, Unsplash, wsrv.nl and Google profile photos.`);
