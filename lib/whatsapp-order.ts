// Builds the WhatsApp order message and validates the Indian PIN code.
// Kept free of imports so it can be tested on its own.

// Indian PIN codes are exactly 6 digits and never start with 0.
const PINCODE_RE = /^[1-9][0-9]{5}$/;

export function isValidPincode(value: string): boolean {
  return PINCODE_RE.test(value.trim());
}

export interface WaOrderItem {
  title: string;
  color?: string | null;
  size?: string | null;
  quantity: number;
  price: number;
  slug?: string | null;
  productId: string;
  // Optional — only shown if the cart item carries one.
  variant?: string | null;
  design?: string | null;
}

export interface WaOrderInput {
  orderNumber: string;
  items: WaOrderItem[];
  total: number;
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  origin: string;
  formatPrice: (n: number) => string;
}

export function buildWhatsAppOrderMessage(o: WaOrderInput): string {
  const multi = o.items.length > 1;

  const itemBlocks = o.items
    .map((i, idx) => {
      const variant = i.variant || i.design;
      const name = `${i.title}${variant ? ` (${variant})` : ""}`;
      const lines = [
        `👗 *${multi ? `Product ${idx + 1}` : "Product"}:* ${name}`,
        `🎨 *Color:* ${i.color || "—"}`,
        `📏 *Size:* ${i.size || "—"}`,
        `🔢 *Quantity:* ${i.quantity}`,
      ];
      if (multi) lines.push(`💵 *Price:* ${o.formatPrice(i.price)}`);
      return lines.join("\n");
    })
    .join("\n\n");

  const urls = o.items
    .map((i, idx) => {
      const url = `${o.origin}/product/${i.slug || i.productId}`;
      return multi ? `${idx + 1}) ${url}` : url;
    })
    .join("\n");

  return [
    "👋 *Hello Zaina Boutique!*",
    "",
    "🛍️ *I’d like to place an order*",
    "",
    `📦 *Order ID:* ${o.orderNumber}`,
    "",
    itemBlocks,
    // Single product: Total follows Quantity directly (as in the template).
    // Several products: a blank line separates the list from the Total.
    ...(multi ? [""] : []),
    `💰 *Total Amount:* ${o.formatPrice(o.total)}`,
    "",
    "🚚 *Delivery Details:*",
    "",
    `👤 *Name:* ${o.name.trim()}`,
    `📱 *Phone:* ${o.phone.trim()}`,
    "",
    `🏠 *Address:* ${o.address.trim()}`,
    `🏙️ *City:* ${o.city.trim()}`,
    `📍 *State:* ${o.state}`,
    `📮 *Pincode:* ${o.pincode.trim()}`,
    "",
    multi ? "🔗 *Products:*" : "🔗 *Product:*",
    urls,
    "",
    "✅ *Please confirm my order and share the next steps.*",
    "",
    "Thank you! ❤️",
    "*Zaina Boutique*",
  ].join("\n");
}
