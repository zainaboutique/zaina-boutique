// One-time migration helper — NOT part of the running website.
//
// Takes your backed-up product photos (named like "Product Name_1.jpg",
// "Product Name_2.jpg", ...) and your exported product CSV, uploads each
// photo to Firebase Storage, and writes out a NEW CSV with the "Images"
// column automatically filled in with the correct links for each product,
// in the right order — ready to import via Admin -> Product -> Import CSV.
//
// Your original CSV and your local image files are never modified.
//
// ---------------------------------------------------------------------
// SETUP (one time only):
//
// 1. Open a terminal in this project's folder (the one with package.json)
//    and run:
//      npm install firebase-admin
//
// 2. Get a Firebase Admin key:
//    Firebase Console -> (gear icon) Project Settings -> Service Accounts
//    -> "Generate new private key" -> it downloads a .json file.
//    Rename that downloaded file to exactly: serviceAccountKey.json
//    and move it into this project's main folder (next to package.json).
//
//    IMPORTANT: this file grants full admin access to your Firebase
//    project. Never upload it anywhere public, never commit it to GitHub
//    (it's already covered by .gitignore's *.json rule if you placed it
//    at the project root — double check before pushing).
//
// 3. Edit the three lines below under CONFIG to match your computer.
//
// 4. Run:
//      node scripts/migrate-images.js
//
// ---------------------------------------------------------------------

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const admin = require("firebase-admin");

// ========================= CONFIG — edit these three lines =========================
const IMAGE_FOLDER = "C:\\Users\\dell\\Downloads\\New folder\\zaina boutique product image";
const CSV_PATH = "C:\\Users\\dell\\Downloads\\zaina-products-2026-09-28.csv";
const SERVICE_ACCOUNT_PATH = path.join(__dirname, "..", "serviceAccountKey.json");
// =====================================================================================

if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
  console.error(`\nCan't find serviceAccountKey.json at: ${SERVICE_ACCOUNT_PATH}`);
  console.error("See step 2 in the comment at the top of this file.\n");
  process.exit(1);
}
if (!fs.existsSync(IMAGE_FOLDER)) {
  console.error(`\nCan't find the image folder: ${IMAGE_FOLDER}`);
  console.error("Update IMAGE_FOLDER in the CONFIG section of this file.\n");
  process.exit(1);
}
if (!fs.existsSync(CSV_PATH)) {
  console.error(`\nCan't find the CSV file: ${CSV_PATH}`);
  console.error("Update CSV_PATH in the CONFIG section of this file.\n");
  process.exit(1);
}

const serviceAccount = require(SERVICE_ACCOUNT_PATH);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: `${serviceAccount.project_id}.appspot.com`,
});
const bucket = admin.storage().bucket();

// ---------- Minimal RFC 4180 CSV parser/writer (handles the multi-line, multi-paragraph descriptions in your export) ----------
function parseCsv(text) {
  const rows = [];
  let row = [], cell = "", inQuotes = false;
  const s = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
  for (let i = 0; i < s.length; i++) {
    const c = s[i], next = s[i + 1];
    if (inQuotes) {
      if (c === '"' && next === '"') { cell += '"'; i++; }
      else if (c === '"') { inQuotes = false; }
      else cell += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(cell); cell = "";
    } else if (c === "\n") {
      row.push(cell); rows.push(row); row = []; cell = "";
    } else {
      cell += c;
    }
  }
  if (cell.length > 0 || row.length > 0) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim().length > 0));
}

function csvEscape(value) {
  const v = String(value ?? "");
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

function writeCsv(rows) {
  return rows.map((r) => r.map(csvEscape).join(",")).join("\r\n");
}

async function uploadOne(localPath, destPath) {
  const ext = path.extname(localPath).toLowerCase().replace(".", "");
  const contentType = ext === "jpg" ? "image/jpeg" : `image/${ext}`;
  const token = crypto.randomUUID();
  await bucket.upload(localPath, {
    destination: destPath,
    metadata: { contentType, metadata: { firebaseStorageDownloadTokens: token } },
  });
  // Same URL format Firebase's own client SDK produces (getDownloadURL) —
  // matches every other image already stored by this app, and never expires.
  const encodedPath = encodeURIComponent(destPath);
  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media&token=${token}`;
}

async function main() {
  console.log("Reading CSV...");
  const csvText = fs.readFileSync(CSV_PATH, "utf8");
  const allRows = parseCsv(csvText);
  const header = allRows[0];
  const nameCol = header.findIndex((h) => h.trim().toLowerCase() === "name");
  const imagesCol = header.findIndex((h) => h.trim().toLowerCase() === "images");
  if (nameCol === -1 || imagesCol === -1) {
    throw new Error('Could not find a "Name" or "Images" column in the CSV header row.');
  }

  console.log("Scanning image folder...");
  const files = fs.readdirSync(IMAGE_FOLDER).filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
  console.log(`Found ${files.length} image files.`);

  // Group files by product name, stripping the trailing "_<number>.<ext>"
  const pattern = /^(.*)_(\d+)\.[a-zA-Z]+$/;
  const groups = {}; // exact product name -> [{ num, file }]
  let skippedFilenames = 0;
  for (const file of files) {
    const m = file.match(pattern);
    if (!m) {
      skippedFilenames++;
      console.warn(`  Skipping (doesn't match "Name_Number" pattern): ${file}`);
      continue;
    }
    const [, name, num] = m;
    (groups[name] ||= []).push({ num: parseInt(num, 10), file });
  }
  for (const name in groups) groups[name].sort((a, b) => a.num - b.num);

  const dataRows = allRows.slice(1);
  let matchedProducts = 0;
  let unmatchedProducts = 0;
  let uploadedCount = 0;
  const unmatchedNames = [];

  for (const row of dataRows) {
    const productName = (row[nameCol] || "").trim();
    const group = groups[productName];
    if (!group || group.length === 0) {
      unmatchedProducts++;
      unmatchedNames.push(productName);
      continue;
    }
    matchedProducts++;
    const slug = productName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const urls = [];
    for (const { file } of group) {
      const localPath = path.join(IMAGE_FOLDER, file);
      const ext = path.extname(file);
      const destPath = `products/migrated/${slug}/${crypto.randomUUID()}${ext}`;
      const url = await uploadOne(localPath, destPath);
      urls.push(url);
      uploadedCount++;
      process.stdout.write(`\rUploaded ${uploadedCount} images so far...`);
    }
    row[imagesCol] = urls.join("|");
  }

  console.log("\n\n----- Done -----");
  console.log(`Products matched to photos:     ${matchedProducts}`);
  console.log(`Products with NO matching photos (left unchanged): ${unmatchedProducts}`);
  console.log(`Image files skipped (bad filename pattern): ${skippedFilenames}`);
  console.log(`Total images uploaded:          ${uploadedCount}`);

  if (unmatchedNames.length > 0) {
    console.log("\nProducts with no matching photos (first 20 shown):");
    unmatchedNames.slice(0, 20).forEach((n) => console.log(`  - ${n}`));
    if (unmatchedNames.length > 20) console.log(`  ...and ${unmatchedNames.length - 20} more.`);
  }

  const outPath = path.join(path.dirname(CSV_PATH), "zaina-products-with-images.csv");
  fs.writeFileSync(outPath, writeCsv([header, ...dataRows]), "utf8");
  console.log(`\nNew CSV written to:\n  ${outPath}`);
  console.log("\nImport that file via Admin -> Product -> Import CSV.");
}

main().catch((err) => {
  console.error("\nSomething went wrong:", err.message || err);
  process.exit(1);
});
