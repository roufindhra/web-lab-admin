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
    { id: 3, label: "Riwayat Alat", path: "/alat-log" },
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
          className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-(--md-sys-color-primary) text-(--md-sys-color-on-primary) transition-transform duration-300 ease-[cubic-bezier(0.2,0.0,0.0,1.0)] ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div
          id="sidebar-header"
          className="flex h-16 items-center justify-between px-4"
        >
          <span className="text-lg font-bold tracking-tight">
            Lab SGG Admin
          </span>
          <button
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-(--md-sys-color-on-surface) bg-gray-700 hover:bg-gray-500"
            aria-label="close sidebar"
          >
            ☰
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {STATIC_MENU_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              id={item.id}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center rounded-(--md-sys-shape-corner-full) px-4 py-2.5 text-sm font-medium hover:bg-gray-500 transition-colors ${
                  isActive
                    ? "bg-(--md-sys-color-primary-container) text-(--md-sys-color-on-primary-container) font-semibold"
                    : "hover:bg-(--md-sys-color-primary-container)"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}

          <SidebarItem item={ALAT_MENU_ITEMS} />

          {isLoading ? (
            <div className="px-4 py-2 text-xs text-gray-400 animate-pulse">
              Loading courses...
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
