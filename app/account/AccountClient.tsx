"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { onAuthStateChanged, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, type User } from "firebase/auth";
import { LogOut, ShieldCheck, ShoppingBag, Package } from "lucide-react";
import { auth, googleProvider, isFirebaseConfigured } from "@/lib/firebase";
import { upsertUser, getUserByUid, getOrdersByEmail } from "@/lib/data";
import { readLocal, writeLocal, formatPrice } from "@/lib/utils";
import { useCartStore } from "@/store/cart";
import type { AppUser, Order, SavedAddress } from "@/lib/types";

const DEMO_CUSTOMERS_KEY = "zaina_demo_customers";
const DEMO_SESSION_KEY = "zaina_demo_customer_session";

interface DemoCustomer {
  uid: string;
  name: string;
  email: string;
  password: string; // demo mode only — plaintext, never do this with real auth
  createdAt: number;
}

const STATUS_TEXT: Record<string, string> = {
  Pending: "text-gray-500",
  Processed: "text-blue-600",
  Shipped: "text-purple-600",
  Delivered: "text-green-600",
  Cancelled: "text-red-600",
};

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const openCart = useCartStore((s) => s.open);

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const [addressForm, setAddressForm] = useState<SavedAddress>({ phone: "", address: "", city: "" });
  const [addressSaving, setAddressSaving] = useState(false);
  const [addressSaved, setAddressSaved] = useState(false);

  const [nameForm, setNameForm] = useState("");
  const [nameSaving, setNameSaving] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);

  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsub = onAuthStateChanged(auth, async (u) => {
        setUser(u);
        if (u) {
          const p = await getUserByUid(u.uid);
          setProfile(p);
        } else {
          setProfile(null);
        }
        setLoading(false);
      });
      return () => unsub();
    }
    const sessionUid = readLocal<string | null>(DEMO_SESSION_KEY, null);
    if (sessionUid) {
      getUserByUid(sessionUid).then((p) => {
        setProfile(p);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const signedInEmail = user?.email || profile?.email;
  const isSignedIn = Boolean(user || profile);

  useEffect(() => {
    if (profile) {
      setAddressForm(profile.defaultAddress || { phone: "", address: "", city: "" });
      setNameForm(profile.name);
    }
  }, [profile]);

  useEffect(() => {
    if (signedInEmail) {
      setOrdersLoading(true);
      getOrdersByEmail(signedInEmail).then((o) => {
        setOrders(o);
        setOrdersLoading(false);
      });
    }
  }, [signedInEmail]);

  async function handleGoogleSignIn() {
    setError("");
    if (!isFirebaseConfigured || !auth || !googleProvider) {
      setError("Google Sign-In requires Firebase to be connected. See the README for setup steps.");
      return;
    }
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const existing = await getUserByUid(cred.user.uid);
      const upserted: AppUser = {
        uid: cred.user.uid,
        email: cred.user.email || "",
        name: cred.user.displayName || "Customer",
        photoURL: cred.user.photoURL || undefined,
        role: existing?.role || "customer",
        authProvider: "google",
        createdAt: existing?.createdAt || Date.now(),
        defaultAddress: existing?.defaultAddress,
      };
      await upsertUser(upserted);
      setProfile(upserted);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed.");
    }
  }

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (isFirebaseConfigured && auth) {
        if (mode === "register") {
          const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
          const newProfile: AppUser = {
            uid: cred.user.uid,
            email: form.email,
            name: form.name || "Customer",
            role: "customer",
            authProvider: "password",
            createdAt: Date.now(),
          };
          await upsertUser(newProfile);
          setProfile(newProfile);
        } else {
          const cred = await signInWithEmailAndPassword(auth, form.email, form.password);
          setProfile(await getUserByUid(cred.user.uid));
        }
      } else {
        // Demo mode: simple localStorage-backed accounts. Not secure — for
        // local testing only, so the account flow is clickable before
        // Firebase is connected.
        const customers = readLocal<DemoCustomer[]>(DEMO_CUSTOMERS_KEY, []);
        if (mode === "register") {
          if (customers.some((c) => c.email.toLowerCase() === form.email.toLowerCase())) {
            throw new Error("An account with this email already exists. Try logging in instead.");
          }
          const uid = `demo_${Date.now()}`;
          const newCustomer: DemoCustomer = { uid, name: form.name, email: form.email, password: form.password, createdAt: Date.now() };
          writeLocal(DEMO_CUSTOMERS_KEY, [...customers, newCustomer]);
          await upsertUser({ uid, email: form.email, name: form.name, role: "customer", authProvider: "password", createdAt: newCustomer.createdAt });
          writeLocal(DEMO_SESSION_KEY, uid);
          setProfile(await getUserByUid(uid));
        } else {
          const match = customers.find((c) => c.email.toLowerCase() === form.email.toLowerCase() && c.password === form.password);
          if (!match) throw new Error("Incorrect email or password.");
          writeLocal(DEMO_SESSION_KEY, match.uid);
          setProfile(await getUserByUid(match.uid));
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSignOut() {
    if (isFirebaseConfigured && auth) {
      await signOut(auth);
    } else {
      writeLocal(DEMO_SESSION_KEY, null);
      setProfile(null);
    }
  }

  async function saveAddress() {
    if (!profile) return;
    setAddressSaving(true);
    try {
      const updated = { ...profile, defaultAddress: addressForm };
      await upsertUser(updated);
      setProfile(updated);
      setAddressSaved(true);
      setTimeout(() => setAddressSaved(false), 2000);
    } finally {
      setAddressSaving(false);
    }
  }

  async function saveName() {
    if (!profile) return;
    setNameSaving(true);
    try {
      const updated = { ...profile, name: nameForm };
      await upsertUser(updated);
      setProfile(updated);
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 2000);
    } finally {
      setNameSaving(false);
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-gray-400">Loading...</div>;
  }

  if (isSignedIn) {
    const displayName = profile?.name || user?.displayName || "Customer";
    const photo = profile?.photoURL || user?.photoURL;

    return (
      <div className="min-h-screen bg-bg pb-8">
        <div className="max-w-2xl mx-auto px-4 pt-10 space-y-4">
          <div className="bg-white rounded-3xl shadow-card p-6 flex items-center gap-4">
            {photo ? (
              <Image src={photo} alt={displayName} width={56} height={56} className="rounded-full" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-bg flex items-center justify-center text-lg font-bold shrink-0">
                {displayName.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="font-bold text-lg truncate">{displayName}</h1>
              <p className="text-sm text-gray-400 truncate">{signedInEmail}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={openCart} className="flex items-center justify-center gap-2 bg-white rounded-2xl shadow-card py-4 text-sm font-semibold">
              <ShoppingBag size={16} /> My Bag
            </button>
            <Link href="/track" className="flex items-center justify-center gap-2 bg-white rounded-2xl shadow-card py-4 text-sm font-semibold">
              <Package size={16} /> Track an Order
            </Link>
          </div>

          <div className="bg-white rounded-3xl shadow-card p-6">
            <h2 className="font-bold mb-3">My Orders</h2>
            {ordersLoading ? (
              <p className="text-sm text-gray-400">Loading...</p>
            ) : orders.length === 0 ? (
              <p className="text-sm text-gray-400">No orders yet — placed orders using this email will show up here.</p>
            ) : (
              <div className="divide-y divide-black/5">
                {orders.map((o) => (
                  <Link key={o.id} href={`/track?order=${o.orderNumber}`} className="flex items-center justify-between py-3 text-sm">
                    <div>
                      <p className="font-medium">{o.orderNumber}</p>
                      <p className="text-xs text-gray-400">{new Date(o.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatPrice(o.total)}</p>
                      <p className={`text-xs font-medium ${STATUS_TEXT[o.status] || "text-gray-500"}`}>{o.status}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl shadow-card p-6">
            <h2 className="font-bold mb-3">My Address</h2>
            <div className="space-y-2">
              <input
                placeholder="Phone number"
                value={addressForm.phone}
                onChange={(e) => setAddressForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full bg-bg rounded-2xl px-4 py-3 text-sm outline-none"
              />
              <input
                placeholder="Delivery address"
                value={addressForm.address}
                onChange={(e) => setAddressForm((f) => ({ ...f, address: e.target.value }))}
                className="w-full bg-bg rounded-2xl px-4 py-3 text-sm outline-none"
              />
              <input
                placeholder="City"
                value={addressForm.city}
                onChange={(e) => setAddressForm((f) => ({ ...f, city: e.target.value }))}
                className="w-full bg-bg rounded-2xl px-4 py-3 text-sm outline-none"
              />
              <button onClick={saveAddress} disabled={addressSaving} className="w-full bg-ink text-white font-semibold py-3 rounded-full text-sm disabled:opacity-50">
                {addressSaving ? "Saving..." : "Save Address"}
              </button>
              {addressSaved && <p className="text-xs text-green-600 text-center">Saved.</p>}
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-card p-6">
            <h2 className="font-bold mb-3">My Profile</h2>
            <div className="space-y-2">
              <input
                placeholder="Full name"
                value={nameForm}
                onChange={(e) => setNameForm(e.target.value)}
                className="w-full bg-bg rounded-2xl px-4 py-3 text-sm outline-none"
              />
              <input value={signedInEmail || ""} disabled className="w-full bg-bg/60 rounded-2xl px-4 py-3 text-sm outline-none text-gray-400" />
              <button onClick={saveName} disabled={nameSaving} className="w-full bg-ink text-white font-semibold py-3 rounded-full text-sm disabled:opacity-50">
                {nameSaving ? "Saving..." : "Save Profile"}
              </button>
              {nameSaved && <p className="text-xs text-green-600 text-center">Saved.</p>}
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="flex items-center justify-center gap-2 w-full bg-accent text-white font-semibold py-3.5 rounded-full text-sm"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg pb-8 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-card p-8 w-full max-w-sm text-center">
        <div className="w-12 h-12 rounded-2xl bg-bg flex items-center justify-center mx-auto">
          <ShieldCheck size={20} />
        </div>
        <h1 className="font-bold text-lg mt-4">{mode === "login" ? "Sign in to Zaina Boutique" : "Create your account"}</h1>
        <p className="text-sm text-gray-400 mt-1">Save your details and track orders faster.</p>

        <div className="flex bg-bg rounded-full p-1 mt-5">
          <button onClick={() => setMode("login")} className={`flex-1 text-sm font-semibold py-2 rounded-full ${mode === "login" ? "bg-white shadow-card" : "text-gray-400"}`}>Log In</button>
          <button onClick={() => setMode("register")} className={`flex-1 text-sm font-semibold py-2 rounded-full ${mode === "register" ? "bg-white shadow-card" : "text-gray-400"}`}>Register</button>
        </div>

        {error && <p className="text-xs text-accent mt-3">{error}</p>}

        <form onSubmit={handleEmailAuth} className="mt-4 space-y-2 text-left">
          {mode === "register" && (
            <input
              required
              placeholder="Full name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full bg-bg rounded-2xl px-4 py-3 text-sm outline-none"
            />
          )}
          <input
            required
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="w-full bg-bg rounded-2xl px-4 py-3 text-sm outline-none"
          />
          <input
            required
            type="password"
            placeholder="Password"
            minLength={6}
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            className="w-full bg-bg rounded-2xl px-4 py-3 text-sm outline-none"
          />
          <button type="submit" disabled={submitting} className="w-full bg-ink text-white font-semibold py-3 rounded-full text-sm disabled:opacity-50">
            {submitting ? "Please wait..." : mode === "login" ? "Log In" : "Create Account"}
          </button>
        </form>

        <div className="flex items-center gap-2 my-4">
          <div className="flex-1 h-px bg-black/10" />
          <span className="text-xs text-gray-400">or</span>
          <div className="flex-1 h-px bg-black/10" />
        </div>

        <button
          onClick={handleGoogleSignIn}
          className="w-full border border-black/10 font-semibold py-3 rounded-full text-sm flex items-center justify-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6 29.6 4 24 4c-7.6 0-14.1 4.3-17.7 10.7z"/><path fill="#4CAF50" d="M24 44c5.5 0 10.4-1.9 14.2-5.1l-6.6-5.4C29.6 35.4 27 36 24 36c-5.3 0-9.7-3.4-11.3-8.1l-6.6 5.1C9.9 39.7 16.4 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.5l6.6 5.4C41.4 35.9 44 30.3 44 24c0-1.3-.1-2.7-.4-3.5z"/></svg>
          Sign in with Google
        </button>
        {!isFirebaseConfigured && (
          <p className="text-xs text-gray-400 mt-3">
            Demo mode: email/password accounts above work locally. Google Sign-In needs Firebase connected — see the README.
          </p>
        )}
      </div>
    </div>
  );
}
