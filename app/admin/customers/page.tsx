"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, ShieldOff } from "lucide-react";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "@/lib/firebase";
import { getUsers, grantAdmin, revokeAdmin } from "@/lib/data";
import type { AppUser } from "@/lib/types";

const PAGE_SIZE = 50;

// Loads customers newest-first, 50 at a time, instead of downloading everyone.
async function fetchUsersPage(after: QueryDocumentSnapshot | null) {
  if (isFirebaseConfigured && db) {
    const base = query(collection(db, "users"), orderBy("createdAt", "desc"));
    const pageQuery = after ? query(base, startAfter(after), limit(PAGE_SIZE)) : query(base, limit(PAGE_SIZE));
    const snap = await getDocs(pageQuery);
    return {
      users: snap.docs.map((d) => d.data() as AppUser),
      cursor: snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null,
      hasMore: snap.docs.length === PAGE_SIZE,
    };
  }
  // Demo mode (no Firebase): everything comes back in one go.
  return { users: await getUsers(), cursor: null as QueryDocumentSnapshot | null, hasMore: false };
}

export default function AdminCustomersPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [search, setSearch] = useState("");
  const [busyUid, setBusyUid] = useState<string | null>(null);

  const myUid = auth?.currentUser?.uid;

  useEffect(() => {
    (async () => {
      const page = await fetchUsersPage(null);
      setUsers(page.users);
      setCursor(page.cursor);
      setHasMore(page.hasMore);
      setLoading(false);
    })();
  }, []);

  async function loadMore() {
    setLoadingMore(true);
    try {
      const page = await fetchUsersPage(cursor);
      setUsers((prev) => [...prev, ...page.users]);
      setCursor(page.cursor);
      setHasMore(page.hasMore);
    } finally {
      setLoadingMore(false);
    }
  }

  async function toggleRole(u: AppUser) {
    const makingAdmin = u.role !== "admin";
    const who = u.name || u.email;
    const ok = window.confirm(
      makingAdmin
        ? `Give ${who} FULL admin access? They will be able to see every order and customer.`
        : `Remove admin access from ${who}?`
    );
    if (!ok) return;

    setBusyUid(u.uid);
    try {
      if (makingAdmin) await grantAdmin(u.uid, u.email);
      else await revokeAdmin(u.uid);
      // Update just this row — no need to download everyone again.
      setUsers((prev) => prev.map((x) => (x.uid === u.uid ? { ...x, role: makingAdmin ? "admin" : "customer" } : x)));
    } finally {
      setBusyUid(null);
    }
  }

  const term = search.trim().toLowerCase();
  const shown = term
    ? users.filter((u) => (u.name || "").toLowerCase().includes(term) || (u.email || "").toLowerCase().includes(term))
    : users;

  return (
    <div>
      <h1 className="text-2xl font-bold">Customers</h1>
      <p className="text-sm text-gray-400 mt-1">
        Registered accounts. Granting admin gives full access to everything; staff accounts for products, categories
        and blog are added in Firebase instead.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          aria-label="Search customers"
          className="flex-1 min-w-[220px] bg-white shadow-card rounded-full px-4 py-2.5 text-sm outline-none"
        />
        {!loading && (
          <span className="text-xs text-gray-400">
            {term ? `${shown.length} match${shown.length === 1 ? "" : "es"}` : `Showing ${users.length}`}
          </span>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-card mt-3 overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="text-left text-gray-400 border-b border-black/5">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">Loading...</td></tr>
            ) : shown.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                {term ? "No customers match your search." : "No customer accounts yet — they appear here once someone signs in on the storefront."}
              </td></tr>
            ) : (
              shown.map((u) => (
                <tr key={u.uid} className="border-b border-black/5 last:border-0">
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3 text-gray-500">{u.defaultAddress?.phone || "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${u.role === "admin" ? "bg-ink text-white" : "bg-bg"}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {u.uid === myUid ? (
                      <span className="text-xs text-gray-400">You</span>
                    ) : (
                      <button
                        onClick={() => toggleRole(u)}
                        disabled={busyUid === u.uid}
                        className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ml-auto disabled:opacity-50 ${
                          u.role === "admin" ? "bg-accent/10 text-accent" : "bg-green-50 text-green-700"
                        }`}
                      >
                        {u.role === "admin" ? <><ShieldOff size={13} /> Revoke Admin</> : <><ShieldCheck size={13} /> Grant Admin</>}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && hasMore && (
        <div className="flex justify-center mt-4">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="bg-white shadow-card text-ink font-semibold text-sm px-5 py-2 rounded-full disabled:opacity-50"
          >
            {loadingMore ? "Loading..." : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}
