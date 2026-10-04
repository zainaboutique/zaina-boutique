"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { useAdminAuth } from "@/lib/use-admin-auth";
import { isFirebaseConfigured } from "@/lib/firebase";

export default function AdminPortalLoginPage() {
  const { login } = useAdminAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const role = await login(email, password);
      // Staff go straight to Products; the owner goes to the dashboard.
      router.push(role === "staff" ? "/admin/products" : "/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-card p-8 w-full max-w-sm">
        <div className="w-12 h-12 rounded-2xl bg-ink text-white flex items-center justify-center mx-auto">
          <ShieldCheck size={20} />
        </div>
        <h1 className="text-xl font-bold text-center mt-4">Zaina Boutique Admin</h1>
        <p className="text-sm text-gray-400 text-center mt-1">
          Restricted access. This is separate from the customer account portal.
        </p>

        {!isFirebaseConfigured && (
          <p className="text-xs bg-bg text-gray-500 rounded-xl px-3 py-2 mt-4">
            Demo mode: any email/password signs you in locally.
          </p>
        )}
        {isFirebaseConfigured && (
          <p className="text-xs bg-bg text-gray-500 rounded-xl px-3 py-2 mt-4">
            Only admin and staff accounts can sign in here.
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <input
            required
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-bg rounded-2xl px-4 py-3 text-sm outline-none"
          />
          <input
            required
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-bg rounded-2xl px-4 py-3 text-sm outline-none"
          />
          {error && <p className="text-xs text-accent">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-ink text-white font-semibold py-3.5 rounded-full disabled:opacity-50"
          >
            {submitting ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
