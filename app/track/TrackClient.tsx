"use client";

import { useState, Suspense, useEffect } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Truck, ExternalLink } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { findOrderByNumber, updateOrderStatus } from "@/lib/data";
import type { Order, OrderStatus } from "@/lib/types";

const STEPS: OrderStatus[] = ["Pending", "Processed", "Shipped", "Delivered"];

function TrackContent() {
  const searchParams = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(searchParams.get("order") || "");
  const [result, setResult] = useState<Order | null | undefined>(undefined);
  const [searched, setSearched] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [needSignIn, setNeedSignIn] = useState(false);

  // Wait for Firebase to tell us whether the customer is signed in.
  useEffect(() => {
    if (!auth) {
      // Demo mode (no Firebase): nothing to sign in to.
      setSignedIn(true);
      setAuthReady(true);
      return;
    }
    const unsub = onAuthStateChanged(auth, (user) => {
      setSignedIn(!!user);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  async function search(num: string) {
    if (!num.trim()) return;
    if (!signedIn) {
      setNeedSignIn(true);
      setResult(undefined);
      setSearched(false);
      return;
    }
    setNeedSignIn(false);
    const order = await findOrderByNumber(num);
    setResult(order);
    setSearched(true);
  }

  async function handleCustomerCancel() {
    if (!result) return;
    setCancelling(true);
    try {
      await updateOrderStatus(result.id, "Cancelled");
      setResult({ ...result, status: "Cancelled" });
      setConfirmCancel(false);
    } finally {
      setCancelling(false);
    }
  }

  // If the page was opened with ?order=..., search once we know who is signed in.
  useEffect(() => {
    if (!authReady) return;
    const fromLink = searchParams.get("order");
    if (fromLink) search(fromLink);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady]);

  const canCancel = result && (result.status === "Pending" || result.status === "Processed");

  return (
    <div className="min-h-screen bg-bg pb-8">
      <div className="max-w-md mx-auto px-4 pt-10">
        <h1 className="text-2xl font-bold text-center">Track Your Order</h1>
        <p className="text-sm text-gray-400 text-center mt-1">Sign in, then enter the order number from your confirmation screen.</p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            search(orderNumber);
          }}
          className="flex gap-2 mt-6"
        >
          <input
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="e.g. ZB-2026-48213"
            className="flex-1 bg-card rounded-full px-4 py-3 text-sm outline-none shadow-card"
          />
          <button type="submit" className="bg-ink text-white text-sm font-semibold px-5 rounded-full">
            Find
          </button>
        </form>

        {needSignIn && (
          <div className="bg-card rounded-2xl shadow-card p-4 mt-6 text-center">
            <p className="text-sm font-medium">Please sign in to track your order.</p>
            <Link
              href="/account"
              className="inline-block bg-ink text-white text-sm font-semibold px-6 py-2.5 rounded-full mt-3"
            >
              Sign In
            </Link>
          </div>
        )}

        {searched && result === null && (
          <div className="flex items-center gap-2 text-sm text-accent mt-6">
            <XCircle size={18} /> No order found with that number on your account.
          </div>
        )}

        {result && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-6">
              {STEPS.map((step, i) => {
                const currentIdx = STEPS.indexOf(result.status === "Cancelled" ? "Pending" : result.status);
                const reached = i <= currentIdx;
                return (
                  <div key={step} className="flex-1 text-center">
                    <div className={`w-3 h-3 rounded-full mx-auto ${reached ? "bg-ink" : "bg-black/10"}`} />
                    <p className={`text-[11px] mt-1 ${reached ? "font-semibold" : "text-gray-400"}`}>{step}</p>
                  </div>
                );
              })}
            </div>

            {result.status === "Cancelled" && (
              <div className="flex items-center gap-2 text-sm text-accent font-medium mb-4">
                <XCircle size={16} /> This order was cancelled.
              </div>
            )}

            <div className="bg-card rounded-2xl shadow-card p-4 text-sm space-y-1.5">
              <div className="flex justify-between"><span className="text-gray-400">Order</span><span className="font-semibold">{result.orderNumber}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Subtotal</span><span className="font-semibold">{formatPrice(result.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Shipping</span><span className="font-semibold">{!result.shippingCost ? "Free" : formatPrice(result.shippingCost)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Total</span><span className="font-semibold">{formatPrice(result.total)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Delivery to</span><span className="font-semibold text-right">{result.city}{result.state ? `, ${result.state}` : ""}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Placed</span><span className="font-semibold">{new Date(result.createdAt).toLocaleDateString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Status</span><span className="font-semibold flex items-center gap-1">{result.status === "Delivered" && <CheckCircle2 size={14} className="text-green-600" />} {result.status}</span></div>
            </div>

            <div className="bg-card rounded-2xl shadow-card p-4 text-sm mt-3">
              <p className="text-gray-400 text-xs mb-2">Items</p>
              <div className="divide-y divide-black/5">
                {result.items.map((item, idx) => {
                  const isCancelled = result.cancelledItemIndexes?.includes(idx);
                  return (
                    <div key={item.productId + item.size + (item.color || "") + idx} className={`flex justify-between py-2 ${isCancelled ? "opacity-50" : ""}`}>
                      <span className={isCancelled ? "line-through" : ""}>
                        <Link href={`/product/${item.slug || item.productId}`} className="underline hover:text-ink">{item.title}</Link>
                        {" "}{(item.size || item.color) && `(${[item.size, item.color].filter(Boolean).join(", ")}) `}× {item.quantity}
                        {isCancelled && <span className="ml-1.5 text-accent no-underline">(Cancelled — out of stock)</span>}
                      </span>
                      <span className={`font-medium ${isCancelled ? "line-through" : ""}`}>{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {(result.carrier || result.trackingNumber || result.trackingUrl) && (
              <div className="bg-card rounded-2xl shadow-card p-4 text-sm space-y-1.5 mt-3">
                <div className="flex items-center gap-2 font-semibold mb-1">
                  <Truck size={15} /> Shipment Details
                </div>
                {result.carrier && <div className="flex justify-between"><span className="text-gray-400">Carrier</span><span className="font-medium">{result.carrier}</span></div>}
                {result.trackingNumber && <div className="flex justify-between"><span className="text-gray-400">Tracking #</span><span className="font-medium">{result.trackingNumber}</span></div>}
                {result.trackingUrl && (
                  <a
                    href={result.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 w-full bg-ink text-white font-semibold py-2.5 rounded-full text-sm mt-2"
                  >
                    Track Package <ExternalLink size={13} />
                  </a>
                )}
              </div>
            )}

            {canCancel && (
              <button
                onClick={() => setConfirmCancel(true)}
                className="w-full text-accent font-semibold text-sm py-3 mt-4"
              >
                Cancel This Order
              </button>
            )}
          </div>
        )}

        {confirmCancel && result && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setConfirmCancel(false)} />
            <div className="relative bg-white rounded-3xl p-6 w-full max-w-sm text-center">
              <h3 className="font-bold">Cancel order {result.orderNumber}?</h3>
              <p className="text-sm text-gray-400 mt-1">This cannot be undone. If it's already on its way, please contact us instead.</p>
              <div className="flex gap-2 mt-5">
                <button onClick={() => setConfirmCancel(false)} className="flex-1 bg-bg font-semibold py-3 rounded-full text-sm">Keep Order</button>
                <button onClick={handleCustomerCancel} disabled={cancelling} className="flex-1 bg-accent text-white font-semibold py-3 rounded-full text-sm disabled:opacity-50">
                  {cancelling ? "Cancelling..." : "Cancel Order"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <TrackContent />
    </Suspense>
  );
}
