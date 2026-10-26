import React from "react";
import { cn } from "@/utils/cn";

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  onCheckedChange?: (checked: boolean) => void;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    { className, label, checked, onCheckedChange, onChange, id, ...props },
    ref,
  ) => {
    const generatedId = id || React.useId();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e);
      onCheckedChange?.(e.target.checked);
    };

    return (
      <div className="flex items-center gap-2 select-none">
        <input
          ref={ref}
          type="checkbox"
          id={generatedId}
          checked={checked}
          onChange={handleChange}
          className={cn(
            "h-4 w-4 rounded border-(--md-sys-color-outline) bg-(--md-sys-color-surface) text-(--md-sys-color-primary) focus:ring-(--md-sys-color-primary) accent-(--md-sys-color-primary) cursor-pointer",
            className,
          )}
          {...props}
        />
        {label && (
          <label
            htmlFor={generatedId}
            className="text-xs font-medium text-(--md-sys-color-on-surface) cursor-pointer"
          >
            {label}
          </label>
        )}
      </div>
    );
  },
);
