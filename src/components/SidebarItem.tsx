import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import type { MenuItem } from "../layouts/types";

interface SidebarItemProps {
  item: MenuItem;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({ item }) => {
  const [isOpen, setIsOpen] = useState(true);

  const elementId = `sidebar-link-${item.label.toLowerCase().replace(/\s+/g, "-")}`;

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex-1 flex items-center rounded-(--md-sys-shape-corner-full) px-4 py-2 text-xs font-semibold transition-all duration-150 select-none ${
      isActive
        ? "bg-(--md-sys-color-primary-container) text-(--md-sys-color-on-primary-container)"
        : "text-(--md-sys-color-on-surface) hover:bg-(--md-sys-color-on-surface)/10 active:bg-(--md-sys-color-on-surface)/15"
    }`;

  if (item.children && item.children.length > 0) {
    return (
      <div className="mb-1" id={elementId}>
        <div className="flex items-center justify-between gap-1">
          <NavLink to={item.path ?? "#"} className={navLinkClass}>
            {item.label}
          </NavLink>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="rounded-full p-1.5 text-xs text-(--md-sys-color-on-surface-variant) hover:bg-(--md-sys-color-on-surface)/10 transition-colors"
            aria-label={`Toggle ${item.label}`}
          >
            {isOpen ? "▾" : "▸"}
          </button>
        </div>

        {isOpen && (
          <div className="pl-3 mt-1 space-y-1 border-l-2 border-(--md-sys-color-outline-variant)/40 ml-4">
            {item.children.map((child) => (
              <SidebarItem key={child.id} item={child} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <NavLink id={elementId} to={item.path ?? "/"} className={navLinkClass}>
      {item.label}
    </NavLink>
  );
};
