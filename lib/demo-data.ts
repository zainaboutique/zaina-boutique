import type { Product, HeroBanner, Category, Settings, Discount, PageContent, FaqItem, BlogPost } from "./types";

const SIZES = ["S", "M", "L", "XL"];

export const SUGGESTED_CATEGORY_CHIPS = [
  "Sarees", "Lehengas", "Tops & Kurtis", "Frocks & Dresses", "Co-ord Sets",
  "Blouses", "Bottoms", "Loungewear", "Saree Materials", "Mom & Daughter",
];

export const OCCASIONS = ["Wedding", "Festive", "Party", "Casual", "Office"];

export const demoProducts: Product[] = [
  {
    id: "p1",
    title: "Classic Rib Trim Sweater",
    slug: "classic-rib-trim-sweater",
    description:
      "A soft ribbed-knit sweater with a clean crew neckline. Designed for everyday layering with a relaxed, elevated fit.",
    price: 2999,
    audience: "Unisex",
    category: "Essentials",
    categories: ["Tops & Kurtis", "Loungewear"],
    occasions: ["Casual", "Office"],
    fabric: "Cotton-Wool Blend",
    badges: ["Exclusive"],
    imageUrl: "https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=800&q=80"],
    coverImageIndex: 0,
    stock: 24,
    sizes: SIZES,
    freeShipping: true,
    tags: ["fresh picks", "knitwear"],
    details: { material: "78% Cotton, 22% Wool", fit: "Relaxed fit", care: "Hand wash cold, lay flat to dry" },
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
  },
  {
    id: "p2",
    title: "Cozy Textured Knit Cardigan",
    slug: "cozy-textured-knit-cardigan",
    description:
      "An oversized textured cardigan in a heavyweight knit, finished with horn-style buttons for a premium feel.",
    price: 3999,
    audience: "Women",
    category: "Winter",
    categories: ["Loungewear"],
    occasions: ["Casual", "Festive"],
    fabric: "Merino Wool",
    badges: ["Premium"],
    imageUrl: "https://images.unsplash.com/photo-1631541909061-71e349d1f203?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1631541909061-71e349d1f203?w=800&q=80"],
    coverImageIndex: 0,
    stock: 12,
    sizes: SIZES,
    freeShipping: false,
    tags: ["premium", "outerwear"],
    details: { material: "100% Merino Wool", fit: "Oversized fit", care: "Dry clean only" },
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
  },
  {
    id: "p3",
    title: "Soft Touch Stripe Top",
    slug: "soft-touch-stripe-top",
    description:
      "A breathable striped top made from a soft-touch cotton blend. Pairs easily with denim or tailored trousers.",
    price: 2399,
    audience: "Women",
    category: "Everyday",
    categories: ["Tops & Kurtis"],
    occasions: ["Casual", "Office"],
    fabric: "Cotton Blend",
    badges: ["Premium"],
    imageUrl: "https://images.unsplash.com/photo-1554568218-0f1715e72254?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1554568218-0f1715e72254?w=800&q=80"],
    coverImageIndex: 0,
    stock: 30,
    sizes: SIZES,
    freeShipping: true,
    tags: ["trending"],
    details: { material: "95% Cotton, 5% Elastane", fit: "Regular fit", care: "Machine wash cold" },
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 1,
  },
  {
    id: "p4",
    title: "Casual Men Shirt",
    slug: "casual-men-shirt",
    description:
      "A relaxed-fit shirt in a lightweight woven fabric, built for warm-weather comfort without losing structure.",
    price: 2999,
    audience: "Men",
    category: "Men",
    categories: ["Tops & Kurtis"],
    occasions: ["Casual", "Office"],
    fabric: "Linen",
    badges: ["Premium"],
    imageUrl: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&q=80"],
    coverImageIndex: 0,
    stock: 18,
    sizes: SIZES,
    freeShipping: false,
    tags: ["men"],
    details: { material: "100% Linen", fit: "Relaxed fit", care: "Machine wash cold, iron low" },
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
  },
  {
    id: "p5",
    title: "Relaxed Collar Knit",
    slug: "relaxed-collar-knit",
    description: "A collared knit top that blends smart-casual polish with the comfort of soft yarns.",
    price: 2799,
    audience: "Unisex",
    category: "Relaxed",
    categories: ["Tops & Kurtis", "Co-ord Sets"],
    occasions: ["Casual"],
    fabric: "Cotton-Acrylic Blend",
    badges: ["Premium"],
    imageUrl: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&q=80"],
    coverImageIndex: 0,
    stock: 20,
    sizes: SIZES,
    freeShipping: true,
    tags: ["relaxed"],
    details: { material: "60% Cotton, 40% Acrylic", fit: "Regular fit", care: "Hand wash cold" },
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
  },
  {
    id: "p6",
    title: "Wide Stripe Polo",
    slug: "wide-stripe-polo",
    description: "A wide-stripe polo shirt in breathable piqué cotton with a ribbed collar and two-button placket.",
    price: 3999,
    audience: "Men",
    category: "Men",
    categories: ["Tops & Kurtis"],
    occasions: ["Casual", "Party"],
    fabric: "Pique Cotton",
    badges: [],
    imageUrl: "https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800&q=80"],
    coverImageIndex: 0,
    stock: 15,
    sizes: SIZES,
    freeShipping: false,
    tags: ["trending", "men"],
    details: { material: "100% Pique Cotton", fit: "Regular fit", care: "Machine wash cold" },
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 10,
  },
];

export const demoBanners: HeroBanner[] = [
  {
    id: "b1",
    imageUrl: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1200&q=80",
    headline: "Discover Your Signature Everyday Style",
    subtext: "New season essentials, made to layer.",
    ctaLabel: "Shop Now",
    ctaHref: "/shop",
    order: 0,
  },
  {
    id: "b2",
    imageUrl: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&q=80",
    headline: "Winter Knitwear, Reimagined",
    subtext: "Heavyweight knits built for the season ahead.",
    ctaLabel: "Explore Winter",
    ctaHref: "/shop?occasion=Festive",
    order: 1,
  },
];

export const demoCategories: Category[] = [
  { id: "cat1", name: "New Arrivals", slug: "new-arrivals", parent: "New Arrival", order: 0, imageUrl: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=300&q=80" },
  { id: "cat2", name: "Women's Essentials", slug: "women-essentials", parent: "Women", order: 1, imageUrl: "https://images.unsplash.com/photo-1554568218-0f1715e72254?w=300&q=80" },
  { id: "cat3", name: "Men's Shirts", slug: "mens-shirts", parent: "Men", order: 2, imageUrl: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=300&q=80" },
  { id: "cat4", name: "Kids Knitwear", slug: "kids-knitwear", parent: "Kids", order: 3, imageUrl: "https://images.unsplash.com/photo-1631541909061-71e349d1f203?w=300&q=80" },
];

export const demoSettings: Settings = {
  siteName: "Zaina Boutique",
  tagline: "Your luxury multi-designer destination for the finest Indian and contemporary fashion.",
  logoUrl: "/logo.png",
  logoMarkUrl: "/logo-mark.png",
  primaryColor: "#111111",
  accentColor: "#EF4444",
  fontFamily: "inter",
  logoFontFamily: "raleway",
  announcementEnabled: true,
  announcementText: "New Season Drop is Live — Shop Now",
  announcementHref: "/shop",
  whatsappNumber: "918344867027",
  contactEmail: "zainaboutique95@gmail.com",
  address: "Kaniyakumari, Tamil Nadu 629175, India",
  socialLinks: { instagram: "https://instagram.com", facebook: "https://facebook.com" },
  headerLinks: [
    { label: "Home", href: "/" },
    { label: "New Arrivals", href: "/shop?category=New%20Arrival" },
    { label: "Track Order", href: "/track" },
  ],
  footerColumns: [
    {
      title: "Shop",
      links: [
        { label: "New Arrivals", href: "/shop?category=New%20Arrival" },
        { label: "Women", href: "/shop?category=Women" },
        { label: "Men", href: "/shop?category=Men" },
        { label: "Kids", href: "/shop?category=Kids" },
      ],
    },
    {
      title: "Buying Guide",
      links: [
        { label: "Size Guide", href: "/size-guide" },
        { label: "Shipping & Delivery", href: "/shipping" },
        { label: "Return & Exchange", href: "/returns" },
        { label: "Payment Options", href: "/payment-options" },
        { label: "FAQs", href: "/faq" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About Us", href: "/about" },
        { label: "Journal", href: "/blog" },
        { label: "Store Locator", href: "/store-locator" },
        { label: "Contact Us", href: "/contact" },
      ],
    },
    {
      title: "Policies",
      links: [
        { label: "Terms & Conditions", href: "/terms" },
        { label: "Privacy Policy", href: "/privacy" },
      ],
    },
  ],
  payments: {
    codEnabled: true,
    razorpayEnabled: false,
    razorpayKeyId: "",
    whatsappOrderEnabled: false,
  },
};

export const demoDiscounts: Discount[] = [
  { id: "d1", code: "WELCOME10", type: "percent", value: 10, active: true },
];

// Editable content pages — Admin → Pages lets the store owner rewrite any of these.
export const demoPages: PageContent[] = [
  {
    slug: "about",
    title: "About Us",
    body: "Zaina Boutique is your luxury multi-designer destination for the finest Indian and contemporary fashion.\n\nWe partner with independent designers and trusted manufacturers to bring you sarees, lehengas, kurtis, and everyday essentials that blend traditional craftsmanship with modern style.\n\nEvery piece is chosen with care — for quality, for fit, and for the moments you'll wear it to.",
    updatedAt: Date.now(),
  },
  {
    slug: "shipping",
    title: "Shipping & Delivery",
    body: "We ship across India. Orders are typically processed within 1-2 business days and delivered within 5-7 business days, depending on your location.\n\nFree shipping is available on select items, shown with a Free Shipping badge on the product page.\n\nOnce your order ships, you'll receive tracking details on your order tracking page.",
    updatedAt: Date.now(),
  },
  {
    slug: "returns",
    title: "Return & Exchange",
    body: "We want you to love what you ordered. If something isn't right, you can request a return or exchange within 7 days of delivery.\n\nItems must be unused, unwashed, and in their original packaging with tags attached.\n\nTo start a return or exchange, contact us with your order number and we'll guide you through the next steps.",
    updatedAt: Date.now(),
  },
  {
    slug: "payment-options",
    title: "Payment Options",
    body: "We currently accept Cash on Delivery and secure online payments via Razorpay, which supports Cards, UPI, Netbanking, and popular wallets.\n\nAvailable payment methods are shown at checkout — if a method isn't showing, it may be temporarily disabled.",
    updatedAt: Date.now(),
  },
  {
    slug: "size-guide",
    title: "Size Guide",
    body: "Our sizes generally follow standard Indian sizing. If you're between sizes, we recommend sizing up for a more relaxed fit.\n\nFor garments with custom measurements (like blouses or lehengas), check the product page for size-specific details, or contact us for personalized guidance.",
    updatedAt: Date.now(),
  },
  {
    slug: "terms",
    title: "Terms & Conditions",
    body: "By using this website and placing an order, you agree to our terms of sale, including our pricing, payment, and delivery policies as described throughout this site.\n\nWe reserve the right to update these terms at any time. Continued use of the site after changes means you accept the updated terms.",
    updatedAt: Date.now(),
  },
  {
    slug: "privacy",
    title: "Privacy Policy",
    body: "We collect only the information needed to process your orders — your name, contact details, and delivery address.\n\nWe never sell your information to third parties. Payment details are handled securely by our payment processor and are never stored on our servers.",
    updatedAt: Date.now(),
  },
];

export const demoFaqs: FaqItem[] = [
  { id: "f1", question: "How long does delivery take?", answer: "Most orders arrive within 5-7 business days after dispatch. You'll get tracking details once your order ships.", order: 0 },
  { id: "f2", question: "Can I cancel my order?", answer: "Yes — you can cancel from your order tracking page any time before it ships, or contact us for help.", order: 1 },
  { id: "f3", question: "What payment methods do you accept?", answer: "Cash on Delivery and Razorpay (Cards, UPI, Netbanking, and popular wallets), where enabled.", order: 2 },
  { id: "f4", question: "How do I return or exchange an item?", answer: "Contact us within 7 days of delivery with your order number, and we'll guide you through the process.", order: 3 },
];

export const demoBlogPosts: BlogPost[] = [
  {
    id: "b1",
    slug: "welcome-to-our-journal",
    title: "Welcome to Our Journal",
    excerpt: "Style notes, styling tips, and stories from Zaina Boutique — starting here.",
    coverImage: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&q=80",
    content: "<p>This is your first blog post. Open Admin → Blog to edit this, or write a new one — you can format text, add links, and insert photos right in the editor.</p>",
    author: "Zaina Boutique",
    status: "published",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];
