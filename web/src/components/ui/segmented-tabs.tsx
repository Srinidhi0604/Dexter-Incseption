"use client";

import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

export function SegmentedTabs<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative grid rounded-2xl border border-white/10 bg-white/5 p-1",
        className,
      )}
      style={{
        gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`,
      }}
    >
      {options.map((option) => {
        const active = option === value;

        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={cn(
              "relative z-10 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
              active ? "text-sky-200" : "text-slate-400",
            )}
          >
            {active ? (
              <motion.span
                layoutId="segmented-tab"
                className="absolute inset-0 z-[-1] rounded-xl bg-sky-500/20"
                transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
              />
            ) : null}
            {option}
          </button>
        );
      })}
    </div>
  );
}
