import { cn } from "@/utils/cn";
import type { SortSpec } from "@/utils/tableSort";

interface SortableThProps {
  label: string;
  column: string;
  sorts: SortSpec[];
  onSort: (column: string, additive?: boolean) => void;
  className?: string;
  align?: "left" | "center" | "right";
}

const ALIGN_CLASSES = {
  left: "justify-start",
  center: "justify-center",
  right: "justify-end",
} as const;

export function SortableTh({
  label,
  column,
  sorts,
  onSort,
  className,
  align = "left",
}: SortableThProps) {
  const index = sorts.findIndex((sort) => sort.column === column);
  const isActive = index >= 0;
  const sort = isActive ? sorts[index] : null;
  const showPriority = sorts.length > 1 && isActive;

  return (
    <th className={cn("px-4 py-3", className)}>
      <div className={cn("flex w-full", ALIGN_CLASSES[align])}>
        <button
          type="button"
          onClick={(event) => onSort(column, event.shiftKey)}
          title="Klik untuk mengurutkan. Shift+klik untuk menambah urutan."
          className="inline-flex items-center gap-1 uppercase transition-colors hover:text-(--md-sys-color-on-surface)"
        >
          {label}
          <span className="text-[10px]">
            {isActive ? (sort?.direction === "asc" ? "▲" : "▼") : "↕"}
          </span>
          {showPriority && (
            <span className="rounded-full bg-(--md-sys-color-primary-container) px-1 text-[9px] font-semibold text-(--md-sys-color-on-primary-container)">
              {index + 1}
            </span>
          )}
        </button>
      </div>
    </th>
  );
}
