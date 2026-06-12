import * as React from "react";
import { cn } from "./utils";

export function Alert({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="status"
      className={cn("rounded-lg border bg-card p-4 text-sm", className)}
      {...props}
    />
  );
}
