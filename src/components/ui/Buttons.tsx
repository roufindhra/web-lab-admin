import React from "react";
import { cn } from "@/utils/cn";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "filled" | "outlined" | "text" | "fab";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "filled",
      size = "md",
      children,
      type = "button",
      ...props
    },
    ref,
  ) => {
    const variantClasses = {
      filled:
        "md-button-filled inline-flex items-center justify-center font-medium transition-all",
      outlined:
        "md-button-outlined inline-flex items-center justify-center font-medium transition-all",
      text: "md-button-text inline-flex items-center justify-center font-medium transition-all",
      fab: "md-fab inline-flex items-center justify-center gap-2 font-medium transition-all",
    };

    const sizeClasses = {
      sm: "px-3.5 py-2 text-xs font-semibold leading-none gap-1.5",
      md: "px-5 py-2.5 text-sm font-semibold leading-none gap-2",
      lg: "px-6 py-3.5 text-base font-semibold leading-none gap-2.5",
    };

    const fabSizeClasses = {
      sm: "p-2.5 text-xs",
      md: "p-3.5 text-sm",
      lg: "p-4 text-base",
    };

    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "cursor-pointer select-none active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
          variantClasses[variant],
          variant === "fab" ? fabSizeClasses[size] : sizeClasses[size],
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
