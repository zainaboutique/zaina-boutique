// Copies product photos that still live in another Firebase project / website
// into your zaina-boutique Storage, then updates those products.
//
//   node scripts/move-old-images.js           -> DRY RUN (lists only, changes nothing)
//   node scripts/move-old-images.js --apply   -> really copies and updates
//
// Safe to run more than once: files get fixed names, products already
// pointing at zaina-boutique are skipped.

const path = require("path");
const crypto = require("crypto");

const SERVICE_ACCOUNT_PATH = path.join(__dirname, "..", "serviceAccountKey.json");
const STORAGE_BUCKET = "zaina-boutique.firebasestorage.app";
const APPLY = process.argv.includes("--apply");

function isOurs(url) {
  return typeof url === "string" && url.includes(`/b/${STORAGE_BUCKET}/`);
}

function isForeign(url) {
  return typeof url === "string" && /^https?:\/\//i.test(url) && !isOurs(url);
}

function hostLabel(url) {
  try {
    const u = new URL(url);
    const m = u.pathname.match(/\/b\/([^/]+)\//);
    return m ? `${u.hostname} (${m[1]})` : u.hostname;
  } catch {
    return "unknown";
  }
}

function extensionOf(url, contentType) {
  try {
    const last = decodeURIComponent(new URL(url).pathname).split("/").pop() || "";
    const m = last.match(/\.(jpe?g|png|webp|gif)$/i);
    if (m) return "." + m[1].toLowerCase();
  } catch {}
  if (/png/i.test(contentType || "")) return ".png";
  if (/webp/i.test(contentType || "")) return ".webp";
  if (/gif/i.test(contentType || "")) return ".gif";
  return ".jpeg";
}

async function main() {
  const { initializeApp, cert } = require("firebase-admin/app");
  const { getFirestore } = require("firebase-admin/firestore");
  const { getStorage } = require("firebase-admin/storage");

  const app = initializeApp({
    credential: cert(require(SERVICE_ACCOUNT_PATH)),
    storageBucket: STORAGE_BUCKET,
  });
  const db = getFirestore(app);
  const bucket = getStorage(app).bucket();

  console.log(APPLY ? "MODE: APPLY (changes will be made)\n" : "MODE: DRY RUN (nothing will be changed)\n");
  console.log("Reading products...");
  const snap = await db.collection("products").get();
  console.log(`Found ${snap.size} products.\n`);

  const hosts = {};
  let needFix = 0, moved = 0, failed = 0, okAlready = 0, noImage = 0;
  const failures = [];

  for (const docSnap of snap.docs) {
    const p = docSnap.data();
    const images = Array.isArray(p.images) ? [...p.images] : [];
    const cover = p.imageUrl;
    const hasAny = images.length > 0 || cover;
    if (!hasAny) { noImage++; continue; }

    const foreignInImages = images.filter(isForeign);
    const coverForeign = isForeign(cover);
    if (foreignInImages.length === 0 && !coverForeign) { okAlready++; continue; }

    needFix++;
    [...foreignInImages, ...(coverForeign ? [cover] : [])].forEach((u) => {
      const h = hostLabel(u);
      hosts[h] = (hosts[h] || 0) + 1;
    });
    const title = p.title || p.name || docSnap.id;
    console.log(`- ${title}  (${foreignInImages.length + (coverForeign && !foreignInImages.includes(cover) ? 1 : 0)} photo(s) to move)`);
    if (!APPLY) continue;

    // url -> new url, so the same photo is copied only once
    const done = new Map();
    let idx = 0;
    const copyOne = async (url) => {
      if (done.has(url)) return done.get(url);
      idx++;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`download failed (${res.status})`);
      const buf = Buffer.from(await res.arrayBuffer());
      const contentType = (res.headers.get("content-type") || "image/jpeg").split(";")[0];
      const ext = extensionOf(url, contentType);
      const dest = `products/moved/${docSnap.id}/${idx}${ext}`;
      const token = crypto.randomUUID();
      await bucket.file(dest).save(buf, {
        metadata: { contentType, metadata: { firebaseStorageDownloadTokens: token } },
      });
      const newUrl =
        `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(dest)}?alt=media&token=${token}`;
      done.set(url, newUrl);
      return newUrl;
    };

    try {
      const newImages = [];
      for (const u of images) newImages.push(isForeign(u) ? await copyOne(u) : u);
      const updates = {};
      if (images.length) updates.images = newImages;
      if (coverForeign) updates.imageUrl = await copyOne(cover);
      await docSnap.ref.update(updates);
      moved++;
    } catch (err) {
      failed++;
      failures.push(`${title}: ${err.message || err}`);
      console.log(`    FAILED: ${err.message || err}  (product left unchanged)`);
    }
  }

  console.log("\n----- Summary -----");
  console.log(`Products already on zaina-boutique:   ${okAlready}`);
  console.log(`Products with photos elsewhere:       ${needFix}`);
  console.log(`Products with no photo at all:        ${noImage}`);
  if (needFix) {
    console.log("\nWhere those photos are now:");
    Object.entries(hosts).forEach(([h, n]) => console.log(`  ${n} photo(s) at ${h}`));
  }
  if (APPLY) {
    console.log(`\nMoved and updated: ${moved}`);
    console.log(`Failed (unchanged): ${failed}`);
    failures.forEach((f) => console.log("  - " + f));
  } else if (needFix) {
    console.log("\nThis was a DRY RUN. To really move them, run:");
    console.log("  node scripts/move-old-images.js --apply");
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error("Something went wrong:", err.message || err);
    process.exit(1);
  });
}

module.exports = { isOurs, isForeign, hostLabel, extensionOf };
