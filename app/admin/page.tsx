"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/utils";
import { DollarSign, ShoppingCart, Package, Clock } from "lucide-react";
import {
  collection,
  getAggregateFromServer,
  getCountFromServer,
  getDocs,
  limit,
  orderBy,
  query,
  sum,
  where,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { getProducts, getOrders } from "@/lib/data";
import type { Order } from "@/lib/types";

interface Overview {
  totalSales: number;
  totalOrders: number;
  productCount: number;
  pendingOrders: number;
  recentOrders: Order[];
}

// Asks Firebase for the counts and the sales total directly, and fetches only
// the 5 newest orders — instead of downloading every product and every order.
async function loadOverview(): Promise<Overview> {
  if (isFirebaseConfigured && db) {
    try {
      const firestore = db;
      const orders = collection(firestore, "orders");
      const [productsCount, ordersCount, pendingCount, salesTotal, recentSnap] = await Promise.all([
        getCountFromServer(collection(firestore, "products")),
        getCountFromServer(orders),
        getCountFromServer(query(orders, where("status", "==", "Pending"))),
        getAggregateFromServer(orders, { totalSales: sum("total") }),
        getDocs(query(orders, orderBy("createdAt", "desc"), limit(5))),
      ]);
      return {
        totalSales: Number(salesTotal.data().totalSales ?? 0),
        totalOrders: ordersCount.data().count,
        productCount: productsCount.data().count,
        pendingOrders: pendingCount.data().count,
        recentOrders: recentSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Order, "id">) })),
      };
    } catch (err) {
      console.warn("Overview: quick counts failed, loading the full lists instead.", err);
    }
  }

  // Fallback (demo mode, or if the quick way fails): the original full load.
  const [products, orders] = await Promise.all([getProducts(), getOrders()]);
  return {
    totalSales: orders.reduce((sumSoFar, o) => sumSoFar + o.total, 0),
    totalOrders: orders.length,
    productCount: products.length,
    pendingOrders: orders.filter((o) => o.status === "Pending").length,
    recentOrders: orders.slice(0, 5),
  };
}

export default function AdminOverviewPage() {
  const [overview, setOverview] = useState<Overview | null>(null);

  useEffect(() => {
    loadOverview().then(setOverview);
  }, []);

  const loading = overview === null;
  const recentOrders = overview?.recentOrders ?? [];

  const metrics = [
    { label: "Total Sales", value: formatPrice(overview?.totalSales ?? 0), icon: DollarSign },
    { label: "Total Orders", value: overview?.totalOrders ?? 0, icon: ShoppingCart },
    { label: "Product Count", value: overview?.productCount ?? 0, icon: Package },
    { label: "Pending Orders", value: overview?.pendingOrders ?? 0, icon: Clock },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold">Overview</h1>
      <p className="text-sm text-gray-400 mt-1">Store performance at a glance.</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {metrics.map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-white rounded-2xl shadow-card p-4">
            <div className="w-9 h-9 rounded-xl bg-bg flex items-center justify-center">
              <Icon size={16} />
            </div>
            <p className="text-xs text-gray-400 mt-3">{label}</p>
            <p className="text-lg font-bold mt-0.5">{loading ? "…" : value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-card mt-6 p-5">
        <h2 className="font-semibold">Recent Activity</h2>
        {loading ? (
          <p className="text-sm text-gray-400 mt-3">Loading...</p>
        ) : recentOrders.length === 0 ? (
          <p className="text-sm text-gray-400 mt-3">No orders yet.</p>
        ) : (
          <div className="mt-3 divide-y divide-black/5">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-medium">{order.customerName}</p>
                  <p className="text-gray-400 text-xs">{new Date(order.createdAt).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatPrice(order.total)}</p>
                  <span className="text-xs text-gray-400">{order.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
