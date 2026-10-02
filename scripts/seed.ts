/**
 * Seeds Firestore with demo products, banners, categories, settings, and discounts.
 * Run with: npm run seed
 * Requires .env.local to be populated with your Firebase config.
 */
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, doc, setDoc } from "firebase/firestore";
import { demoProducts, demoBanners, demoCategories, demoSettings, demoDiscounts } from "../lib/demo-data";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

async function seed() {
  if (!firebaseConfig.projectId) {
    console.error("Missing Firebase config. Populate .env.local first.");
    process.exit(1);
  }

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  console.log("Seeding products...");
  for (const { id, ...product } of demoProducts) {
    await addDoc(collection(db, "products"), product);
  }

  console.log("Seeding hero banners...");
  for (const banner of demoBanners) {
    await setDoc(doc(db, "banners", banner.id), banner);
  }

  console.log("Seeding categories...");
  for (const { id, ...category } of demoCategories) {
    await addDoc(collection(db, "categories"), category);
  }

  console.log("Seeding settings...");
  await setDoc(doc(db, "settings", "main"), demoSettings);

  console.log("Seeding discount codes...");
  for (const { id, ...discount } of demoDiscounts) {
    await addDoc(collection(db, "discounts"), discount);
  }

  console.log("Seed complete.");
  console.log("");
  console.log("IMPORTANT: create your first admin manually — see README 'Making your first admin'.");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
