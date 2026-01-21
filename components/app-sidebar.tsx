"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Settings,
  Upload,
  Sparkles,
  Archive,
  TrendingUp,
  Newspaper,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/acquisition", icon: LayoutDashboard },
  { name: "Prospects", href: "/acquisition/prospects", icon: Users },
  { name: "Archived", href: "/acquisition/archived", icon: Archive },
  { name: "Intelligence", href: "/acquisition/intelligence", icon: Newspaper },
  { name: "Import CSV", href: "/acquisition/import", icon: Upload },
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Back to Clients", href: "/", icon: TrendingUp },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:top-16 lg:bottom-0 lg:left-0 border-r border-border bg-sidebar">
      <nav className="flex-1 px-3 py-4 space-y-1 mt-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
            A
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">Aleksandar</p>
            <p className="text-xs text-muted-foreground truncate">aleksandar@appworks.rs</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
