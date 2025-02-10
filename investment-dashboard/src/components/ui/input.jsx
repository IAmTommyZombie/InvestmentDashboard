// components/ui/input.js
import * as React from "react";
import { cn } from "../../lib/utils"; // Adjust the path if needed

const Input = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "block w-full rounded-2xl border border-gray-300 px-4 py-2 text-base shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
        className
      )}
      {...props}
    />
  );
});

Input.displayName = "Input";

export { Input };
