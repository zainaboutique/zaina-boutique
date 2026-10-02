"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from "firebase/auth";
import { auth, isFirebaseConfigured } from "./firebase";
import { isAdminUid } from "./data";

// Demo-mode fallback: when Firebase Auth isn't configured yet, admin access
// is gated by a simple session flag so the dashboard remains fully clickable.
const DEMO_SESSION_KEY = "sky_admin_demo_session";

export function useAdminAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [demoAuthed, setDemoAuthed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsub = onAuthStateChanged(auth, async (u) => {
        setUser(u);
        if (u) {
          // Real security gate: authentication alone isn't enough once
          // Google Sign-In is enabled for customers — only UIDs listed in
          // the `admins` collection may reach the dashboard.
          setIsAdmin(await isAdminUid(u.uid));
        } else {
          setIsAdmin(false);
        }
        setLoading(false);
      });
      return () => unsub();
    } else {
      setDemoAuthed(sessionStorage.getItem(DEMO_SESSION_KEY) === "true");
      setLoading(false);
    }
  }, []);

  async function login(email: string, password: string) {
    if (isFirebaseConfigured && auth) {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const admin = await isAdminUid(cred.user.uid);
      if (!admin) {
        await signOut(auth);
        throw new Error("This account does not have admin access.");
      }
      setIsAdmin(true);
      return;
    }
    // Demo mode: any non-empty credentials sign you in locally.
    if (email && password) {
      sessionStorage.setItem(DEMO_SESSION_KEY, "true");
      setDemoAuthed(true);
    } else {
      throw new Error("Enter an email and password.");
    }
  }

  async function logout() {
    if (isFirebaseConfigured && auth) {
      await signOut(auth);
      return;
    }
    sessionStorage.removeItem(DEMO_SESSION_KEY);
    setDemoAuthed(false);
  }

  const isAuthed = isFirebaseConfigured ? isAdmin : demoAuthed;

  return { isAuthed, loading, login, logout, user };
}
