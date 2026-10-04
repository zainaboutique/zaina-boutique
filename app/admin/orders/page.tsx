"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/utils";
import { X } from "lucide-react";
import Link from "next/link";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { getOrders, updateOrderStatus, updateOrderTracking, cancelOrderItem, restoreOrderItem, revisedOrderTotal } from "@/lib/data";
import type { Order, OrderStatus } from "@/lib/types";

const PAGE_SIZE = 50;

const STATUS_DOT: Record<OrderStatus, string> = {
  Pending: "bg-gray-300",
  Processed: "bg-blue-500",
  Shipped: "bg-purple-500",
  Delivered: "bg-green-500",
  Cancelled: "bg-red-500",
};

const STATUS_TEXT: Record<OrderStatus, string> = {
  Pending: "text-gray-500",
  Processed: "text-blue-600",
  Shipped: "text-purple-600",
  Delivered: "text-green-600",
  Cancelled: "text-red-600",
};

// Loads orders newest-first, 50 at a time, instead of downloading all of them.
async function fetchOrdersPage(after: QueryDocumentSnapshot | null) {
  if (isFirebaseConfigured && db) {
    const base = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const pageQuery = after ? query(base, startAfter(after), limit(PAGE_SIZE)) : query(base, limit(PAGE_SIZE));
    const snap = await getDocs(pageQuery);
    return {
      orders: snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Order, "id">) })),
      cursor: snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null,
      hasMore: snap.docs.length === PAGE_SIZE,
    };
  }
  // Demo mode (no Firebase): everything comes back in one go.
  return { orders: await getOrders(), cursor: null as QueryDocumentSnapshot | null, hasMore: false };
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [selected, setSelected] = useState<Order | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);
  const [trackingForm, setTrackingForm] = useState({ carrier: "", trackingNumber: "", trackingUrl: "" });
  const [trackingSaving, setTrackingSaving] = useState(false);
  const [trackingSaved, setTrackingSaved] = useState(false);

  async function refresh() {
    setLoading(true);
    const page = await fetchOrdersPage(null);
    setOrders(page.orders);
    setCursor(page.cursor);
    setHasMore(page.hasMore);
    setLoading(false);
  }

  async function loadMore() {
    setLoadingMore(true);
    try {
      const page = await fetchOrdersPage(cursor);
      setOrders((prev) => [...prev, ...page.orders]);
      setCursor(page.cursor);
      setHasMore(page.hasMore);
    } finally {
      setLoadingMore(false);
    }
  }

  // After a change, update just that row in the list — no need to download everything again.
  function patchOrder(id: string, changes: Partial<Order>) {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...changes } : o)));
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleStatusChange(id: string, status: OrderStatus) {
    await updateOrderStatus(id, status);
    patchOrder(id, status === "Cancelled" ? { status, cancelledAt: Date.now() } : { status });
    setSelected((s) => (s && s.id === id ? { ...s, status } : s));
  }

  async function handleToggleItemCancel(itemIndex: number, currentlyCancelled: boolean) {
    if (!selected) return;
    const updated = currentlyCancelled
      ? await restoreOrderItem(selected, itemIndex)
      : await cancelOrderItem(selected, itemIndex);
    setSelected(updated);
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
  }

  function openOrder(order: Order) {
    setSelected(order);
    setTrackingForm({
      carrier: order.carrier || "",
      trackingNumber: order.trackingNumber || "",
      trackingUrl: order.trackingUrl || "",
    });
    setTrackingSaved(false);
  }

  async function saveTracking() {
    if (!selected) return;
    setTrackingSaving(true);
    try {
      await updateOrderTracking(selected.id, trackingForm);
      setSelected({ ...selected, ...trackingForm });
      patchOrder(selected.id, trackingForm);
      setTrackingSaved(true);
    } finally {
      setTrackingSaving(false);
    }
  }

  async function confirmCancel() {
    if (!cancelTarget) return;
    await updateOrderStatus(cancelTarget.id, "Cancelled");
    patchOrder(cancelTarget.id, { status: "Cancelled", cancelledAt: Date.now() });
    setCancelTarget(null);
    setSelected(null);
  }

  const selectedPincode = selected ? (selected as Order & { pincode?: string }).pincode : undefined;

  return (
    <div>
      <h1 className="text-2xl font-bold">Orders</h1>
      <p className="text-sm text-gray-400 mt-1">Track fulfillment status and cancel orders when needed.</p>

      <div className="bg-white rounded-2xl shadow-card mt-6 overflow-x-auto">
        <table className="w-full text-sm min-w-[760px]">
          <thead>
            <tr className="text-left text-gray-400 border-b border-black/5">
              <th className="px-4 py-3 font-medium">Order #</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Items</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">Loading...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">No orders yet.</td></tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} onClick={() => openOrder(order)} className="border-b border-black/5 last:border-0 cursor-pointer hover:bg-bg/50">
                  <td className="px-4 py-3 font-mono text-xs font-semibold">{order.orderNumber}</td>
                  <td className="px-4 py-3 font-medium">{order.customerName}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{order.items.reduce((s, i) => s + i.quantity, 0)}</td>
                  <td className={`px-4 py-3 font-semibold ${order.status === "Cancelled" ? "line-through text-gray-400" : ""}`}>{formatPrice(order.total)}</td>
                  <td className="px-4 py-3">
                    <span className={`flex items-center gap-1.5 text-xs font-semibold ${STATUS_TEXT[order.status]}`}>
                      <span className={`w-2 h-2 rounded-full ${STATUS_DOT[order.status]}`} />
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && orders.length > 0 && (
        <div className="flex items-center justify-center gap-3 mt-4 text-xs text-gray-400">
          <span>Showing {orders.length} order{orders.length === 1 ? "" : "s"}</span>
          {hasMore && (
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="bg-white shadow-card text-ink font-semibold text-sm px-5 py-2 rounded-full disabled:opacity-50"
            >
              {loadingMore ? "Loading..." : "Load more"}
            </button>
          )}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelected(null)} />
          <div className="relative bg-white w-full md:max-w-md md:rounded-3xl rounded-t-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-black/5 sticky top-0 bg-white">
              <h2 className="font-bold text-lg">Order {selected.orderNumber}</h2>
              <button onClick={() => setSelected(null)} aria-label="Close"><X size={20} /></button>
            </div>
            <div className="px-5 py-4 space-y-4 text-sm">
              <div>
                <p className="text-gray-400 text-xs">Customer</p>
                <p className="font-medium">{selected.customerName}</p>
                <p className="text-gray-500">{selected.email} · {selected.phone}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Shipping Address</p>
                <p className="font-medium">
                  {selected.address}, {selected.city}{selected.state ? `, ${selected.state}` : ""}
                  {selectedPincode ? ` - ${selectedPincode}` : ""}
                </p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-gray-400 text-xs">Items</p>
                  <p className="text-gray-400 text-xs">If one is out of stock, cancel just that item</p>
                </div>
                <div className="divide-y divide-black/5">
                  {selected.items.map((item, idx) => {
                    const isCancelled = selected.cancelledItemIndexes?.includes(idx);
                    return (
                      <div key={item.productId + item.size + (item.color || "") + idx} className={`flex items-center justify-between gap-2 py-2 ${isCancelled ? "opacity-50" : ""}`}>
                        <span className={isCancelled ? "line-through" : ""}>
                          <Link href={`/product/${item.slug || item.productId}`} target="_blank" className="underline hover:text-ink">{item.title}</Link>
                          {" "}{(item.size || item.color) && `(${[item.size, item.color].filter(Boolean).join(", ")}) `}× {item.quantity}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`font-medium ${isCancelled ? "line-through" : ""}`}>{formatPrice(item.price * item.quantity)}</span>
                          <button
                            onClick={() => handleToggleItemCancel(idx, Boolean(isCancelled))}
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${isCancelled ? "bg-bg text-ink" : "bg-accent/10 text-accent"}`}
                          >
                            {isCancelled ? "Restore" : "Cancel"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              {selected.discountAmount ? (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Discount ({selected.discountCode})</span>
                  <span className="font-medium text-green-600">-{formatPrice(selected.discountAmount)}</span>
                </div>
              ) : null}
              {typeof selected.shippingCost === "number" && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Shipping</span>
                  <span className="font-medium">{selected.shippingCost === 0 ? "Free" : formatPrice(selected.shippingCost)}</span>
                </div>
              )}
              {selected.cancelledItemIndexes && selected.cancelledItemIndexes.length > 0 ? (
                <>
                  <div className="flex justify-between text-sm text-gray-400 line-through">
                    <span>Original Total</span>
                    <span>{formatPrice(selected.total)}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t border-black/5 pt-3">
                    <span>Revised Total</span>
                    <span>{formatPrice(revisedOrderTotal(selected))}</span>
                  </div>
                  {selected.paymentMethod === "Razorpay" && (
                    <p className="text-xs text-accent -mt-2">
                      This order was prepaid — refund the difference to the customer manually through your Razorpay dashboard.
                    </p>
                  )}
                </>
              ) : (
                <div className="flex justify-between font-bold border-t border-black/5 pt-3">
                  <span>Total</span>
                  <span>{formatPrice(selected.total)}</span>
                </div>
              )}
              <div>
                <p className="text-gray-400 text-xs mb-2">Update Status</p>
                <select
                  value={selected.status}
                  onChange={(e) => handleStatusChange(selected.id, e.target.value as OrderStatus)}
                  disabled={selected.status === "Cancelled"}
                  className="w-full bg-bg rounded-2xl px-4 py-3 text-sm outline-none disabled:opacity-50"
                >
                  <option value="Pending">Pending</option>
                  <option value="Processed">Processed</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                </select>
              </div>
              {selected.status !== "Cancelled" && selected.status !== "Delivered" && (
                <button onClick={() => setCancelTarget(selected)} className="w-full text-accent font-semibold text-sm py-2">
                  Cancel This Order
                </button>
              )}

              <div className="border-t border-black/5 pt-4">
                <p className="text-gray-400 text-xs mb-2">Shipping / Delivery Tracking</p>
                <div className="space-y-2">
                  <input
                    placeholder="Delivery partner (e.g. Delhivery, Blue Dart, India Post)"
                    value={trackingForm.carrier}
                    onChange={(e) => setTrackingForm((f) => ({ ...f, carrier: e.target.value }))}
                    className="w-full bg-bg rounded-2xl px-4 py-2.5 text-sm outline-none"
                  />
                  <input
                    placeholder="Tracking number"
                    value={trackingForm.trackingNumber}
                    onChange={(e) => setTrackingForm((f) => ({ ...f, trackingNumber: e.target.value }))}
                    className="w-full bg-bg rounded-2xl px-4 py-2.5 text-sm outline-none"
                  />
                  <input
                    placeholder="Tracking link (https://...)"
                    value={trackingForm.trackingUrl}
                    onChange={(e) => setTrackingForm((f) => ({ ...f, trackingUrl: e.target.value }))}
                    className="w-full bg-bg rounded-2xl px-4 py-2.5 text-sm outline-none"
                  />
                  <button
                    onClick={saveTracking}
                    disabled={trackingSaving}
                    className="w-full bg-ink text-white font-semibold py-3 rounded-full text-sm disabled:opacity-50"
                  >
                    {trackingSaving ? "Saving..." : "Save Tracking Info"}
                  </button>
                  {trackingSaved && <p className="text-xs text-green-600 text-center">Saved — the customer will see this on their tracking page.</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {cancelTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setCancelTarget(null)} />
          <div className="relative bg-white rounded-3xl p-6 w-full max-w-sm text-center">
            <h3 className="font-bold">Cancel order {cancelTarget.orderNumber}?</h3>
            <p className="text-sm text-gray-400 mt-1">The customer will see this order as cancelled when tracking it.</p>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setCancelTarget(null)} className="flex-1 bg-bg font-semibold py-3 rounded-full text-sm">Keep Order</button>
              <button onClick={confirmCancel} className="flex-1 bg-accent text-white font-semibold py-3 rounded-full text-sm">Cancel Order</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
