"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "./firebase";
import { isAdminUid } from "./data";

// Demo-mode fallback: when Firebase Auth isn't configured yet, admin access
// is gated by a simple session flag so the dashboard remains fully clickable.
const DEMO_SESSION_KEY = "sky_admin_demo_session";

// "admin" = the owner (everything). "staff" = may only manage Products,
// Categories and Blog. Staff are the accounts listed in the `staff` collection.
export type AdminRole = "admin" | "staff";

async function lookupRole(uid: string): Promise<AdminRole | null> {
  if (await isAdminUid(uid)) return "admin";
  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDoc(doc(db, "staff", uid));
      if (snap.exists()) return "staff";
    } catch {
      // Not readable = not staff.
    }
  }
  return null;
}

export function useAdminAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AdminRole | null>(null);
  const [demoAuthed, setDemoAuthed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsub = onAuthStateChanged(auth, async (u) => {
        setUser(u);
        if (u) {
          // Real security gate: authentication alone isn't enough once
          // Google Sign-In is enabled for customers — only UIDs listed in
          // the `admins` or `staff` collections may reach the dashboard.
          setRole(await lookupRole(u.uid));
        } else {
          setRole(null);
        }
        setLoading(false);
      });
      return () => unsub();
    } else {
      setDemoAuthed(sessionStorage.getItem(DEMO_SESSION_KEY) === "true");
      setLoading(false);
    }
  }, []);

  async function login(email: string, password: string): Promise<AdminRole> {
    if (isFirebaseConfigured && auth) {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const found = await lookupRole(cred.user.uid);
      if (!found) {
        await signOut(auth);
        throw new Error("This account does not have admin access.");
      }
      setRole(found);
      return found;
    }
    // Demo mode: any non-empty credentials sign you in locally.
    if (email && password) {
      sessionStorage.setItem(DEMO_SESSION_KEY, "true");
      setDemoAuthed(true);
      return "admin";
    }
    throw new Error("Enter an email and password.");
  }

  async function logout() {
    if (isFirebaseConfigured && auth) {
      await signOut(auth);
      return;
    }
    sessionStorage.removeItem(DEMO_SESSION_KEY);
    setDemoAuthed(false);
  }

  const effectiveRole: AdminRole | null = isFirebaseConfigured ? role : demoAuthed ? "admin" : null;
  const isAuthed = effectiveRole !== null;

  return { isAuthed, loading, login, logout, user, role: effectiveRole, isOwner: effectiveRole === "admin" };
}
