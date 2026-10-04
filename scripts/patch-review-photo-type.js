// Adds an optional "photoUrl" to the Review type in lib/types.ts.
// Run from the sky-store folder:  node scripts/patch-review-photo-type.js
const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "..", "lib", "types.ts");
let text = fs.readFileSync(file, "utf8");
const crlf = text.includes("\r\n");
text = text.replace(/\r\n/g, "\n");

if (/photoUrl\?: string;/.test(text.slice(text.indexOf("export interface Review")))) {
  console.log("Already done. Nothing to do.");
  process.exit(0);
}
const anchor = "  text: string;\n  approved: boolean;\n";
if (!text.includes(anchor)) {
  console.log("Could not find the Review type. lib/types.ts was NOT modified.");
  console.log("Send me a screenshot of this message.");
  process.exit(1);
}
text = text.replace(anchor, anchor + "  photoUrl?: string; // optional photo, added by the admin with a happy-customer review\n");
if (crlf) text = text.replace(/\n/g, "\r\n");
fs.writeFileSync(file, text, "utf8");
console.log("Done. lib/types.ts was updated.");
