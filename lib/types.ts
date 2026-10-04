export type Badge = "Premium" | "Exclusive" | "On Sale" | "Trending" | "New" | "Best Seller" | "Featured";

export type Audience = "Women" | "Men" | "Kids" | "Unisex";
export type ShopGroup = "New Arrival" | "Women" | "Men" | "Kids";

// Legacy internal grouping, still used for a couple of demo filters.
export type ProductCategory = "Men" | "Women" | "Essentials" | "Winter" | "Everyday" | "Relaxed" | "Blazers";

export interface ProductDetails {
  material?: string;
  fit?: string;
  care?: string;
}

export interface ProductColor {
  name: string;
  hex?: string;
  photoUrl?: string;
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  designer?: string;
  audience: Audience;
  category: ProductCategory; // kept for backward compatibility with demo filtering
  categories: string[]; // garment-type chips, e.g. "Sarees", "Tops & Kurtis"
  subCategory?: string;
  fabric?: string;
  occasions?: string[]; // e.g. "Wedding", "Festive", "Party", "Casual", "Office"
  categoryId?: string;
  badges: Badge[];
  imageUrl: string;
  images?: string[];
  coverImageIndex?: number;
  colors?: ProductColor[];
  stock: number;
  inStock?: boolean; // independent availability flag for boutiques that don't track exact counts
  sizePricing?: string; // raw "SIZE:PRICE; SIZE:PRICE" passthrough — not yet applied to checkout math
  tags?: string[];
  sizes?: string[];
  freeShipping?: boolean;
  shippingCost?: number; // only used when freeShipping is false — overrides the site-wide shipping fee for this specific product
  details?: ProductDetails;
  createdAt?: number;
}

export interface ImagePosition {
  x: number; // 0-100, percentage from left
  y: number; // 0-100, percentage from top
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl: string;
  parent: ShopGroup;
  order: number;
  position?: ImagePosition; // focal point for the circular crop — defaults to center (50, 50)
}

export interface HeroBanner {
  id: string;
  imageUrl: string;
  headline: string;
  subtext: string;
  ctaLabel: string;
  ctaHref: string;
  order: number;
  desktopPosition?: ImagePosition; // focal point on wide screens — defaults to center (50, 50)
  mobilePosition?: ImagePosition; // separate focal point on narrow screens, since crops differ
}

export interface CartItem {
  productId: string;
  slug?: string; // product's URL slug, for linking back to it from cart/orders/WhatsApp — optional for orders placed before this field existed
  title: string;
  price: number;
  imageUrl: string;
  size: string;
  color?: string;
  quantity: number;
  freeShipping?: boolean; // copied from the product at add-to-cart time, so checkout can waive the shipping fee without re-fetching product data
  shippingCost?: number; // copied from the product's own shippingCost override, if the admin set one
}

export type OrderStatus = "Pending" | "Processed" | "Shipped" | "Delivered" | "Cancelled";

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state?: string; // optional for orders placed before this field existed
  pincode?: string; // 6-digit delivery PIN code, collected at checkout
  items: CartItem[];
  subtotal: number;
  discountCode?: string;
  discountAmount?: number;
  shippingCost?: number;
  total: number;
  status: OrderStatus;
  paymentMethod: "Cash on Delivery" | "Razorpay" | "WhatsApp Order";
  razorpayPaymentId?: string;
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  cancelledAt?: number;
  // Indices into `items` that the admin has cancelled individually (e.g. an
  // out-of-stock item in an otherwise fulfillable order) — the item stays in
  // the record for a full history, but is excluded from the revised total
  // and shown struck through wherever the order is displayed.
  cancelledItemIndexes?: number[];
  createdAt: number;
}

export interface CategoryBubble {
  id: string;
  label: string;
  imageUrl: string;
  category: ProductCategory | "All";
}

export interface Review {
  id: string;
  productId: string;
  name: string;
  rating: number;
  text: string;
  approved: boolean;
  createdAt: number;
}

export interface PageContent {
  slug: string;
  title: string;
  body: string;
  updatedAt: number;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  order: number;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string;
  content: string; // rich HTML from the admin editor
  author: string;
  status: "draft" | "published";
  createdAt: number;
  updatedAt: number;
}

export interface Discount {
  id: string;
  code: string;
  type: "percent" | "amount";
  value: number;
  active: boolean;
  expiresAt?: number;
}

export type UserRole = "customer" | "admin";

export interface SavedAddress {
  phone: string;
  address: string;
  city: string;
}

export interface AppUser {
  uid: string;
  email: string;
  name: string;
  photoURL?: string;
  role: UserRole;
  authProvider: "google" | "password";
  createdAt: number;
  defaultAddress?: SavedAddress;
}

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterColumn {
  title: string;
  links: FooterLink[];
}

export interface SocialLinks {
  instagram?: string;
  facebook?: string;
  tiktok?: string;
}

export interface PaymentSettings {
  codEnabled: boolean;
  razorpayEnabled: boolean;
  razorpayKeyId?: string; // public key — safe to store here, same value already sent to the browser during checkout
  whatsappOrderEnabled: boolean; // "Order via WhatsApp" — sends the order to the number set in Settings → Contact
}

export interface Settings {
  siteName: string;
  tagline: string;
  metaDescription?: string; // dedicated SEO description for the homepage — kept separate from tagline, since tagline is also shown visibly in the footer and the two often need different lengths
  shippingFee?: number; // flat fee in ₹, charged at checkout unless every item in the cart has freeShipping set; 0 or unset means free shipping site-wide
  mainCategoryImages?: Partial<Record<ShopGroup, string>>; // optional thumbnail per main group (New Arrival/Women/Men/Kids), shown in the nav — separate from the per-category images under Admin → Category, which are sub-categories within a group
  occasionCoverImages?: Partial<Record<string, string>>; // optional admin-set cover image per "Shop By Occasion" tile on the homepage (Festive/Party/Casual/etc.) — when set, this always wins over the automatic "first matching product" image, so the admin doesn't have to depend on which product happens to match first
  logoUrl?: string;
  logoMarkUrl?: string;
  primaryColor: string;
  accentColor: string;
  fontFamily: string; // key into FONT_OPTIONS ("inter" | "playfair" | ...), or "custom" to use the uploaded font below
  customFontUrl?: string; // uploaded .ttf/.otf/.woff/.woff2 file
  customFontName?: string; // display name for the uploaded font, used as its CSS font-family
  logoFontFamily: string; // separate from fontFamily — controls only the "ZAINA BOUTIQUE" wordmark next to the logo mark, independent of the site's body font
  announcementEnabled: boolean;
  announcementText: string;
  announcementHref?: string;
  whatsappNumber?: string;
  contactEmail?: string;
  address?: string;
  socialLinks?: SocialLinks;
  headerLinks: FooterLink[];
  footerColumns: FooterColumn[];
  payments: PaymentSettings;
}
