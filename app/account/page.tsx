import type { Metadata } from "next";
import AccountClient from "./AccountClient";

export const metadata: Metadata = {
  title: "My Account, Orders & Saved Address",
  description: "Sign in to your Zaina Boutique account to track past orders, save your delivery address, and manage your profile details in one place.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/account" },
};

export default function AccountPage() {
  return <AccountClient />;
}
