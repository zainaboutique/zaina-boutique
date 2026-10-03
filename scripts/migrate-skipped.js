// Uploads ONLY the photos that migrate-images.js skipped (filenames without
// "_Number"), and adds their links to zaina-products-with-images.csv.
// No renaming needed. Run AFTER migrate-images.js has fully finished:
//   node scripts/migrate-skipped.js

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// ========================= CONFIG (same values as migrate-images.js) =========================
const IMAGE_FOLDER = "C:\\Users\\dell\\Downloads\\New folder\\zaina boutique product image";
// The file migrate-images.js produced (NOT the original CSV):
const CSV_PATH = "C:\\Users\\dell\\Downloads\\zaina-products-with-images.csv";
const SERVICE_ACCOUNT_PATH = path.join(__dirname, "..", "serviceAccountKey.json");
const STORAGE_BUCKET = "zaina-boutique.firebasestorage.app";
// ==============================================================================================

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      rows.push(row); row = [];
    } else field += c;
  }
  if (field !== "" || row.length > 0) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.length > 1 || r[0] !== "");
}

function csvEscape(v) {
  v = String(v ?? "");
  return /[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

function writeCsv(rows) {
  return rows.map((r) => r.map(csvEscape).join(",")).join("\r\n");
}

// Loose comparison: ignores case, extra spaces and a stray trailing "_"
function normalize(s) {
  return s.toLowerCase().replace(/[\s_]+$/g, "").replace(/\s+/g, " ").trim();
}

async function main() {
  const { initializeApp, cert } = require("firebase-admin/app");
  const { getStorage } = require("firebase-admin/storage");
  const app = initializeApp({
    credential: cert(require(SERVICE_ACCOUNT_PATH)),
    storageBucket: STORAGE_BUCKET,
  });
  const bucket = getStorage(app).bucket();

  if (!fs.existsSync(CSV_PATH)) {
    throw new Error(`CSV not found: ${CSV_PATH}\nLet migrate-images.js finish first.`);
  }

  console.log("Reading CSV...");
  let csvText = fs.readFileSync(CSV_PATH, "utf8");
  const hadBom = csvText.charCodeAt(0) === 0xfeff;
  if (hadBom) csvText = csvText.slice(1);
  const allRows = parseCsv(csvText);
  const header = allRows[0];
  const nameCol = header.findIndex((h) => h.trim().toLowerCase() === "name");
  const imagesCol = header.findIndex((h) => h.trim().toLowerCase() === "images");
  if (nameCol === -1 || imagesCol === -1) {
    throw new Error('Could not find a "Name" or "Images" column in the CSV header row.');
  }

  // Only the files the main script skipped: no "_<number>" before the extension
  const numbered = /^(.*)_(\d+)\.[a-zA-Z]+$/;
  const files = fs
    .readdirSync(IMAGE_FOLDER)
    .filter((f) => /\.(jpe?g|png|webp)$/i.test(f) && !numbered.test(f));
  console.log(`Found ${files.length} skipped image files.\n`);

  const done = [];
  const already = [];
  const noProduct = [];

  for (const file of files) {
    const ext = path.extname(file);
    const baseName = path.basename(file, ext);
    const row = allRows
      .slice(1)
      .find((r) => normalize(r[nameCol] || "") === normalize(baseName));
    if (!row) { noProduct.push(file); continue; }

    const productName = row[nameCol].trim();
    const slug = productName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    // Fixed destination name, so running this twice never creates a copy
    const destPath = `products/migrated/${slug}/main${ext.toLowerCase()}`;
    const encodedPath = encodeURIComponent(destPath);

    const current = (row[imagesCol] || "").split("|").map((s) => s.trim()).filter(Boolean);
    if (current.some((u) => u.includes(encodedPath))) { already.push(file); continue; }

    const e = ext.toLowerCase().replace(".", "");
    const contentType = e === "jpg" ? "image/jpeg" : `image/${e}`;
    const token = crypto.randomUUID();
    await bucket.upload(path.join(IMAGE_FOLDER, file), {
      destination: destPath,
      metadata: { contentType, metadata: { firebaseStorageDownloadTokens: token } },
    });
    const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media&token=${token}`;

    // Keep photos the main script already uploaded for this product; drop old-site links
    const kept = current.filter((u) => u.includes(bucket.name));
    row[imagesCol] = [...kept, url].join("|");
    done.push(file);
    console.log(`  Uploaded: ${file}  ->  ${productName}`);
  }

  if (done.length > 0) {
    const backup = CSV_PATH.replace(/\.csv$/i, ".backup.csv");
    if (!fs.existsSync(backup)) fs.copyFileSync(CSV_PATH, backup);
    fs.writeFileSync(CSV_PATH, (hadBom ? "\ufeff" : "") + writeCsv(allRows), "utf8");
  }

  console.log("\n----- Done -----");
  console.log(`Uploaded and added to CSV: ${done.length}`);
  console.log(`Already done earlier:      ${already.length}`);
  console.log(`No product with that name: ${noProduct.length}`);
  noProduct.forEach((f) => console.log(`  - ${f}`));
  if (done.length > 0) console.log(`\nCSV updated:\n  ${CSV_PATH}`);
}

if (require.main === module) {
  main().catch((err) => {
    console.error("Something went wrong:", err.message || err);
    process.exit(1);
  });
}

module.exports = { parseCsv, writeCsv, normalize };
