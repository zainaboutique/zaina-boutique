// Fixes Track Order for signed-in customers by editing lib/data.ts.
// Run from the sky-store folder:  node scripts/patch-track-order.js
const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "..", "lib", "data.ts");
let text = fs.readFileSync(file, "utf8");
const crlf = text.includes("\r\n");
text = text.replace(/\r\n/g, "\n");

if (text.includes("auth?.currentUser?.email")) {
  console.log("Already fixed. Nothing to do.");
  process.exit(0);
}

const oldImport = 'import { db, isFirebaseConfigured } from "./firebase";';
const newImport = 'import { db, auth, isFirebaseConfigured } from "./firebase";';

const oldLookup =
`  if (isFirebaseConfigured && db) {
    const snap = await getDocs(query(collection(db, "orders"), where("orderNumber", "==", orderNumber.trim())));
    if (snap.empty) return null;`;
const newLookup =
`  if (isFirebaseConfigured && db) {
    const myEmail = auth?.currentUser?.email?.trim().toLowerCase();
    if (!myEmail) return null;
    const snap = await getDocs(
      query(
        collection(db, "orders"),
        where("orderNumber", "==", orderNumber.trim()),
        where("email", "==", myEmail)
      )
    );
    if (snap.empty) return null;`;

if (!text.includes(oldImport) || !text.includes(oldLookup)) {
  console.log("Could not find the lines to change. data.ts was NOT modified.");
  console.log("Send me a screenshot of this message.");
  process.exit(1);
}

text = text.replace(oldImport, newImport).replace(oldLookup, newLookup);
if (crlf) text = text.replace(/\n/g, "\r\n");
fs.writeFileSync(file, text, "utf8");
console.log("Done. lib/data.ts was updated.");
