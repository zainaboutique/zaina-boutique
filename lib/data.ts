import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  setDoc,
  query,
  orderBy,
  where,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";
import { demoProducts, demoBanners, demoCategories, demoSettings, demoDiscounts, demoPages, demoFaqs, demoBlogPosts } from "./demo-data";
import { readLocal, writeLocal, slugify } from "./utils";
import type {
  Product, HeroBanner, Order, OrderStatus, Review, Category, Settings, Discount, AppUser, PageContent, FaqItem, BlogPost,
} from "./types";

// ---------------------------------------------------------------------------
// Single place the UI talks to for data.
//
// - When Firebase env vars are present, every function reads/writes real
//   Firestore collections.
// - Otherwise ("demo mode"), everything is backed by the browser's
//   localStorage, seeded from lib/demo-data.ts on first read. This means
//   admin edits, new products, and customer orders now survive a page
//   refresh — but only within that one browser (localStorage doesn't sync
//   across devices/tabs' incognito state or between your phone and laptop).
//   Connect Firebase (see README) for real, shared, production persistence.
// ---------------------------------------------------------------------------

const KEYS = {
  products: "zaina_products",
  banners: "zaina_banners",
  orders: "zaina_orders",
  reviews: "zaina_reviews",
  categories: "zaina_categories",
  settings: "zaina_settings",
  discounts: "zaina_discounts",
  users: "zaina_users",
  admins: "zaina_admins",
  pages: "zaina_pages",
  faqs: "zaina_faqs",
  blogPosts: "zaina_blog_posts",
};

// ---------- Products ----------

export async function getProducts(): Promise<Product[]> {
  if (isFirebaseConfigured && db) {
    const snap = await getDocs(query(collection(db, "products"), orderBy("createdAt", "desc")));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Product, "id">) }));
  }
  const products = readLocal(KEYS.products, demoProducts);
  return [...products].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
}

export async function getProduct(id: string): Promise<Product | null> {
  if (isFirebaseConfigured && db) {
    const snap = await getDoc(doc(db, "products", id));
    return snap.exists() ? ({ id: snap.id, ...(snap.data() as Omit<Product, "id">) }) : null;
  }
  const products = readLocal(KEYS.products, demoProducts);
  return products.find((p) => p.id === id) ?? null;
}

// Public product pages are routed by slug (readable, stable URLs for SEO and
// for matching old pre-migration URLs) rather than the internal Firestore
// document id, which stays the primary key for cart/order operations.
export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (isFirebaseConfigured && db) {
    const snap = await getDocs(query(collection(db, "products"), where("slug", "==", slug)));
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { id: d.id, ...(d.data() as Omit<Product, "id">) };
  }
  const products = readLocal(KEYS.products, demoProducts);
  return products.find((p) => p.slug === slug) ?? null;
}

export async function createProduct(product: Omit<Product, "id">): Promise<string> {
  if (isFirebaseConfigured && db) {
    const ref = await addDoc(collection(db, "products"), product);
    return ref.id;
  }
  const products = readLocal(KEYS.products, demoProducts);
  const id = `p${Date.now()}${Math.floor(Math.random() * 1000)}`;
  writeLocal(KEYS.products, [{ id, ...product }, ...products]);
  return id;
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<void> {
  if (isFirebaseConfigured && db) {
    await updateDoc(doc(db, "products", id), updates);
    return;
  }
  const products = readLocal(KEYS.products, demoProducts);
  writeLocal(KEYS.products, products.map((p) => (p.id === id ? { ...p, ...updates } : p)));
}

export async function deleteProduct(id: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    await deleteDoc(doc(db, "products", id));
    return;
  }
  const products = readLocal(KEYS.products, demoProducts);
  writeLocal(KEYS.products, products.filter((p) => p.id !== id));
}

export async function bulkCreateProducts(products: Omit<Product, "id">[]): Promise<number> {
  let count = 0;
  for (const p of products) {
    // eslint-disable-next-line no-await-in-loop
    await createProduct(p);
    count++;
  }
  return count;
}

export function getCoverImage(p: Product): string {
  const imgs = p.images ?? [];
  if (imgs.length) return imgs[p.coverImageIndex ?? 0] ?? imgs[0];
  return p.imageUrl;
}

// ---------- Categories ----------

export async function getCategories(): Promise<Category[]> {
  if (isFirebaseConfigured && db) {
    const snap = await getDocs(query(collection(db, "categories"), orderBy("order", "asc")));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Category, "id">) }));
  }
  const categories = readLocal(KEYS.categories, demoCategories);
  return [...categories].sort((a, b) => a.order - b.order);
}

export async function createCategory(cat: Omit<Category, "id">): Promise<string> {
  if (isFirebaseConfigured && db) {
    const ref = await addDoc(collection(db, "categories"), cat);
    return ref.id;
  }
  const categories = readLocal(KEYS.categories, demoCategories);
  const id = `cat${Date.now()}`;
  writeLocal(KEYS.categories, [...categories, { id, ...cat }]);
  return id;
}

export async function updateCategory(id: string, updates: Partial<Category>): Promise<void> {
  if (isFirebaseConfigured && db) {
    await updateDoc(doc(db, "categories", id), updates);
    return;
  }
  const categories = readLocal(KEYS.categories, demoCategories);
  writeLocal(KEYS.categories, categories.map((c) => (c.id === id ? { ...c, ...updates } : c)));
}

export async function deleteCategory(id: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    await deleteDoc(doc(db, "categories", id));
    return;
  }
  const categories = readLocal(KEYS.categories, demoCategories);
  writeLocal(KEYS.categories, categories.filter((c) => c.id !== id));
}

// ---------- Hero Banners ----------

export async function getBanners(): Promise<HeroBanner[]> {
  if (isFirebaseConfigured && db) {
    const snap = await getDocs(query(collection(db, "banners"), orderBy("order", "asc")));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<HeroBanner, "id">) }));
  }
  const banners = readLocal(KEYS.banners, demoBanners);
  return [...banners].sort((a, b) => a.order - b.order);
}

export async function saveBanner(banner: HeroBanner): Promise<void> {
  if (isFirebaseConfigured && db) {
    await setDoc(doc(db, "banners", banner.id), banner, { merge: true });
    return;
  }
  const banners = readLocal(KEYS.banners, demoBanners);
  const exists = banners.some((b) => b.id === banner.id);
  writeLocal(
    KEYS.banners,
    exists ? banners.map((b) => (b.id === banner.id ? banner : b)) : [...banners, banner]
  );
}

export async function deleteBanner(id: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    await deleteDoc(doc(db, "banners", id));
    return;
  }
  const banners = readLocal(KEYS.banners, demoBanners);
  writeLocal(KEYS.banners, banners.filter((b) => b.id !== id));
}

export async function reorderBanners(orderedIds: string[]): Promise<void> {
  const banners = await getBanners();
  await Promise.all(
    orderedIds.map((id, index) => {
      const banner = banners.find((b) => b.id === id);
      if (!banner) return Promise.resolve();
      return saveBanner({ ...banner, order: index });
    })
  );
}

// ---------- Orders ----------

function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(10000 + Math.random() * 89999);
  return `ZB-${year}-${rand}`;
}

export async function getOrders(): Promise<Order[]> {
  if (isFirebaseConfigured && db) {
    const snap = await getDocs(query(collection(db, "orders"), orderBy("createdAt", "desc")));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Order, "id">) }));
  }
  const orders = readLocal<Order[]>(KEYS.orders, []);
  return [...orders].sort((a, b) => b.createdAt - a.createdAt);
}

export async function createOrder(order: Omit<Order, "id" | "orderNumber">): Promise<Order> {
  const orderNumber = generateOrderNumber();
  // Normalize email casing at write time so Firestore's exact-match queries
  // (used by getOrdersByEmail for "My Orders") reliably find it later,
  // regardless of how the customer typed it at checkout.
  const full = { ...order, email: order.email.trim().toLowerCase(), orderNumber };
  if (isFirebaseConfigured && db) {
    const ref = await addDoc(collection(db, "orders"), full);
    return { id: ref.id, ...full };
  }
  const orders = readLocal<Order[]>(KEYS.orders, []);
  const id = `ord_${Date.now()}`;
  const stored = { id, ...full };
  writeLocal(KEYS.orders, [stored, ...orders]);
  return stored;
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
  const updates: Partial<Order> = { status };
  if (status === "Cancelled") updates.cancelledAt = Date.now();
  if (isFirebaseConfigured && db) {
    await updateDoc(doc(db, "orders", id), updates);
    return;
  }
  const orders = readLocal<Order[]>(KEYS.orders, []);
  writeLocal(KEYS.orders, orders.map((o) => (o.id === id ? { ...o, ...updates } : o)));
}

export async function updateOrderTracking(
  id: string,
  tracking: { carrier?: string; trackingNumber?: string; trackingUrl?: string }
): Promise<void> {
  if (isFirebaseConfigured && db) {
    await updateDoc(doc(db, "orders", id), tracking);
    return;
  }
  const orders = readLocal<Order[]>(KEYS.orders, []);
  writeLocal(KEYS.orders, orders.map((o) => (o.id === id ? { ...o, ...tracking } : o)));
}

export async function findOrderByNumber(orderNumber: string): Promise<Order | null> {
  if (isFirebaseConfigured && db) {
    const snap = await getDocs(query(collection(db, "orders"), where("orderNumber", "==", orderNumber.trim())));
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { id: d.id, ...(d.data() as Omit<Order, "id">) };
  }
  const orders = readLocal<Order[]>(KEYS.orders, []);
  return orders.find((o) => o.orderNumber.toLowerCase() === orderNumber.trim().toLowerCase()) ?? null;
}

export async function getOrdersByEmail(email: string): Promise<Order[]> {
  if (!email) return [];
  if (isFirebaseConfigured && db) {
    const snap = await getDocs(query(collection(db, "orders"), where("email", "==", email.trim().toLowerCase())));
    return snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as Omit<Order, "id">) }))
      .sort((a, b) => b.createdAt - a.createdAt);
  }
  const orders = readLocal<Order[]>(KEYS.orders, []);
  return orders
    .filter((o) => o.email.trim().toLowerCase() === email.trim().toLowerCase())
    .sort((a, b) => b.createdAt - a.createdAt);
}

// ---------- Reviews (with moderation) ----------

export async function getReviews(productId: string): Promise<Review[]> {
  // Public-facing: approved only.
  if (isFirebaseConfigured && db) {
    const snap = await getDocs(
      query(collection(db, "reviews"), where("productId", "==", productId), where("approved", "==", true), orderBy("createdAt", "desc"))
    );
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Review, "id">) }));
  }
  const reviews = readLocal<Review[]>(KEYS.reviews, []);
  return reviews.filter((r) => r.productId === productId && r.approved).sort((a, b) => b.createdAt - a.createdAt);
}

export async function getAllReviewsForAdmin(): Promise<Review[]> {
  if (isFirebaseConfigured && db) {
    const snap = await getDocs(query(collection(db, "reviews"), orderBy("createdAt", "desc")));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Review, "id">) }));
  }
  const reviews = readLocal<Review[]>(KEYS.reviews, []);
  return [...reviews].sort((a, b) => b.createdAt - a.createdAt);
}

export async function addReview(review: Omit<Review, "id" | "approved">): Promise<string> {
  const full = { ...review, approved: false }; // goes to a moderation queue by default
  if (isFirebaseConfigured && db) {
    const ref = await addDoc(collection(db, "reviews"), full);
    return ref.id;
  }
  const reviews = readLocal<Review[]>(KEYS.reviews, []);
  const id = `rev_${Date.now()}`;
  writeLocal(KEYS.reviews, [{ id, ...full }, ...reviews]);
  return id;
}

export async function setReviewApproval(id: string, approved: boolean): Promise<void> {
  if (isFirebaseConfigured && db) {
    await updateDoc(doc(db, "reviews", id), { approved });
    return;
  }
  const reviews = readLocal<Review[]>(KEYS.reviews, []);
  writeLocal(KEYS.reviews, reviews.map((r) => (r.id === id ? { ...r, approved } : r)));
}

export async function deleteReview(id: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    await deleteDoc(doc(db, "reviews", id));
    return;
  }
  const reviews = readLocal<Review[]>(KEYS.reviews, []);
  writeLocal(KEYS.reviews, reviews.filter((r) => r.id !== id));
}

export async function getApprovedReviewsSample(count = 6): Promise<(Review & { productTitle?: string })[]> {
  const [reviews, products] = await Promise.all([
    isFirebaseConfigured && db
      ? getDocs(query(collection(db, "reviews"), where("approved", "==", true), orderBy("createdAt", "desc"))).then((snap) =>
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Review, "id">) }))
        )
      : Promise.resolve(readLocal<Review[]>(KEYS.reviews, []).filter((r) => r.approved)),
    getProducts(),
  ]);
  const withTitles = reviews.map((r) => ({ ...r, productTitle: products.find((p) => p.id === r.productId)?.title }));
  return withTitles.slice(0, count);
}

// ---------- Discounts ----------

export async function getDiscounts(): Promise<Discount[]> {
  if (isFirebaseConfigured && db) {
    const snap = await getDocs(collection(db, "discounts"));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Discount, "id">) }));
  }
  return readLocal(KEYS.discounts, demoDiscounts);
}

export async function createDiscount(discount: Omit<Discount, "id">): Promise<string> {
  if (isFirebaseConfigured && db) {
    const ref = await addDoc(collection(db, "discounts"), discount);
    return ref.id;
  }
  const discounts = readLocal(KEYS.discounts, demoDiscounts);
  const id = `disc${Date.now()}`;
  writeLocal(KEYS.discounts, [...discounts, { id, ...discount }]);
  return id;
}

export async function updateDiscount(id: string, updates: Partial<Discount>): Promise<void> {
  if (isFirebaseConfigured && db) {
    await updateDoc(doc(db, "discounts", id), updates);
    return;
  }
  const discounts = readLocal(KEYS.discounts, demoDiscounts);
  writeLocal(KEYS.discounts, discounts.map((d) => (d.id === id ? { ...d, ...updates } : d)));
}

export async function deleteDiscount(id: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    await deleteDoc(doc(db, "discounts", id));
    return;
  }
  const discounts = readLocal(KEYS.discounts, demoDiscounts);
  writeLocal(KEYS.discounts, discounts.filter((d) => d.id !== id));
}

export async function validateDiscountCode(code: string): Promise<Discount | null> {
  const discounts = await getDiscounts();
  const match = discounts.find(
    (d) => d.code.toLowerCase() === code.trim().toLowerCase() && d.active && (!d.expiresAt || d.expiresAt > Date.now())
  );
  return match ?? null;
}

// ---------- Settings ----------

export async function getSettings(): Promise<Settings> {
  if (isFirebaseConfigured && db) {
    const snap = await getDoc(doc(db, "settings", "main"));
    const stored = snap.exists() ? (snap.data() as Partial<Settings>) : {};
    return { ...demoSettings, ...stored, payments: { ...demoSettings.payments, ...(stored.payments || {}) } };
  }
  // Merge with current defaults rather than returning stored data as-is —
  // this backfills any fields (like `payments`) that didn't exist yet when
  // an older version of the app saved settings to this browser.
  const stored = readLocal<Partial<Settings>>(KEYS.settings, {});
  return { ...demoSettings, ...stored, payments: { ...demoSettings.payments, ...(stored.payments || {}) } };
}

export async function saveSettings(settings: Settings): Promise<void> {
  if (isFirebaseConfigured && db) {
    await setDoc(doc(db, "settings", "main"), settings, { merge: true });
    return;
  }
  writeLocal(KEYS.settings, settings);
}

// ---------- Editable content pages (About, Shipping, Returns, etc.) ----------

export async function getPageContent(slug: string): Promise<PageContent> {
  const fallback = demoPages.find((p) => p.slug === slug) || { slug, title: slug, body: "", updatedAt: Date.now() };
  if (isFirebaseConfigured && db) {
    const snap = await getDoc(doc(db, "pages", slug));
    return snap.exists() ? (snap.data() as PageContent) : fallback;
  }
  const pages = readLocal<PageContent[]>(KEYS.pages, demoPages);
  return pages.find((p) => p.slug === slug) || fallback;
}

export async function getAllPageContent(): Promise<PageContent[]> {
  if (isFirebaseConfigured && db) {
    const snap = await getDocs(collection(db, "pages"));
    const stored = snap.docs.map((d) => d.data() as PageContent);
    // Ensure every known slug shows up in the admin list even before it's been saved once.
    return demoPages.map((fallback) => stored.find((s) => s.slug === fallback.slug) || fallback);
  }
  return readLocal<PageContent[]>(KEYS.pages, demoPages);
}

export async function savePageContent(slug: string, updates: { title: string; body: string }): Promise<void> {
  const full: PageContent = { slug, ...updates, updatedAt: Date.now() };
  if (isFirebaseConfigured && db) {
    await setDoc(doc(db, "pages", slug), full, { merge: true });
    return;
  }
  const pages = readLocal<PageContent[]>(KEYS.pages, demoPages);
  const exists = pages.some((p) => p.slug === slug);
  writeLocal(KEYS.pages, exists ? pages.map((p) => (p.slug === slug ? full : p)) : [...pages, full]);
}

// ---------- FAQ ----------

export async function getFaqs(): Promise<FaqItem[]> {
  if (isFirebaseConfigured && db) {
    const snap = await getDocs(query(collection(db, "faqs"), orderBy("order", "asc")));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<FaqItem, "id">) }));
  }
  return [...readLocal<FaqItem[]>(KEYS.faqs, demoFaqs)].sort((a, b) => a.order - b.order);
}

export async function saveFaq(faq: FaqItem): Promise<void> {
  if (isFirebaseConfigured && db) {
    await setDoc(doc(db, "faqs", faq.id), faq, { merge: true });
    return;
  }
  const faqs = readLocal<FaqItem[]>(KEYS.faqs, demoFaqs);
  const exists = faqs.some((f) => f.id === faq.id);
  writeLocal(KEYS.faqs, exists ? faqs.map((f) => (f.id === faq.id ? faq : f)) : [...faqs, faq]);
}

export async function deleteFaq(id: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    await deleteDoc(doc(db, "faqs", id));
    return;
  }
  const faqs = readLocal<FaqItem[]>(KEYS.faqs, demoFaqs);
  writeLocal(KEYS.faqs, faqs.filter((f) => f.id !== id));
}

export async function reorderFaqs(orderedIds: string[]): Promise<void> {
  const faqs = await getFaqs();
  await Promise.all(
    orderedIds.map((id, index) => {
      const faq = faqs.find((f) => f.id === id);
      if (!faq) return Promise.resolve();
      return saveFaq({ ...faq, order: index });
    })
  );
}

// ---------- Blog ----------

export async function getBlogPosts(): Promise<BlogPost[]> {
  // Public-facing: published only.
  if (isFirebaseConfigured && db) {
    const snap = await getDocs(
      query(collection(db, "blogPosts"), where("status", "==", "published"), orderBy("createdAt", "desc"))
    );
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<BlogPost, "id">) }));
  }
  return readLocal<BlogPost[]>(KEYS.blogPosts, demoBlogPosts)
    .filter((p) => p.status === "published")
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function getAllBlogPosts(): Promise<BlogPost[]> {
  // Admin-facing: every post, drafts included.
  if (isFirebaseConfigured && db) {
    const snap = await getDocs(query(collection(db, "blogPosts"), orderBy("createdAt", "desc")));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<BlogPost, "id">) }));
  }
  return [...readLocal<BlogPost[]>(KEYS.blogPosts, demoBlogPosts)].sort((a, b) => b.createdAt - a.createdAt);
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  if (isFirebaseConfigured && db) {
    const snap = await getDocs(
      query(collection(db, "blogPosts"), where("slug", "==", slug), where("status", "==", "published"))
    );
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { id: d.id, ...(d.data() as Omit<BlogPost, "id">) };
  }
  const posts = readLocal<BlogPost[]>(KEYS.blogPosts, demoBlogPosts);
  return posts.find((p) => p.slug === slug && p.status === "published") ?? null;
}

export async function saveBlogPost(post: Omit<BlogPost, "id" | "createdAt" | "updatedAt"> & { id?: string; createdAt?: number }): Promise<string> {
  const now = Date.now();
  if (post.id) {
    const full = { ...post, updatedAt: now };
    if (isFirebaseConfigured && db) {
      await updateDoc(doc(db, "blogPosts", post.id), full);
      return post.id;
    }
    const posts = readLocal<BlogPost[]>(KEYS.blogPosts, demoBlogPosts);
    writeLocal(KEYS.blogPosts, posts.map((p) => (p.id === post.id ? { ...p, ...full } as BlogPost : p)));
    return post.id;
  }
  const full = { ...post, createdAt: now, updatedAt: now };
  if (isFirebaseConfigured && db) {
    const ref = await addDoc(collection(db, "blogPosts"), full);
    return ref.id;
  }
  const posts = readLocal<BlogPost[]>(KEYS.blogPosts, demoBlogPosts);
  const id = `blog_${Date.now()}`;
  writeLocal(KEYS.blogPosts, [{ id, ...full } as BlogPost, ...posts]);
  return id;
}

export async function deleteBlogPost(id: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    await deleteDoc(doc(db, "blogPosts", id));
    return;
  }
  const posts = readLocal<BlogPost[]>(KEYS.blogPosts, demoBlogPosts);
  writeLocal(KEYS.blogPosts, posts.filter((p) => p.id !== id));
}

// ---------- Users & Admin roles ----------

export async function upsertUser(user: AppUser): Promise<void> {
  if (isFirebaseConfigured && db) {
    await setDoc(doc(db, "users", user.uid), user, { merge: true });
    return;
  }
  const users = readLocal<AppUser[]>(KEYS.users, []);
  const exists = users.some((u) => u.uid === user.uid);
  writeLocal(KEYS.users, exists ? users.map((u) => (u.uid === user.uid ? user : u)) : [...users, user]);
}

export async function getUserByUid(uid: string): Promise<AppUser | null> {
  if (isFirebaseConfigured && db) {
    const snap = await getDoc(doc(db, "users", uid));
    return snap.exists() ? (snap.data() as AppUser) : null;
  }
  const users = readLocal<AppUser[]>(KEYS.users, []);
  return users.find((u) => u.uid === uid) ?? null;
}

export async function getUsers(): Promise<AppUser[]> {
  if (isFirebaseConfigured && db) {
    const snap = await getDocs(query(collection(db, "users"), orderBy("createdAt", "desc")));
    return snap.docs.map((d) => d.data() as AppUser);
  }
  return [...readLocal<AppUser[]>(KEYS.users, [])].sort((a, b) => b.createdAt - a.createdAt);
}

export async function isAdminUid(uid: string): Promise<boolean> {
  if (isFirebaseConfigured && db) {
    const snap = await getDoc(doc(db, "admins", uid));
    return snap.exists();
  }
  const admins = readLocal<string[]>(KEYS.admins, []);
  return admins.length === 0 || admins.includes(uid); // demo mode: permissive until first grant/revoke
}

export async function grantAdmin(uid: string, email: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    await setDoc(doc(db, "admins", uid), { email });
    await updateDoc(doc(db, "users", uid), { role: "admin" });
    return;
  }
  const admins = readLocal<string[]>(KEYS.admins, []);
  writeLocal(KEYS.admins, Array.from(new Set([...admins, uid])));
  const users = readLocal<AppUser[]>(KEYS.users, []);
  writeLocal(KEYS.users, users.map((u) => (u.uid === uid ? { ...u, role: "admin" } : u)));
}

export async function revokeAdmin(uid: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    await deleteDoc(doc(db, "admins", uid));
    await updateDoc(doc(db, "users", uid), { role: "customer" });
    return;
  }
  const admins = readLocal<string[]>(KEYS.admins, []);
  writeLocal(KEYS.admins, admins.filter((a) => a !== uid));
  const users = readLocal<AppUser[]>(KEYS.users, []);
  writeLocal(KEYS.users, users.map((u) => (u.uid === uid ? { ...u, role: "customer" } : u)));
}

// ---------- Related / New Arrivals / Shop filtering ----------

export function getNewArrivals(products: Product[], count = 8): Product[] {
  return [...products].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)).slice(0, count);
}

export function getRelatedProducts(products: Product[], current: Product, count = 4): Product[] {
  const others = products.filter((p) => p.id !== current.id);
  const sharesCategory = others.filter((p) => (p.categories ?? []).some((c) => (current.categories ?? []).includes(c)));
  const sameAudience = others.filter((p) => p.audience === current.audience && !sharesCategory.includes(p));
  const rest = others.filter((p) => !sharesCategory.includes(p) && !sameAudience.includes(p));
  return [...sharesCategory, ...sameAudience, ...rest].slice(0, count);
}

export function filterProductsForShop(
  products: Product[],
  opts: {
    category?: string;
    type?: string;
    q?: string;
    occasion?: string;
    minPrice?: number;
    maxPrice?: number;
    sizes?: string[];
    sort?: "newest" | "price-asc" | "price-desc";
  }
): Product[] {
  let result = products;

  if (opts.category === "New Arrival") {
    result = getNewArrivals(result, 48);
  } else if (opts.category === "Men") {
    result = result.filter((p) => p.audience === "Men" || p.audience === "Unisex");
  } else if (opts.category === "Women") {
    result = result.filter((p) => p.audience === "Women" || p.audience === "Unisex");
  } else if (opts.category === "Kids") {
    result = result.filter((p) => p.audience === "Kids");
  }

  // Narrows further to one specific category within the group above (e.g.
  // "Sarees" within Women) — matches the admin-managed category name a
  // product was tagged with in its `categories` list.
  if (opts.type) {
    const type = opts.type.toLowerCase();
    result = result.filter((p) => (p.categories ?? []).some((c) => c.toLowerCase() === type));
  }

  if (opts.occasion) {
    result = result.filter((p) => (p.occasions ?? []).includes(opts.occasion!));
  }

  if (opts.q) {
    const term = opts.q.toLowerCase();
    result = result.filter(
      (p) =>
        p.title.toLowerCase().includes(term) ||
        (p.tags ?? []).some((t) => t.toLowerCase().includes(term)) ||
        (p.categories ?? []).some((c) => c.toLowerCase().includes(term)) ||
        (p.designer ?? "").toLowerCase().includes(term) ||
        (p.subCategory ?? "").toLowerCase().includes(term) ||
        (p.fabric ?? "").toLowerCase().includes(term) ||
        (p.occasions ?? []).some((o) => o.toLowerCase().includes(term))
    );
  }

  if (opts.minPrice !== undefined) {
    result = result.filter((p) => p.price >= opts.minPrice!);
  }
  if (opts.maxPrice !== undefined) {
    result = result.filter((p) => p.price <= opts.maxPrice!);
  }
  if (opts.sizes && opts.sizes.length > 0) {
    result = result.filter((p) => (p.sizes ?? []).some((s) => opts.sizes!.includes(s)));
  }

  if (opts.sort === "price-asc") {
    result = [...result].sort((a, b) => a.price - b.price);
  } else if (opts.sort === "price-desc") {
    result = [...result].sort((a, b) => b.price - a.price);
  } else if (opts.sort === "newest") {
    result = [...result].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  }

  return result;
}

export { slugify };
