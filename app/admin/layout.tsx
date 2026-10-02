"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect } from "react";
import {
  LayoutDashboard, Package, FolderTree, ClipboardList, Tag, Users, Image as ImageIcon, Settings as SettingsIcon, LogOut, MessageSquare, FileText, Newspaper,
} from "lucide-react";
import { useAdminAuth } from "@/lib/use-admin-auth";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Product", icon: Package },
  { href: "/admin/categories", label: "Category", icon: FolderTree },
  { href: "/admin/orders", label: "Order", icon: ClipboardList },
  { href: "/admin/discounts", label: "Discount", icon: Tag },
  { href: "/admin/customers", label: "Customer", icon: Users },
  { href: "/admin/reviews", label: "Reviews", icon: MessageSquare },
  { href: "/admin/pages", label: "Pages", icon: FileText },
  { href: "/admin/blog", label: "Blog", icon: Newspaper },
  { href: "/admin/banner", label: "Hero Banner", icon: ImageIcon },
  { href: "/admin/settings", label: "Settings", icon: SettingsIcon },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthed, loading, logout } = useAdminAuth();

  useEffect(() => {
    if (!loading && !isAuthed) {
      router.replace("/admin-portal/login");
    }
  }, [loading, isAuthed, router]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-gray-400">Loading...</div>;
  }

  if (!isAuthed) return null;

  return (
    <div className="min-h-screen bg-bg md:flex">
      <aside className="md:w-60 bg-white border-b md:border-b-0 md:border-r border-black/5 md:min-h-screen">
        <div className="px-5 py-4 font-black tracking-[0.15em] text-sm uppercase">Zaina Boutique Admin</div>
        <nav className="flex md:flex-col overflow-x-auto md:overflow-visible px-3 gap-1 pb-3 md:pb-0">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap ${
                  active ? "bg-ink text-white" : "text-gray-500 hover:bg-bg"
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
          <button
            onClick={async () => {
              await logout();
              router.push("/admin-portal/login");
            }}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-bg md:mt-auto"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </nav>
      </aside>
      <main className="flex-1 p-5 md:p-8">{children}</main>
    </div>
  );
}
