import React from "react";
import { cn } from "@/utils/cn";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "outlined" | "filled" | "elevated";
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "outlined", ...props }, ref) => {
    const variantClasses = {
      outlined: "md-card-outlined",
      filled: "md-card-filled",
      elevated: "md-card-elevated",
    };

    return (
      <div
        ref={ref}
        className={cn("p-5", variantClasses[variant], className)}
        {...props}
      />
    );
  },
);
