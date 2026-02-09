import React from "react";
import { cn } from "@/lib/utils";

export function MonthPicker({ value, onChange, className, testId }) {
  return (
    <input
      data-testid={testId}
      className={cn(
        "h-10 w-[160px] rounded-xl border border-input bg-background px-3 text-sm shadow-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      type="month"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
