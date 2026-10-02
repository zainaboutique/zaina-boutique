"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, ShieldOff } from "lucide-react";
import { getUsers, grantAdmin, revokeAdmin } from "@/lib/data";
import type { AppUser } from "@/lib/types";

export default function AdminCustomersPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    setUsers(await getUsers());
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function toggleRole(u: AppUser) {
    if (u.role === "admin") await revokeAdmin(u.uid);
    else await grantAdmin(u.uid, u.email);
    await refresh();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Customers</h1>
      <p className="text-sm text-gray-400 mt-1">
        Registered accounts (Google Sign-In). Grant or revoke admin access here.
      </p>

      <div className="bg-white rounded-2xl shadow-card mt-6 overflow-x-auto">
        <table className="w-full text-sm min-w-[560px]">
          <thead>
            <tr className="text-left text-gray-400 border-b border-black/5">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">No customer accounts yet — they appear here once someone signs in with Google on the storefront.</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u.uid} className="border-b border-black/5 last:border-0">
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${u.role === "admin" ? "bg-ink text-white" : "bg-bg"}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => toggleRole(u)}
                      className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ml-auto ${
                        u.role === "admin" ? "bg-accent/10 text-accent" : "bg-green-50 text-green-700"
                      }`}
                    >
                      {u.role === "admin" ? <><ShieldOff size={13} /> Revoke Admin</> : <><ShieldCheck size={13} /> Grant Admin</>}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
