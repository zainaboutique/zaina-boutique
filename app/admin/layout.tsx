"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect } from "react";
import {
  LayoutDashboard, Package, FolderTree, ClipboardList, Tag, Users, Image as ImageIcon, Settings as SettingsIcon, LogOut, MessageSquare, FileText, Newspaper,
} from "lucide-react";
import { useAdminAuth } from "@/lib/use-admin-auth";

// `staff: true` = also visible to staff accounts. Everything else is owner-only.
const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, staff: false },
  { href: "/admin/products", label: "Product", icon: Package, staff: true },
  { href: "/admin/categories", label: "Category", icon: FolderTree, staff: true },
  { href: "/admin/orders", label: "Order", icon: ClipboardList, staff: false },
  { href: "/admin/discounts", label: "Discount", icon: Tag, staff: false },
  { href: "/admin/customers", label: "Customer", icon: Users, staff: false },
  { href: "/admin/reviews", label: "Reviews", icon: MessageSquare, staff: false },
  { href: "/admin/pages", label: "Pages", icon: FileText, staff: false },
  { href: "/admin/blog", label: "Blog", icon: Newspaper, staff: true },
  { href: "/admin/banner", label: "Hero Banner", icon: ImageIcon, staff: false },
  { href: "/admin/settings", label: "Settings", icon: SettingsIcon, staff: false },
];

const STAFF_PATHS = NAV.filter((n) => n.staff).map((n) => n.href);

function staffMayOpen(path: string): boolean {
  return STAFF_PATHS.some((p) => path === p || path.startsWith(p + "/"));
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const path = pathname ?? "";
  const router = useRouter();
  const { isAuthed, loading, logout, role } = useAdminAuth();
  const isStaff = role === "staff";

  useEffect(() => {
    if (loading) return;
    if (!isAuthed) {
      router.replace("/admin-portal/login");
      return;
    }
    // Staff may only use Products, Categories and Blog — anything else
    // (even typed into the address bar) is sent back to Products.
    if (isStaff && !staffMayOpen(path)) {
      router.replace("/admin/products");
    }
  }, [loading, isAuthed, isStaff, path, router]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-gray-400">Loading...</div>;
  }

  if (!isAuthed) return null;
  if (isStaff && !staffMayOpen(path)) return null;

  const visibleNav = isStaff ? NAV.filter((n) => n.staff) : NAV;

  return (
    <div className="min-h-screen bg-bg md:flex">
      <aside className="md:w-60 bg-white border-b md:border-b-0 md:border-r border-black/5 md:min-h-screen">
        <div className="px-5 py-4 font-black tracking-[0.15em] text-sm uppercase">
          Zaina Boutique Admin
          {isStaff && <span className="block text-[10px] font-semibold tracking-widest text-gray-400 mt-1">Staff access</span>}
        </div>
        <nav className="flex md:flex-col overflow-x-auto md:overflow-visible px-3 gap-1 pb-3 md:pb-0">
          {visibleNav.map(({ href, label, icon: Icon }) => {
            const active = path === href;
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
