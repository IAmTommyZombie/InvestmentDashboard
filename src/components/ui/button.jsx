// components/ui/button.js
import * as React from "react";
import { cn } from "../../lib/utils"; // Adjust the path to your utility functions if needed

const Button = React.forwardRef(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-2xl font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

const variants = {
  default: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
  outline:
    "border border-gray-300 text-gray-700 hover:bg-gray-100 focus:ring-gray-500",
  ghost: "bg-transparent hover:bg-gray-100 text-gray-700 focus:ring-gray-500",
  danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
};

const sizes = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-5 py-3 text-lg",
};

export { Button };
