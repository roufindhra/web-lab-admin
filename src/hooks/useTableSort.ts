import { useState } from "react";
import { toggleSortSpec, type SortSpec } from "@/utils/tableSort";

export function useTableSort(
  defaultSort: SortSpec | SortSpec[],
  onChange?: () => void,
) {
  const defaults = Array.isArray(defaultSort) ? defaultSort : [defaultSort];
  const [sorts, setSorts] = useState<SortSpec[]>(defaults);

  const toggleSort = (column: string, additive = false) => {
    setSorts((current) => toggleSortSpec(current, column, additive));
    onChange?.();
  };

  const removeSort = (column: string) => {
    setSorts((current) => {
      if (current.length <= 1) return current;
      return current.filter((sort) => sort.column !== column);
    });
    onChange?.();
  };

  const resetSort = () => {
    setSorts(defaults);
    onChange?.();
  };

  return { sorts, toggleSort, removeSort, resetSort };
}
