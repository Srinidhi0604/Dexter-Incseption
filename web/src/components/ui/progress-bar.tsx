import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  className,
  indicatorClassName,
}: {
  value: number;
  className?: string;
  indicatorClassName?: string;
}) {
  const safeValue = Math.max(0, Math.min(100, value));

  return (
    <div className={cn("h-2 w-full rounded-full bg-white/10", className)}>
      <div
        className={cn(
          "h-full rounded-full bg-gradient-to-r from-sky-400 to-emerald-400 transition-[width] duration-500",
          indicatorClassName,
        )}
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}
