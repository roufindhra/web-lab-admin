import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import type { MenuItem } from "../layouts/types";

interface SidebarItemProps {
  item: MenuItem;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({ item }) => {
  const [isOpen, setIsOpen] = useState(true);

  const elementId = `sidebar-link-${item.label.toLowerCase().replace(/\s+/g, "-")}`;

  if (item.children && item.children.length > 0) {
    return (
      <div className="mb-2" id={elementId}>
        {" "}
        <div className="flex items-center justify-between">
          <NavLink
            to={item.path ?? "/"}
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
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="rounded-md px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
            aria-label={`Toggle ${item.label}`}
          >
            {isOpen ? "▾" : "▸"}
          </button>
        </div>
        {isOpen && (
          <div className="pl-4">
            {item.children.map((child) => (
              <SidebarItem key={child.id} item={child} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <NavLink
      id={elementId}
      to={item.path ?? "/"}
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
  );
};
