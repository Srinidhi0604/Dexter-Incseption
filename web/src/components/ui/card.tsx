import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-3xl border border-white/10 bg-[var(--cp-card)] p-4 shadow-[0_12px_30px_rgba(0,0,0,0.32)]",
        className,
      )}
    >
      {children}
    </section>
  );
}
