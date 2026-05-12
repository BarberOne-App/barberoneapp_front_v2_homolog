import { Outlet } from "react-router-dom";
import type { ComponentType } from "react";

interface ProfileLayoutProps {
  Sidebar: ComponentType;
}

export function ProfileLayout({ Sidebar }: ProfileLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="ml-64 flex-1">
        <Outlet />
      </main>
    </div>
  );
}
