import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { ChevronLeft, ChevronRight, LogOut, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuth } from "../../hooks/useAuth";

export interface SidebarItem {
  icon: LucideIcon;
  label: string;
  href: string;
}

export interface SidebarSection {
  title?: string;
  items: SidebarItem[];
}

interface ProfileSidebarProps {
  title: string;
  homeHref: string;
  sections: SidebarSection[];
}

export function ProfileSidebar({ title, homeHref, sections }: ProfileSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const menuSections = [
    ...sections,
    { items: [{ icon: LogOut, label: "Sair", href: "/logout" }] },
  ];

  const isActive = (href: string) => location.pathname === href;

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex items-center justify-between border-b border-sidebar-border p-4">
        <Link to={homeHref} className="flex items-center gap-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary">
            <span className="text-sm font-bold text-primary-foreground">B</span>
          </div>
          {!collapsed && (
            <span className="font-semibold text-sidebar-foreground">{title}</span>
          )}
        </Link>
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-md p-1 text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {!collapsed && (
        <div className="p-3">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={14}
            />
            <input
              type="text"
              placeholder="Buscar"
              className="w-full rounded-md border border-border bg-secondary py-2 pl-9 pr-8 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto py-2">
        {menuSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="mb-2">
            {section.title && !collapsed && (
              <h3 className="px-4 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {section.title}
              </h3>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const isLogout = item.href === "/logout";

                return (
                  <li key={`${item.href}-${item.label}`}>
                    {isLogout ? (
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="mx-2 flex w-[calc(100%-1rem)] items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      >
                        <item.icon size={18} className="flex-shrink-0" />
                        {!collapsed && <span>{item.label}</span>}
                      </button>
                    ) : (
                      <Link
                        to={item.href}
                        className={cn(
                          "mx-2 flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                          isActive(item.href)
                            ? "bg-primary text-primary-foreground"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                        )}
                      >
                        <item.icon size={18} className="flex-shrink-0" />
                        {!collapsed && <span>{item.label}</span>}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
