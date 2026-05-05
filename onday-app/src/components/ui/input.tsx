import * as React from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";

import { cn } from "@/lib/utils";

// design-tokens §6.3 Input/Field
//   border 1.5px / radius 12px / height 56px / padding 0 14px / 14px-500
//   focus: border primary + box-shadow 0 0 0 4px rgba(37,99,235,0.10)
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-14 w-full min-w-0 rounded-lg border-[1.5px] border-card-border bg-surface px-3.5 text-body text-ink",
        "transition-colors outline-none",
        "placeholder:text-ink-3",
        "focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10",
        "file:inline-flex file:h-8 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-ink",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-surface-soft disabled:opacity-60",
        "aria-invalid:border-danger aria-invalid:ring-4 aria-invalid:ring-danger/15",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
