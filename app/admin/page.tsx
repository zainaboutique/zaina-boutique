"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/utils";
import { DollarSign, ShoppingCart, Package, Clock } from "lucide-react";
import { getProducts, getOrders } from "@/lib/data";
import type { Product, Order } from "@/lib/types";

export default function AdminOverviewPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [p, o] = await Promise.all([getProducts(), getOrders()]);
      setProducts(p);
      setOrders(o);
      setLoading(false);
    })();
  }, []);

  const totalSales = orders.reduce((sum, o) => sum + o.total, 0);
  const recentOrders = orders.slice(0, 5);

  const metrics = [
    { label: "Total Sales", value: formatPrice(totalSales), icon: DollarSign },
    { label: "Total Orders", value: orders.length, icon: ShoppingCart },
    { label: "Product Count", value: products.length, icon: Package },
    { label: "Pending Orders", value: orders.filter((o) => o.status === "Pending").length, icon: Clock },
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
