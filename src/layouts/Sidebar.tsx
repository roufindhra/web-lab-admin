import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { SidebarItem } from "../components/SidebarItem";
import type { MenuItem } from "./types";
import { praktikumService } from "@/services";

interface SideBarProps {
  isOpen: boolean;
  onClose: () => void;
}

const STATIC_MENU_ITEMS = [
  { id: "sidebar-dashboard", label: "Dashboard", path: "/" },
  { id: "sidebar-mahasiswa", label: "Mahasiswa", path: "/mahasiswa" },
  { id: "sidebar-kurikulum", label: "Kurikulum", path: "/kurikulum" },
];

const ALAT_MENU_ITEMS: MenuItem = {
  id: 1,
  label: "Alat",
  path: "/alat",
  children: [
    { id: 1, label: "Inventaris Alat", path: "/alat-invent" },
    { id: 2, label: "Peminjaman Alat", path: "/alat-peminjaman" },
    { id: 3, label: "Harga Sewa", path: "/harga-sewa" },
    { id: 4, label: "Riwayat Alat", path: "/alat-log" },
  ],
};

export const Sidebar: React.FC<SideBarProps> = ({ isOpen, onClose }) => {
  const [praktikumMenu, setPraktikumMenu] = useState<MenuItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchMenuItems = async () => {
      try {
        const praktikumList = await praktikumService.getAll();
        const items: MenuItem[] = praktikumList.map((praktikum) => ({
          id: praktikum.id,
          label: praktikum.label,
          path: `/praktikum/${praktikum.slug}`,
        }));

        if (isMounted) {
          setPraktikumMenu({
            id: 0,
            label: "Praktikum",
            path: "/praktikum",
            children: items,
          });
        }
      } catch (error) {
        console.error("Error fetching praktikum menu items:", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchMenuItems();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 backdrop-blur-xs lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-(--md-sys-color-outline-variant) bg-(--md-sys-color-surface-container-high) text-(--md-sys-color-on-surface) transition-transform duration-300 ease-[cubic-bezier(0.2,0.0,0.0,1.0)] ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div
          id="sidebar-header"
          className="flex h-16 items-center justify-between border-b border-(--md-sys-color-outline-variant) px-5"
        >
          <span className="text-base font-bold tracking-tight text-(--md-sys-color-on-surface)">
            Lab SGG Admin
          </span>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-(--md-sys-shape-corner-medium) text-sm font-semibold text-(--md-sys-color-on-surface) transition-colors hover:bg-(--md-sys-color-primary-container)"
            aria-label="close sidebar"
          >
            ✕
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {STATIC_MENU_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              id={item.id}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center rounded-(--md-sys-shape-corner-full) px-4 py-2.5 text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-(--md-sys-color-primary-container) text-(--md-sys-color-on-primary-container)"
                    : "text-(--md-sys-color-on-surface) opacity-80 hover:bg-(--md-sys-color-surface) hover:opacity-100"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}

          <SidebarItem item={ALAT_MENU_ITEMS} />

          {isLoading ? (
            <div className="px-4 py-2 text-xs font-medium text-(--md-sys-color-on-surface) opacity-50 animate-pulse">
              Memuat praktikum...
            </div>
          ) : (
            praktikumMenu && <SidebarItem item={praktikumMenu} />
          )}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
