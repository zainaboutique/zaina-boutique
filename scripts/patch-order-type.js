// Adds the "pincode" field to the Order type in lib/types.ts.
// Run from the sky-store folder:  node scripts/patch-order-type.js
const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "..", "lib", "types.ts");
let text = fs.readFileSync(file, "utf8");
const crlf = text.includes("\r\n");
text = text.replace(/\r\n/g, "\n");

if (/\n\s*pincode\?: string;/.test(text)) {
  console.log("Already fixed. Nothing to do.");
  process.exit(0);
}

const anchor = "  state?: string; // optional for orders placed before this field existed\n";
if (!text.includes(anchor)) {
  console.log("Could not find the line to change. lib/types.ts was NOT modified.");
  console.log("Send me a screenshot of this message.");
  process.exit(1);
}

text = text.replace(anchor, anchor + "  pincode?: string; // 6-digit delivery PIN code, collected at checkout\n");
if (crlf) text = text.replace(/\n/g, "\r\n");
fs.writeFileSync(file, text, "utf8");
console.log("Done. lib/types.ts was updated.");
