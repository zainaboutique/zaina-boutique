"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/utils";
import Script from "next/script";
import Link from "next/link";
import { X, CheckCircle2 } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { createOrder, validateDiscountCode, getSettings } from "@/lib/data";
import { buildWhatsAppLink } from "./WhatsAppButton";
import { INDIA_STATES } from "@/lib/india-states";
import type { Order, Settings } from "@/lib/types";

interface Props {
  onClose: () => void;
}

type PaymentMethod = "Cash on Delivery" | "Razorpay" | "WhatsApp Order";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export default function CheckoutModal({ onClose }: Props) {
  const { items, totalPrice, clear, close: closeCart } = useCartStore();
  const [step, setStep] = useState<"form" | "confirmed">("form");
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [discountInput, setDiscountInput] = useState("");
  const [discountApplied, setDiscountApplied] = useState<{ code: string; amount: number } | null>(null);
  const [discountError, setDiscountError] = useState("");
  const [settings, setSettings] = useState<Settings | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    payment: "Cash on Delivery" as PaymentMethod,
  });

  const update = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value as never }));

  useEffect(() => {
    getSettings().then((s) => {
      setSettings(s);
      // Default to whichever payment method is actually enabled.
      if (s.payments.codEnabled) {
        setForm((f) => ({ ...f, payment: "Cash on Delivery" }));
      } else if (s.payments.razorpayEnabled) {
        setForm((f) => ({ ...f, payment: "Razorpay" }));
      } else if (s.payments.whatsappOrderEnabled && s.whatsappNumber) {
        setForm((f) => ({ ...f, payment: "WhatsApp Order" }));
      }
    });
  }, []);

  function buildOrderWhatsAppMessage(order: Order): string {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const itemLines = order.items
      .map((i, idx) => `${idx + 1}) ${i.title}${i.color ? ` (${i.color})` : ""} — Size ${i.size} × ${i.quantity}\n${origin}/product/${i.slug || i.productId}`)
      .join("\n");
    return `Hi Zaina Boutique! I'd like to place order ${order.orderNumber} for ${formatPrice(order.total)}, delivering to ${form.address}, ${form.city}, ${form.state}.\n\nItems:\n${itemLines}`;
  }

  const subtotal = totalPrice();
  // Free shipping only when EVERY item in the cart qualifies — a single
  // item without the flag means the admin's flat fee still applies.
  const qualifiesForFreeShipping = items.length > 0 && items.every((i) => i.freeShipping);
  const shippingCost = qualifiesForFreeShipping ? 0 : (settings?.shippingFee ?? 0);
  const total = Math.max(0, subtotal - (discountApplied?.amount ?? 0)) + shippingCost;

  async function applyDiscount() {
    setDiscountError("");
    const match = await validateDiscountCode(discountInput);
    if (!match) {
      setDiscountError("Invalid or expired code.");
      setDiscountApplied(null);
      return;
    }
    const amount = match.type === "percent" ? (subtotal * match.value) / 100 : match.value;
    setDiscountApplied({ code: match.code, amount });
  }

  async function finalizeOrder(paymentMethod: PaymentMethod, razorpayPaymentId?: string): Promise<Order> {
    const order = await createOrder({
      customerName: form.name,
      email: form.email,
      phone: form.phone,
      address: form.address,
      city: form.city,
      state: form.state,
      items,
      subtotal,
      discountCode: discountApplied?.code,
      discountAmount: discountApplied?.amount,
      shippingCost,
      total,
      status: "Pending",
      paymentMethod,
      razorpayPaymentId,
      createdAt: Date.now(),
    });
    setConfirmedOrder(order);
    setStep("confirmed");
    clear();
    return order;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Open the tab synchronously, inside the click handler, before any
    // `await` — most browsers block window.open() once it's no longer
    // directly tied to the user's click, which async work in between breaks.
    let whatsappTab: Window | null = null;
    if (form.payment === "WhatsApp Order") {
      whatsappTab = window.open("", "_blank");
    }

    setSubmitting(true);
    try {
      if (form.payment === "Razorpay") {
        await payWithRazorpay();
      } else if (form.payment === "WhatsApp Order") {
        const order = await finalizeOrder("WhatsApp Order");
        if (order && settings?.whatsappNumber) {
          const url = buildWhatsAppLink(settings.whatsappNumber, buildOrderWhatsAppMessage(order));
          if (whatsappTab) {
            whatsappTab.location.href = url;
          } else {
            // Popup was blocked anyway — fall back to navigating this tab.
            window.location.href = url;
          }
        }
      } else {
        await finalizeOrder(form.payment);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function payWithRazorpay() {
    const settings = await getSettings();
    const res = await fetch("/api/razorpay/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: total }),
    });
    if (!res.ok) {
      alert("Payment setup failed. Please try Cash on Delivery instead, or check that RAZORPAY keys are configured.");
      return;
    }
    const { orderId, amount, currency, keyId } = await res.json();

    if (!window.Razorpay) {
      alert("Payment SDK failed to load. Please try again.");
      return;
    }

    const rzp = new window.Razorpay({
      key: keyId,
      amount,
      currency,
      name: "Zaina Boutique",
      description: "Order payment",
      order_id: orderId,
      prefill: { name: form.name, email: form.email, contact: form.phone },
      theme: { color: settings.accentColor },
      handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
        const verifyRes = await fetch("/api/razorpay/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(response),
        });
        if (verifyRes.ok) {
          await finalizeOrder("Razorpay", response.razorpay_payment_id);
        } else {
          alert("Payment verification failed. Please contact support before retrying.");
        }
      },
    });
    rzp.open();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white w-full md:max-w-md md:rounded-3xl rounded-t-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/5 sticky top-0 bg-white">
          <h2 className="font-bold text-lg">{step === "form" ? "Checkout" : "Order Confirmed"}</h2>
          <button onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {step === "form" ? (
          <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
            <input required placeholder="Full name" value={form.name} onChange={(e) => update("name", e.target.value)} className="w-full bg-bg rounded-2xl px-4 py-3 text-sm outline-none" />
            <input required type="email" placeholder="Email address" value={form.email} onChange={(e) => update("email", e.target.value)} className="w-full bg-bg rounded-2xl px-4 py-3 text-sm outline-none" />
            <input required placeholder="Phone number" value={form.phone} onChange={(e) => update("phone", e.target.value)} className="w-full bg-bg rounded-2xl px-4 py-3 text-sm outline-none" />
            <input required placeholder="Delivery address" value={form.address} onChange={(e) => update("address", e.target.value)} className="w-full bg-bg rounded-2xl px-4 py-3 text-sm outline-none" />
            <input required placeholder="City / District" value={form.city} onChange={(e) => update("city", e.target.value)} className="w-full bg-bg rounded-2xl px-4 py-3 text-sm outline-none" />
            <select
              required
              value={form.state}
              onChange={(e) => update("state", e.target.value)}
              className="w-full bg-bg rounded-2xl px-4 py-3 text-sm outline-none text-gray-700"
            >
              <option value="" disabled>Select State</option>
              {INDIA_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <div className="flex gap-2">
              <input
                placeholder="Discount code"
                value={discountInput}
                onChange={(e) => setDiscountInput(e.target.value)}
                className="flex-1 bg-bg rounded-2xl px-4 py-2.5 text-sm outline-none"
              />
              <button type="button" onClick={applyDiscount} className="bg-ink text-white text-sm font-semibold px-4 rounded-2xl">
                Apply
              </button>
            </div>
            {discountError && <p className="text-xs text-accent">{discountError}</p>}
            {discountApplied && <p className="text-xs text-green-600">Code {discountApplied.code} applied — {formatPrice(discountApplied.amount)} off.</p>}

            {(() => {
              const availableMethods: PaymentMethod[] = [
                ...(settings?.payments?.codEnabled !== false ? (["Cash on Delivery"] as PaymentMethod[]) : []),
                ...(settings?.payments?.razorpayEnabled ? (["Razorpay"] as PaymentMethod[]) : []),
                ...(settings?.payments?.whatsappOrderEnabled && settings?.whatsappNumber ? (["WhatsApp Order"] as PaymentMethod[]) : []),
              ];
              if (settings && availableMethods.length === 0) {
                return (
                  <p className="text-sm text-accent bg-accent/5 rounded-2xl px-4 py-3">
                    No payment method is currently available. Please contact us to place your order.
                  </p>
                );
              }
              return (
                <>
                  <div className="flex gap-2 pt-1">
                    {availableMethods.map((method) => (
                      <button
                        type="button"
                        key={method}
                        onClick={() => update("payment", method)}
                        className={`flex-1 text-xs sm:text-sm font-medium py-2.5 rounded-full ${form.payment === method ? "bg-ink text-white" : "bg-bg text-ink"}`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                  {form.payment === "WhatsApp Order" && (
                    <p className="text-xs text-gray-400">
                      We'll save your order, then open WhatsApp with everything filled in so you can send it to us directly.
                    </p>
                  )}
                </>
              );
            })()}

            <div className="space-y-1 pt-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {discountApplied && (
                <div className="flex items-center justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatPrice(discountApplied.amount)}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Shipping</span>
                <span className={shippingCost === 0 ? "text-green-600 font-medium" : ""}>
                  {shippingCost === 0 ? "Free" : formatPrice(shippingCost)}
                </span>
              </div>
              <div className="flex items-center justify-between font-bold text-base pt-1">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={
                submitting ||
                Boolean(
                  settings &&
                    settings.payments?.codEnabled === false &&
                    !settings.payments?.razorpayEnabled &&
                    !(settings.payments?.whatsappOrderEnabled && settings.whatsappNumber)
                )
              }
              className="w-full bg-ink text-white font-semibold py-3.5 rounded-full disabled:opacity-50"
            >
              {submitting
                ? form.payment === "WhatsApp Order"
                  ? "Opening WhatsApp..."
                  : "Placing order..."
                : form.payment === "Razorpay"
                ? "Pay & Place Order"
                : form.payment === "WhatsApp Order"
                ? "Order via WhatsApp"
                : "Place Order"}
            </button>
          </form>
        ) : confirmedOrder ? (
          <div className="px-5 py-8 text-center">
            <CheckCircle2 className="mx-auto text-green-500" size={48} />
            <h3 className="font-bold text-lg mt-4">Thank you, {form.name.split(" ")[0]}!</h3>
            <p className="text-sm text-gray-500 mt-1">Your order has been placed and is being processed.</p>
            <div className="bg-bg rounded-2xl p-4 mt-5 text-left text-sm space-y-1">
              <div className="flex justify-between"><span className="text-gray-500">Order Number</span><span className="font-bold">{confirmedOrder.orderNumber}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="font-semibold">{formatPrice(confirmedOrder.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span className="font-semibold">{!confirmedOrder.shippingCost ? "Free" : formatPrice(confirmedOrder.shippingCost)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Total</span><span className="font-semibold">{formatPrice(confirmedOrder.total)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Delivery to</span><span className="font-semibold text-right">{form.address}, {form.city}, {form.state}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Payment</span><span className="font-semibold">{form.payment}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Status</span><span className="font-semibold">Pending</span></div>
            </div>
            {settings?.whatsappNumber && (
              <a
                href={buildWhatsAppLink(settings.whatsappNumber, buildOrderWhatsAppMessage(confirmedOrder))}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-green-500 text-white font-semibold py-3 rounded-full mt-4 text-sm"
              >
                {form.payment === "WhatsApp Order" ? "Reopen WhatsApp" : "Confirm via WhatsApp"}
              </a>
            )}
            <Link href={`/track?order=${confirmedOrder.orderNumber}`} className="block w-full bg-bg font-semibold py-3 rounded-full mt-2 text-sm">
              Track This Order
            </Link>
            <button
              onClick={() => { onClose(); closeCart(); }}
              className="w-full bg-ink text-white font-semibold py-3.5 rounded-full mt-2"
            >
              Continue Shopping
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
