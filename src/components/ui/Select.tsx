import React from "react";
import { cn } from "@/utils/cn";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
  label?: string;
  onValueChange?: (value: string) => void;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    { className, options, label, value, onValueChange, onChange, id, ...props },
    ref,
  ) => {
    const generatedId = id || React.useId();

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      onChange?.(e);
      onValueChange?.(e.target.value);
    };

    return (
      <div className="w-full space-y-1">
        {label && (
          <label
            htmlFor={generatedId}
            className="block text-xs font-semibold text-(--md-sys-color-on-surface)"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={generatedId}
          value={value}
          onChange={handleChange}
          className={cn(
            "w-full rounded-(--md-sys-shape-corner-medium) border border-(--md-sys-color-outline) bg-(--md-sys-color-surface) px-3 py-2 text-xs text-(--md-sys-color-on-surface) transition-all focus:border-(--md-sys-color-primary) focus:outline-none focus:ring-1 focus:ring-(--md-sys-color-primary)",
            className,
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    );
  },
);
