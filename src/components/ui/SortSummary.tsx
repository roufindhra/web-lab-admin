import { SORT_LABELS, type SortSpec } from "@/utils/tableSort";

interface SortSummaryProps {
  sorts: SortSpec[];
  onRemove: (column: string) => void;
  onReset: () => void;
  labels?: Record<string, string>;
}

export function SortSummary({
  sorts,
  onRemove,
  onReset,
  labels,
}: SortSummaryProps) {
  if (sorts.length < 2) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-(--md-sys-color-on-surface-variant)">
      <span className="font-semibold">Urut:</span>
      {sorts.map((sort, index) => (
        <span
          key={sort.column}
          className="inline-flex items-center gap-1 rounded-full bg-(--md-sys-color-surface-container-high) px-2 py-1"
        >
          <span>
            {index + 1}. {labels?.[sort.column] ?? SORT_LABELS[sort.column] ?? sort.column}
          </span>
          <span>{sort.direction === "asc" ? "▲" : "▼"}</span>
          <button
            type="button"
            onClick={() => onRemove(sort.column)}
            className="px-0.5 hover:text-red-500"
            aria-label={`Hapus urutan ${sort.column}`}
          >
            ×
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={onReset}
        className="font-semibold underline hover:no-underline"
      >
        Reset urutan
      </button>
    </div>
  );
}
