import React from "react";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Button } from "@/components/ui/Buttons";

interface HeaderProps {
  isSidebarOpen: boolean;
  onMenuClick: () => void;
}

function Header({ isSidebarOpen, onMenuClick }: HeaderProps) {
  const { user, logout } = useAdminAuth();

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] px-6 transition-all duration-300">
      <div
        className={`flex items-center gap-3 transition-all duration-300 ${
          isSidebarOpen ? "ml-64" : "ml-0"
        }`}
      >
        {!isSidebarOpen && (
          <Button
            type="button"
            variant="filled"
            size="sm"
            onClick={onMenuClick}
            className="h-9 w-9 p-0 flex items-center justify-center rounded-lg text-base"
            title="Buka Sidebar"
          >
            ☰
          </Button>
        )}

        <span className="text-base font-semibold text-[var(--md-sys-color-on-surface)] leading-none">
          {user?.nama ?? "Pengguna Admin"}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />

        <Button
          type="button"
          variant="filled"
          size="sm"
          onClick={() => void logout()}
        >
          Logout
        </Button>
      </div>
    </header>
  );
}

export default Header;
